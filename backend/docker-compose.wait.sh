#!/bin/bash
# Wait for services to be ready

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U user -d freelas 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Waiting for Kafka..."
until nc -z kafka 29092 2>/dev/null; do
  sleep 1
done
echo "Kafka is ready!"

echo "Waiting for Redis..."
until nc -z redis 6379 2>/dev/null; do
  sleep 1
done
echo "Redis is ready!"

echo "All services are ready!"
