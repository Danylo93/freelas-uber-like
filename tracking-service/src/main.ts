import express from 'express';
import cors from 'cors';
import { prisma } from '@freelas/database';
import { logger } from '@freelas/shared-logger';
import { KafkaClient } from '@freelas/shared-kafka';
import { CONFIG } from '@freelas/shared-config';
import { KAFKA_TOPICS, LocationPingEvent } from '@freelas/shared-contracts';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'tracking-service' });
});

// Fallback HTTP Ping
app.post('/jobs/:jobId/location', async (req, res) => {
    // Publish to Kafka (same as Socket would)
    const kafka = new KafkaClient('tracking-producer', CONFIG.KAFKA.BROKERS);
    await kafka.publish(KAFKA_TOPICS.JOB_LOCATION_PINGED, {
        jobId: req.params.jobId,
        providerId: req.body.providerId,
        lat: req.body.lat,
        lng: req.body.lng
    });
    res.json({ status: 'ok' });
});

app.get('/jobs/:jobId/history', async (req, res) => {
    const history = await prisma.locationPing.findMany({
        where: { jobId: req.params.jobId },
        orderBy: { timestamp: 'asc' }
    });
    res.json(history);
});

async function setupConsumers() {
  const consumer = new KafkaClient('tracking-consumer', CONFIG.KAFKA.BROKERS);
  await consumer.connectConsumer('tracking-group', [KAFKA_TOPICS.JOB_LOCATION_PINGED], async (payload) => {
    const data = JSON.parse(payload.message.value?.toString() || '{}') as LocationPingEvent;

    // Persist to DB
    await prisma.locationPing.create({
        data: {
            jobId: data.jobId,
            providerId: data.providerId,
            lat: data.lat,
            lng: data.lng
        }
    });

    // Update Provider's current location in Profile (for Matching)
    await prisma.providerProfile.update({
        where: { userId: data.providerId },
        data: {
            currentLat: data.lat,
            currentLng: data.lng
        }
    });

    logger.info(`Persisted location for job ${data.jobId}`);
  });
}

setupConsumers().catch(e => logger.error(e));

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  logger.info(`tracking-service listening on port ${PORT}`);
});
