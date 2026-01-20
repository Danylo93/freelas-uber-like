import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { logger } from './shared/shared-logger/src/index';
import { AppError } from './shared/shared-errors/src/index';
import { CONFIG } from './shared/shared-config/src/index';

// Import all service routes
import authRoutes from './services/auth-service/auth.routes';
import { usersApp } from './services/users-service/presentation/index';
import { catalogApp } from './services/catalog-service/presentation/index';
import { requestApp } from './services/request-service/presentation/index';
import { matchingApp } from './services/matching-service/presentation/index';
import { trackingApp } from './services/tracking-service/presentation/index';
import { reviewApp } from './services/review-service/presentation/index';
import { earningsApp } from './services/earnings-service/presentation/index';

// Import Socket.io setup  
import { setupSocket } from './services/api-gateway/socket';
import { setupKafkaConsumers } from './services/api-gateway/kafka-consumer';

const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

// Mount all service routes
app.use('/auth', authRoutes);
app.use('/users', usersApp);
app.use('/providers', usersApp);
// Mount earnings routes at /providers path too (for /providers/:id/wallet)
app.use('/providers', earningsApp);
app.use('/categories', catalogApp); // Mount catalog at /categories prefix
app.use('/requests', requestApp);
app.use('/offers', matchingApp);
app.use('/matching', matchingApp);
app.use('/jobs', trackingApp);
app.use('/tracking', trackingApp);
app.use('/reviews', reviewApp);
app.use('/ratings', reviewApp); // Alias for /ratings
app.use('/earnings', earningsApp);
// Alias for /provider/location (mobile apps use /provider/location)
app.use('/provider', usersApp);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  // Zod Error
  if ('issues' in err) {
    return res.status(400).json({ message: 'Validation Error', details: (err as any).issues });
  }
  res.status(500).json({ message: 'Internal Server Error' });
});

// Create HTTP server for Socket.io
const server = createServer(app);

// Setup Socket.io
const io = setupSocket(server);

// Setup Kafka Consumers to broadcast events (não crasha se falhar)
setupKafkaConsumers(io).catch(err => {
  logger.error('Failed to start Kafka consumers', err);
  logger.warn('Servidor continuará funcionando sem Kafka consumers');
});

const PORT = CONFIG.PORT || process.env.PORT || 3000;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err: Error) => {
  // Erros fatais que devem crashar o app
  const nodeErr = err as NodeJS.ErrnoException;
  if (nodeErr.code === 'EADDRINUSE') {
    logger.error({ err, stack: err.stack }, 'Porta já está em uso - encerrando');
    process.exit(1);
  }
  // Outros erros não fatais
  logger.error({ err, stack: err.stack }, 'Uncaught Exception - servidor continuará funcionando');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection - servidor continuará funcionando');
  // Não crashar imediatamente para rejeições não tratadas
});

server.listen(PORT, () => {
  logger.info(`🚀 Backend server listening on port ${PORT}`);
  logger.info(`📡 Health check: http://localhost:${PORT}/healthz`);
  logger.info(`✅ Servidor iniciado com sucesso`);
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Porta ${PORT} já está em uso. Verifique se há outro processo rodando.`);
    logger.info('Aguardando 2 segundos antes de tentar novamente...');
    setTimeout(() => {
      logger.error('Não foi possível iniciar na porta. Encerrando...');
      process.exit(1);
    }, 2000);
  } else {
    logger.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
});
