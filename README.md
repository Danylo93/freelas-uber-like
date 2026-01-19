# Freelas - Uber-like Services Architecture

## Architecture

Monorepo using `pnpm` workspaces.

### Microservices (Node.js + TypeScript)
- **api-gateway** (Port 3000): Entry point, Proxy, Socket.io Server.
- **auth-service** (Port 3001): Authentication (JWT).
- **users-service** (Port 3002): User profiles.
- **catalog-service** (Port 3003): Service categories.
- **request-service** (Port 3004): Request lifecycle.
- **matching-service** (Port 3005): Finding providers.
- **tracking-service** (Port 3006): Location tracking.
- **review-service** (Port 3007): Reviews.
- **earnings-service** (Port 3008): Provider earnings.

### Infrastructure
- **PostgreSQL**: Main Database.
- **Redis**: Caching, Socket Adapter, Locks.
- **Kafka**: Event Bus.
- **Zookeeper**: Kafka coordination.

### Frontend
- **apps/mobile-customer**: React Native (Expo).
- **apps/mobile-provider**: React Native (Expo).

## How to Run

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```
   Wait for Kafka and Postgres to be ready.

3. **Database Migration**
   ```bash
   pnpm --filter @freelas/database db:push
   ```

4. **Start Services**
   You can start all services using `pnpm` or individually.
   ```bash
   # In separate terminals:
   pnpm --filter @freelas/api-gateway dev
   pnpm --filter @freelas/auth-service dev
   pnpm --filter @freelas/users-service dev
   pnpm --filter @freelas/catalog-service dev
   pnpm --filter @freelas/request-service dev
   pnpm --filter @freelas/matching-service dev
   pnpm --filter @freelas/tracking-service dev
   ```

5. **Start Frontend**
   ```bash
   cd apps/mobile-customer && npx expo start
   cd apps/mobile-provider && npx expo start
   ```

## Key Events (Kafka)

- `request.created`: New service request.
- `matching.offer.sent`: Matching service found a provider.
- `job.accepted`: Provider accepted the offer.
- `job.location.pinged`: Provider location update.
- `job.completed`: Job finished.

## Socket.io Events

- `request_offer`: Sent to Provider.
- `job_accepted`: Sent to Customer and Provider.
- `location_update`: Sent to Job room (Customer).
