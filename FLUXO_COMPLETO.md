# Fluxo Completo - Sistema Uber-Like

## Dinâmica do Sistema

O sistema funciona como um Uber para serviços, onde:

1. **Provedor** precisa existir e estar **online**
2. **Cliente** solicita um serviço
3. **Sistema** encontra provedores próximos e envia **ofertas/propostas**
4. **Provedor** aceita ou dá proposta de valor
5. **Cliente** aceita a proposta
6. **Fluxo continua**: tracking, pagamento, review

## Fluxo Detalhado

### 1. Setup Inicial

#### Provedor se Cadastra e Fica Online
```
POST /auth/register
{
  "name": "João",
  "email": "joao@provider.com",
  "password": "123456",
  "role": "PROVIDER"
}

PUT /providers/:id
{
  "isOnline": true,
  "currentLat": -23.5505,
  "currentLng": -46.6333
}
```

#### Cliente se Cadastra
```
POST /auth/register
{
  "name": "Maria",
  "email": "maria@client.com",
  "password": "123456",
  "role": "CUSTOMER"
}
```

### 2. Cliente Solicita Serviço

```
POST /requests
{
  "categoryId": "51e35b7e-b6e9-4ffe-931f-79c2371ac239",
  "description": "Preciso de limpeza doméstica",
  "pickupLat": -23.5505,
  "pickupLng": -46.6333,
  "price": 100.00
}
```

**O que acontece:**
- Request é criado com status `PENDING`
- Evento `REQUEST_CREATED` é publicado no Kafka
- Matching Service recebe o evento
- Matching Service encontra provedores próximos (via Redis GEO)
- Para cada provedor encontrado:
  - Publica evento `OFFER_CREATED` no Kafka
  - Socket.io emite `request_offer` para o provedor

### 3. Provedor Recebe Oferta

**Via Socket.io:**
```javascript
socket.on('request_offer', (data) => {
  // data contém: requestId, customerId, location, price, etc.
  // Provedor vê a oferta na tela
});
```

**Via REST (opcional):**
```
GET /requests
// Retorna todas as requests PENDING disponíveis
```

### 4. Provedor Aceita ou Faz Proposta

#### Opção A: Aceitar Diretamente
```
PUT /requests/:requestId/accept
// ou
POST /matching/offers/:requestId/accept
{
  "providerId": "provider-uuid"
}
```

**O que acontece:**
- Job é criado com status `ACCEPTED`
- Request status muda para `ACCEPTED`
- Evento `JOB_ACCEPTED` é publicado no Kafka
- Socket.io emite `job_accepted` para cliente e provedor

#### Opção B: Fazer Proposta de Valor
```
POST /offers/:requestId/propose
{
  "providerId": "provider-uuid",
  "proposedPrice": 120.00,
  "message": "Posso fazer por R$ 120"
}
```

**O que acontece:**
- Oferta é criada com status `PENDING`
- Cliente recebe notificação via Socket.io
- Cliente pode aceitar ou rejeitar

### 5. Cliente Aceita Proposta

```
POST /offers/:offerId/accept
{
  "customerId": "customer-uuid"
}
```

**O que acontece:**
- Oferta status muda para `ACCEPTED`
- Job é criado
- Request status muda para `ACCEPTED`
- Evento `JOB_ACCEPTED` é publicado

### 6. Tracking (Provedor a Caminho)

```
POST /tracking/jobs/:jobId/location
{
  "providerId": "provider-uuid",
  "lat": -23.5505,
  "lng": -46.6333
}
```

**O que acontece:**
- Localização é salva
- Evento `JOB_LOCATION_PINGED` é publicado
- Cliente recebe atualização via Socket.io

**Atualização de Status:**
```
PUT /requests/:id/update-status
{
  "status": "ON_THE_WAY" // ou "ARRIVED", "STARTED"
}
```

### 7. Serviço Concluído

```
PUT /requests/:id/update-status
{
  "status": "COMPLETED"
}
```

