# Seeding Data

## 1. Create Customer
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "customer@test.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

## 2. Create Provider
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Plumber",
    "email": "provider@test.com",
    "password": "password123",
    "role": "PROVIDER"
  }'
```

## 3. Provider Login (to get ID and Token)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@test.com",
    "password": "password123"
  }'
```

## 4. Set Provider Online (using Token)
```bash
curl -X PUT http://localhost:3000/providers/{PROVIDER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "isOnline": true,
    "specialties": []
  }'
# Note: Empty specialties matches all in our simple logic
```

## 5. Create Request (as Customer)
```bash
curl -X POST http://localhost:3000/requests \
  -H "Content-Type: application/json" \
  -H "x-user-id": "{CUSTOMER_ID}" \
  -d '{
    "categoryId": "category-uuid",
    "description": "Leaky faucet",
    "pickupLat": -23.55,
    "pickupLng": -46.63
  }'
```
