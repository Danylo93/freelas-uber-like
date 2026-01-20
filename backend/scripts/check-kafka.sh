#!/bin/bash

echo "🔍 Verificando status do Kafka..."
echo ""

# Verificar se o container está rodando
if docker ps | grep -q freelas-kafka; then
  echo "✅ Container Kafka está rodando"
else
  echo "❌ Container Kafka NÃO está rodando"
  exit 1
fi

echo ""
echo "📋 Tópicos existentes:"
docker exec freelas-kafka kafka-topics --bootstrap-server localhost:9092 --list | grep -v "^__" | sed 's/^/  - /'

echo ""
echo "🌐 Kafka UI disponível em: http://localhost:8080"
echo "📡 Kafka Broker: localhost:9092"