### 8. Pagamento

```
POST /requests/:id/payment
{
  "paymentMethod": "pix", // ou "card"
  "amount": 100.00
}
```

**O que acontece:**
- Request status muda para `COMPLETED`
- Job status muda para `COMPLETED`
- Evento `JOB_COMPLETED` é publicado
- Earnings Service atualiza ganhos do provedor

### 9. Review/Avaliação

```
POST /reviews
{
  "jobId": "job-uuid",
  "rating": 5,
  "comment": "Excelente serviço!"
}
```

**O que acontece:**
- Review é criada
- Evento `REVIEW_CREATED` é publicado
- Rating do provedor é atualizado

## Endpoints Implementados

### ✅ Auth
- `POST /auth/login`
- `POST /auth/register`

### ✅ Providers
- `GET /providers` - Lista provedores
- `GET /providers/:id` - Detalhes do provedor
- `PUT /providers/:id` - Atualiza provedor (isOnline, location)
- `PUT /provider/location` - Atualiza localização do provedor logado

### ✅ Requests
- `POST /requests` - Cliente cria solicitação
- `GET /requests` - Lista requests (provedores veem PENDING)
- `GET /requests/client/:clientId` - Requests de um cliente
- `GET /requests/:id` - Detalhes de uma request
- `PUT /requests/:id/accept` - Provedor aceita request
- `PUT /requests/:id/update-status` - Atualiza status (ON_THE_WAY, ARRIVED, STARTED, COMPLETED)
- `POST /requests/:id/payment` - Processa pagamento
- `GET /requests/:id/receipt` - Recibo da request

### ✅ Matching/Offers
- `POST /matching/offers/:requestId/accept` - Aceita oferta

### ✅ Tracking
- `POST /tracking/jobs/:jobId/location` - Envia localização
- `GET /tracking/jobs/:jobId/history` - Histórico de localização

### ✅ Reviews
- `POST /reviews` - Cria avaliação
- `POST /ratings` - Alias para reviews

### ✅ Earnings
- `GET /providers/:id/wallet` - Carteira do provedor
- `GET /providers/:id/earnings` - Ganhos do provedor

## Eventos Kafka

- `REQUEST_CREATED` - Quando cliente cria solicitação
- `OFFER_CREATED` - Quando sistema cria oferta para provedor
- `JOB_ACCEPTED` - Quando provedor aceita job
- `JOB_STATUS_CHANGED` - Quando status do job muda
- `JOB_LOCATION_PINGED` - Quando provedor envia localização
- `JOB_COMPLETED` - Quando job é concluído
- `REVIEW_CREATED` - Quando review é criada
- `PROVIDER_LOCATION_UPDATED` - Quando provedor atualiza localização
- `PROVIDER_ONLINE_CHANGED` - Quando provedor muda status online

## Eventos Socket.io

- `request_offer` - Provedor recebe oferta de request
- `request_cancelled` - Request foi cancelada
- `job_accepted` - Job foi aceito
- `job_status_changed` - Status do job mudou
- `provider_location` - Localização do provedor atualizada
- `join_job` - Cliente/Provedor entra na sala do job

## Status Possíveis

### Request Status
- `PENDING` - Aguardando provedor
- `OFFERED` - Oferta enviada
- `ACCEPTED` - Aceito por provedor
- `COMPLETED` - Concluído
- `CANCELED` - Cancelado
- `EXPIRED` - Expirado

### Job Status
- `ACCEPTED` - Aceito
- `ON_THE_WAY` - A caminho
- `ARRIVED` - Chegou no local
- `STARTED` - Serviço iniciado
- `COMPLETED` - Concluído
- `CANCELED` - Cancelado

## Próximos Passos

1. ✅ Backend rodando na porta 5000
2. ✅ Todas as rotas implementadas
3. ⏳ Testar fluxo completo end-to-end
4. ⏳ Validar integração com apps mobile
5. ⏳ Testar Socket.io em tempo real
6. ⏳ Validar eventos Kafka
