#!/bin/bash

# Script para criar todos os tópicos do Kafka necessários

KAFKA_CONTAINER="freelas-kafka"
BOOTSTRAP_SERVER="localhost:9092"

echo "📦 Criando tópicos do Kafka..."

topics=(
  "request.created"
  "request.canceled"
  "provider.online.changed"
  "matching.offer.sent"
  "job.accepted"
  "job.status.changed"
  "job.location.pinged"
  "job.completed"
  "review.created"
)

for topic in "${topics[@]}"; do
  echo "  Criando tópico: $topic"
  docker exec $KAFKA_CONTAINER kafka-topics --create \
    --bootstrap-server localhost:9092 \
    --topic "$topic" \
    --partitions 3 \
    --replication-factor 1 \
    --if-not-exists 2>/dev/null || echo "    Tópico já existe ou erro ao criar"
done

echo ""
echo "✅ Tópicos criados!"
echo ""
echo "📋 Listando tópicos existentes:"
docker exec $KAFKA_CONTAINER kafka-topics --bootstrap-server localhost:9092 --list | grep -v "^__"
