from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from dotenv import load_dotenv
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from common.kafka import make_producer, make_consumer
from common.events import TOPIC_PROV_LOCATION, EV_PROVIDER_LOCATION, TOPIC_REQ_LIFECYCLE, EV_REQUEST_PAID

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
PROVIDER_LOCATION_TOPIC = os.getenv(
    "TOPIC_PROV_LOCATION", TOPIC_PROV_LOCATION
)
REQ_LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="provider-service")

app = FastAPI(title="provider-service")

producer: Optional[AIOKafkaProducer] = None
consumer: Optional[AIOKafkaConsumer] = None

class Provider(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str = ""
    latitude: float
    longitude: float
    status: str = "available"  # available/offline/busy
    rating: float = 5.0
    user_id: str


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


class StatusUpdate(BaseModel):
    status: str

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"provider"}


@app.on_event("startup")
async def start():
    global producer, consumer
    producer = await make_producer()
    consumer = make_consumer(REQ_LIFECYCLE_TOPIC, group_id="provider-wallet-group")
    await consumer.start()
    import asyncio
    asyncio.create_task(consume_wallet_events())

@app.on_event("shutdown")
async def stop():
    if producer:
        await producer.stop()
    if consumer:
        await consumer.stop()
    client.close()

async def consume_wallet_events():
    assert consumer is not None
    async for msg in consumer:
        val = msg.value
        if val.get("type") == EV_REQUEST_PAID:
            await process_earnings(val)

async def process_earnings(data: dict):
    provider_id = data.get("provider_id")
    amount = data.get("amount", 0)
    request_id = data.get("request_id")
    
    if not provider_id:
        print(f"ERROR: No provider_id in payment event for request {request_id}")
        return
    
    # Calculate provider's earnings (80% of payment)
    earnings = amount * 0.8
    
    from datetime import datetime
    transaction = {
        "id": f"tx_{request_id}",
        "type": "earning",
        "amount": earnings,
        "description": f"Service payment for request {request_id}",
        "date": datetime.now().isoformat()
    }
    
    # Update or create wallet
    result = await db.wallets.update_one(
        {"provider_id": provider_id},
        {
            "$inc": {"balance": earnings},
            "$push": {"transactions": transaction},
            "$setOnInsert": {"withdraw_limit": 5000.0}
        },
        upsert=True
    )
    
    print(f"Credited {earnings} to provider {provider_id} wallet")

@app.get("/providers/{provider_id}/wallet", response_model=WalletData)
async def get_wallet(provider_id: str):
    doc = await db.wallets.find_one({"provider_id": provider_id}, {"_id":0})
    if not doc:
        return {"balance": 0.0, "withdraw_limit": 0.0, "transactions": []}
    return doc

@app.post("/providers/{provider_id}/withdraw")
async def withdraw_funds(provider_id: str):
    # Debit logic
    wallet = await db.wallets.find_one({"provider_id": provider_id})
    if not wallet or wallet["balance"] <= 0:
        return {"status": "error", "message": "insufficient funds"}
    
    await db.wallets.update_one(
        {"provider_id": provider_id},
        {"$inc": {"balance": -wallet["balance"]}, "$push": {"transactions": {
            "id": "tx_with_" + provider_id, # mock id
            "type": "withdrawal",
            "amount": -wallet["balance"],
            "description": "Withdrawal to Bank",
            "date": "Now"
        }}}
    )
    return {"status": "success", "message": "Funds withdrawn"}

@app.get("/providers", response_model=List[Provider])
async def list_providers():
    cur = db.providers.find({}, {"_id":0})
    return [doc async for doc in cur]

@app.post("/providers", response_model=Provider)
async def create_provider(p: Provider):
    await db.providers.insert_one(p.dict())
    return p


@app.put("/providers/{provider_id}/location")
async def update_location(provider_id: str, loc: LocationUpdate):
    res = await db.providers.update_one(
        {"id": provider_id},
        {"$set": {"latitude": loc.latitude, "longitude": loc.longitude}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="provider not found")
    if producer:
        await producer.send_and_wait(
            PROVIDER_LOCATION_TOPIC,
            {
                "type": EV_PROVIDER_LOCATION,
                "provider_id": provider_id,
                "location": {"lat": loc.latitude, "lng": loc.longitude},
            },
        )
    return {"status": "location updated"}


@app.put("/providers/{provider_id}/status")
async def update_status(provider_id: str, data: StatusUpdate):
    res = await db.providers.update_one(
        {"id": provider_id},
        {"$set": {"status": data.status}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="provider not found")
    return {"status": data.status}
