import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { prisma, RequestStatus } from '@freelas/database';
import { logger } from '@freelas/shared-logger';
import { KafkaClient } from '@freelas/shared-kafka';
import { CONFIG } from '@freelas/shared-config';
import { CreateRequestSchema, KAFKA_TOPICS, RequestCreatedEvent } from '@freelas/shared-contracts';
import { AppError } from '@freelas/shared-errors';

const app = express();
app.use(cors());
app.use(express.json());

const kafka = new KafkaClient('request-service', CONFIG.KAFKA.BROKERS);
kafka.connectProducer().catch(err => logger.error('Failed to connect Kafka Producer', err));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'request-service' });
});

// Create Request
app.post('/requests', async (req, res, next) => {
  try {
    const data = CreateRequestSchema.parse(req.body);
    // User ID from header (Gateway passes it) or body? Gateway should inject user info.
    // For now assuming body or header injection.
    // Let's assume Gateway passes `x-user-id`.
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
       // Fallback for dev/test without gateway
       // throw new AppError('User ID missing', 401);
    }
    const customerId = userId || req.body.customerId; // Dev fallback

    const request = await prisma.serviceRequest.create({
      data: {
        customerId,
        categoryId: data.categoryId,
        description: data.description,
        price: data.price,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        address: data.address,
        status: RequestStatus.PENDING
      }
    });

    const event: RequestCreatedEvent = {
      requestId: request.id,
      customerId: request.customerId,
      categoryId: request.categoryId,
      lat: request.pickupLat,
      lng: request.pickupLng,
      description: request.description,
      price: request.price || 0
    };

    await kafka.publish(KAFKA_TOPICS.REQUEST_CREATED, event);

    res.json(request);
  } catch (error) {
    next(error);
  }
});

app.get('/requests/:id', async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: { job: true }
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Consume JOB_ACCEPTED to create Job record
// In a real microservice, we would run a separate consumer process or file.
// Here I'll attach it to main for simplicity.
async function setupConsumers() {
  const consumer = new KafkaClient('request-service-consumer', CONFIG.KAFKA.BROKERS);
  await consumer.connectConsumer('request-service-group', [KAFKA_TOPICS.JOB_ACCEPTED], async (payload) => {
    const data = JSON.parse(payload.message.value?.toString() || '{}');
    if (payload.topic === KAFKA_TOPICS.JOB_ACCEPTED) {
      const { requestId, providerId } = data;
      logger.info(`Creating job for request ${requestId} with provider ${providerId}`);

      // Update Request
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // Create Job
      await prisma.job.create({
        data: {
          requestId,
          providerId,
          status: 'ACCEPTED'
        }
      });
      // Could publish JOB_STARTED or just rely on ACCEPTED
    }
  });
}

setupConsumers().catch(e => logger.error(e));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  logger.info(`request-service listening on port ${PORT}`);
});
