#!/bin/bash

docker compose up -d

sleep 5

ngrok http 3000 > /dev/null &

sleep 5

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

echo "Ngrok URL: $NGROK_URL"

# Atualiza arquivo do mobile
sed -i "s|BASE_URL=.*|BASE_URL=$NGROK_URL|" mobile-customer/src/config/api.ts
