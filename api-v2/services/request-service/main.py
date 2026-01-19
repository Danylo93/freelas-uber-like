from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaProducer
import os, asyncio
from dotenv import load_dotenv

from common.kafka import make_producer
from common.events import (
    TOPIC_REQ_LIFECYCLE,
    EV_REQUEST_CREATED,
    EV_REQUEST_ACCEPTED,
    EV_REQUEST_ACCEPTED,
    EV_STATUS_CHANGED,
    EV_REQUEST_PAID,
)

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
REQ_TOPIC = os.getenv("TOPIC_REQUESTS", "service.requests")
LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="request-service")
producer: Optional[AIOKafkaProducer] = None

class ServiceRequest(BaseModel):
    id: str
    client_id: str
    provider_id: Optional[str] = None
    category: str
    description: str = ""
    client_latitude: float
    client_longitude: float
    price: float
    status: str = "pending"


class StatusUpdate(BaseModel):
    status: str


class AcceptPayload(BaseModel):
    provider_id: str

class PaymentData(BaseModel):
    method: str
    amount: float
    transaction_id: str
    timestamp: str

class ReceiptData(BaseModel):
    request_id: str
    provider_name: str
    service_fee: float
    platform_fee: float
    discount: float
    total: float
    date: str

@app.on_event("startup")
async def start():
    global producer
    producer = await make_producer()

@app.on_event("shutdown")
async def stop():
    if producer:
        await producer.stop()
    client.close()

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"request"}

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests():
    cur = db.requests.find({}, {"_id":0})
    return [doc async for doc in cur]

@app.post("/requests", response_model=ServiceRequest)
async def create_request(req: ServiceRequest):
    await db.requests.insert_one(req.dict())
    if producer:
        await asyncio.gather(
            producer.send_and_wait(REQ_TOPIC, req.dict()),
            producer.send_and_wait(
                LIFECYCLE_TOPIC,
                {
                    "type": EV_REQUEST_CREATED,
                    "request_id": req.id,
                    "client_id": req.client_id,
                },
            ),
        )
    return req


@app.put("/requests/{request_id}/accept")
async def accept_request(request_id: str, data: AcceptPayload):
    res = await db.requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted", "provider_id": data.provider_id}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="request not found")
    if producer:
        await producer.send_and_wait(
            LIFECYCLE_TOPIC,
            {
                "type": EV_REQUEST_ACCEPTED,
                "request_id": request_id,
                "provider_id": data.provider_id,
            },
        )
    return {"status": "accepted"}


@app.put("/requests/{request_id}/status")
async def update_request_status(request_id: str, data: StatusUpdate):
    res = await db.requests.update_one(
        {"id": request_id},
        {"$set": {"status": data.status}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="request not found")
    if producer:
        await producer.send_and_wait(
            LIFECYCLE_TOPIC,
            {
                "type": EV_STATUS_CHANGED,
                "request_id": request_id,
                "status": data.status,
            },
        )
    return {"status": data.status}

@app.post("/requests/{request_id}/payment")
async def process_payment(request_id: str, data: PaymentData):
    # First fetch the request to get provider_id
    req_doc = await db.requests.find_one({"id": request_id}, {"_id": 0})
    if not req_doc:
        raise HTTPException(status_code=404, detail="request not found")
    
    # Update request with payment info
    res = await db.requests.update_one(
        {"id": request_id},
        {"$set": {
            "payment": data.dict(),
            "status": "paid"
        }}
    )
    
    # Emit PAID event with provider_id so provider-service can credit wallet
    if producer and req_doc.get("provider_id"):
        await producer.send_and_wait(
            LIFECYCLE_TOPIC,
            {
                "type": EV_REQUEST_PAID,
                "request_id": request_id,
                "provider_id": req_doc["provider_id"],
                "amount": data.amount,
                "payment_method": data.method
            },
        )
    return {"status": "paid", "details": data}

@app.get("/requests/{request_id}/receipt", response_model=ReceiptData)
async def get_receipt(request_id: str):
    doc = await db.requests.find_one({"id": request_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="request not found")
    
    total = doc.get("price", 0)
    service_fee = total * 0.8
    platform_fee = total * 0.2
    
    return {
        "request_id": doc["id"],
        "provider_name": "Provider", # In real app, join/aggregate
        "service_fee": round(service_fee, 2),
        "platform_fee": round(platform_fee, 2),
        "discount": 0.0,
        "total": total,
        "date": doc.get("created_at", "2023-10-24")
    }
