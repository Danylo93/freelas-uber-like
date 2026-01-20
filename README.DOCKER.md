# Docker Compose Setup

## Como executar o backend com Docker Compose

### 1. Build e iniciar todos os serviços

```bash
docker-compose up --build
```

### 2. Iniciar em background

```bash
docker-compose up -d --build
```

### 3. Ver logs do backend

```bash
docker-compose logs -f backend
```

### 4. Parar todos os serviços

```bash
docker-compose down
```

### 5. Parar e remover volumes (limpar dados)

```bash
docker-compose down -v
```

## Serviços disponíveis

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Kafka**: localhost:9092
- **Kafka UI**: http://localhost:8080

## Variáveis de ambiente

Você pode criar um arquivo `.env` na raiz do projeto para sobrescrever variáveis:

```env
JWT_SECRET=your-secret-key-here
```

## Primeira execução

Na primeira execução, você precisa aplicar o schema do Prisma:

```bash
# Entrar no container do backend
docker-compose exec backend sh

# Aplicar schema
yarn db:push

# Sair do container
exit
```

Ou executar diretamente:

```bash
docker-compose exec backend yarn db:push
```

## Troubleshooting

### Backend não inicia

Verifique os logs:
```bash
docker-compose logs backend
```

### Porta já em uso

Se a porta 3000 já estiver em uso, você pode mudar no `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Muda para porta 3001 no host
```

### Rebuild completo

Se houver problemas, faça um rebuild completo:
```bash
docker-compose down -v
docker-compose build --no-cache backend
docker-compose up -d
```
