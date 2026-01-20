# Freelas - Uber-like Services Architecture

## Architecture

Microservices architecture using Node.js + TypeScript.
Projects are organized in a single repository but run independently (No Monorepo Workspace tooling).

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

### Shared Logic
- **shared/**: Contains shared libraries (config, contracts, etc.). Services reference these via local file paths.

### Frontend
- **mobile-customer**: React Native (Expo).
- **mobile-provider**: React Native (Expo).

## How to Run

1.  **Install Dependencies**
    You can install dependencies for all services and shared packages using the helper script in the root:
    ```bash
    yarn install:all
    ```
    Or manually in each folder:
    ```bash
    cd api-gateway && yarn install
    cd ../auth-service && yarn install
    # ... repeat for all services
    ```

2.  **Start Infrastructure**
    ```bash
    docker compose up -d
    ```
    Wait for Kafka and Postgres to be ready.

3.  **Database Migration**
    ```bash
    cd shared/database
    yarn prisma db push
    ```

4.  **Start Services**
    Start services individually in separate terminals:
    ```bash
    cd api-gateway && yarn dev
    cd auth-service && yarn dev
    cd users-service && yarn dev
    cd catalog-service && yarn dev
    cd request-service && yarn dev
    cd matching-service && yarn dev
    cd tracking-service && yarn dev
    ```

5.  **Start Frontend**
    ```bash
    cd mobile-customer && npx expo start
    cd mobile-provider && npx expo start
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
