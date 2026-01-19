import os, asyncio, math
from typing import Optional
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from dotenv import load_dotenv

from common.kafka import make_consumer, make_producer
from common.events import TOPIC_REQ_LIFECYCLE, EV_REQUEST_OFFERED

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
REQ_TOPIC = os.getenv("TOPIC_REQUESTS", "service.requests")
LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="matching-service")
consumer: Optional[AIOKafkaConsumer] = None
producer: Optional[AIOKafkaProducer] = None


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def match_request(req: dict):
    cur = db.providers.find({
        "category": req.get("category"),
        "status": "available",
    }, {"_id": 0})

    best = None
    best_dist = float("inf")
    async for prov in cur:
        dist = haversine(
            req.get("client_latitude"),
            req.get("client_longitude"),
            prov.get("latitude"),
            prov.get("longitude"),
        )
        if dist < best_dist:
            best = prov
            best_dist = dist

    if best:
        await db.requests.update_one(
            {"id": req.get("id")},
            {"$set": {"provider_id": best["id"], "status": "offered"}},
        )
        await db.providers.update_one(
            {"id": best["id"]},
            {"$set": {"status": "busy"}},
        )
        if producer:
            await producer.send_and_wait(
                LIFECYCLE_TOPIC,
                {
                    "type": EV_REQUEST_OFFERED,
                    "request_id": req.get("id"),
                    "provider_id": best["id"],
                },
            )


async def consume():
    assert consumer is not None
    async for msg in consumer:
        await match_request(msg.value)


@app.on_event("startup")
async def start():
    global consumer, producer
    consumer = make_consumer(REQ_TOPIC, group_id="matching-service")
    await consumer.start()
    producer = await make_producer()
    asyncio.create_task(consume())


@app.on_event("shutdown")
async def stop():
    if consumer:
        await consumer.stop()
    if producer:
        await producer.stop()
    client.close()


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "matching"}
