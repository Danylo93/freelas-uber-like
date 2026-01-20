# Backend Unificado - Freelas

Backend consolidado em um único projeto Node.js/TypeScript.

## Estrutura

```
backend/
├── src/
│   ├── server.ts          # Servidor único que expõe todas as rotas
│   ├── services/          # Todos os serviços como módulos
│   │   ├── auth-service/
│   │   ├── users-service/
│   │   ├── catalog-service/
│   │   ├── request-service/
│   │   ├── matching-service/
│   │   ├── tracking-service/
│   │   ├── review-service/
│   │   ├── earnings-service/
│   │   └── api-gateway/   # Socket.io e Kafka consumers
│   └── shared/            # Módulos compartilhados
│       ├── database/
│       ├── shared-config/
│       ├── shared-contracts/
│       ├── shared-errors/
│       ├── shared-kafka/
│       └── shared-logger/
├── package.json           # Único package.json com todas as dependências
└── tsconfig.json
```

## Instalação

```bash
cd backend
yarn install
```

## Configuração do Banco de Dados

```bash
# Configurar DATABASE_URL no .env ou exportar
export DATABASE_URL="postgresql://user:password@localhost:5432/freelas"

# Aplicar schema
yarn db:push

# Gerar Prisma Client
yarn db:generate
```

## Executar

```bash
# Desenvolvimento
yarn dev

# Produção
yarn build
yarn start
```

## Kafka

O Kafka está configurado e rodando via Docker Compose. Para gerenciar os tópicos:

```bash
# Criar todos os tópicos necessários
yarn kafka:topics

# Verificar status do Kafka
yarn kafka:check

# Acessar Kafka UI (interface web)
# http://localhost:8080
```

**Tópicos do Kafka:**
- `request.created` - Nova solicitação criada
- `request.canceled` - Solicitação cancelada
- `provider.online.changed` - Status online do prestador mudou
- `matching.offer.sent` - Oferta enviada para prestador
- `job.accepted` - Trabalho aceito
- `job.status.changed` - Status do trabalho mudou
- `job.location.pinged` - Atualização de localização
- `job.completed` - Trabalho completado
- `review.created` - Avaliação criada

## Porta

O servidor roda na porta **3000** (ou PORT do ambiente).

## Rotas Disponíveis

- `/healthz` - Health check
- `/auth/*` - Autenticação (register, login, me)
- `/users/*` - Usuários
- `/providers/*` - Prestadores
- `/categories/*` - Categorias de serviços
- `/requests/*` - Solicitações
- `/offers/*` - Ofertas
- `/jobs/*` - Trabalhos
- `/reviews/*` - Avaliações
- `/earnings/*` - Ganhos

## Próximos Passos

1. Corrigir imports relativos nos arquivos dos serviços (alguns ainda têm caminhos incorretos)
2. Testar todas as rotas
3. Remover pastas antigas (services/ e shared/ na raiz do backend)

## Notas

- Todos os serviços estão consolidados em `src/services/`
- Todas as dependências estão no `package.json` raiz
- Um único `node_modules` compartilhado
- Servidor único na porta 3000
