import json, asyncio, os
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

def get_bootstrap() -> str:
    return os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")

async def make_producer(max_attempts: int = 5, backoff: float = 1.5) -> AIOKafkaProducer:
    """Create a Kafka producer with exponential backoff retries.

    During local development Kafka can take a few seconds to become
    available even after the container is reported as started. To avoid
    crashing the microservices we retry the connection a handful of times
    before giving up.
    """

    attempt = 0
    last_error: Exception | None = None

    while attempt < max_attempts:
        producer = AIOKafkaProducer(
            bootstrap_servers=get_bootstrap(),
            value_serializer=lambda v: json.dumps(v).encode(),
        )
        try:
            await producer.start()
            return producer
        except Exception as exc:  # pragma: no cover - defensive guard
            last_error = exc
            try:
                await producer.stop()
            finally:
                await asyncio.sleep(backoff * (attempt + 1))
        attempt += 1

    assert last_error is not None
    raise last_error

def make_consumer(topic: str, group_id: str) -> AIOKafkaConsumer:
    return AIOKafkaConsumer(
        topic,
        bootstrap_servers=get_bootstrap(),
        group_id=group_id,
        value_deserializer=lambda v: json.loads(v.decode()),
        auto_offset_reset="latest"
    )
