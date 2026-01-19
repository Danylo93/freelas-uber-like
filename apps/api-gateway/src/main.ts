import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer } from 'http';
import { CONFIG } from '@freelas/shared-config';
import { logger } from '@freelas/shared-logger';
import { setupSocket } from './socket';
import { setupKafkaConsumers } from './kafka-consumer';

const app = express();
app.use(cors());

// Health Check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Proxies
// Auth
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
// Users/Providers
app.use(['/users', '/providers'], createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
// Catalog
app.use('/categories', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
// Requests
app.use('/requests', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }));
// Matching (Offers) - usually handled via Socket/Internal, but if there are REST endpoints
app.use(['/offers', '/matching'], createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));
// Tracking
app.use(['/jobs', '/tracking'], createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }));
// Reviews
app.use('/reviews', createProxyMiddleware({ target: 'http://localhost:3007', changeOrigin: true }));
// Earnings
app.use('/earnings', createProxyMiddleware({ target: 'http://localhost:3008', changeOrigin: true }));

const server = createServer(app);

// Setup Socket.io
const io = setupSocket(server);

// Setup Kafka Consumers to broadcast events
setupKafkaConsumers(io).catch(err => logger.error('Failed to start Kafka consumers', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`api-gateway listening on port ${PORT}`);
});
