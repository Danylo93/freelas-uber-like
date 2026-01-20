import express from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { TrackingRepository } from '../domain/repositories/trackingRepository';
import { MessageBroker } from '../domain/services/messageBroker';
import { SaveLocationPing } from '../application/usecases/saveLocationPing';
import { PublishLocationPing } from '../application/usecases/publishLocationPing';
import { GetLocationHistory } from '../application/usecases/getLocationHistory';
import { KafkaClient } from '../../../shared/shared-kafka/src/index';
import { CONFIG } from '../../../shared/shared-config/src/index';
import { KAFKA_TOPICS, LocationPingEvent } from '../../../shared/shared-contracts/src/index';
import { logger } from '../../../shared/shared-logger/src/index';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const trackingRepo = container.resolve<TrackingRepository>('TrackingRepository');
const messageBroker = container.resolve<MessageBroker>('MessageBroker');

const saveLocationPing = new SaveLocationPing(trackingRepo);
const publishLocationPing = new PublishLocationPing(messageBroker);
const getLocationHistory = new GetLocationHistory(trackingRepo);

// --- Kafka Consumer Setup ---
// We start the consumer here. In a real highly-scaled system, this might be a separate worker process.
// For this unified gateway approach, we start it alongside the app.
async function startConsumer() {
    try {
        const consumer = new KafkaClient('tracking-consumer', CONFIG.KAFKA.BROKERS);
        consumer.connectConsumer('tracking-group', [KAFKA_TOPICS.JOB_LOCATION_PINGED], async (payload) => {
            try {
                const data = JSON.parse(payload.message.value?.toString() || '{}') as LocationPingEvent;
                // Map event data to entity
                await saveLocationPing.execute({
                    jobId: data.jobId,
                    providerId: data.providerId,
                    lat: data.lat,
                    lng: data.lng,
                    timestamp: new Date() // or event timestamp if available
                });
            } catch (err) {
                logger.error('Error processing tracking event', err);
            }
        }).catch(err => logger.error('Failed to start tracking consumer', err));
    } catch (err) {
        logger.error('Failed to initialize tracking consumer', err);
        // Não re-throw - permite que o serviço continue funcionando
    }
}
startConsumer();

// --- HTTP Routes ---

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'tracking-service' });
});

// Fallback HTTP Ping / Post Location
app.post('/jobs/:jobId/location', async (req, res, next) => {
    try {
        await publishLocationPing.execute({
            jobId: req.params.jobId,
            providerId: req.body.providerId,
            lat: req.body.lat,
            lng: req.body.lng
        });
        res.json({ status: 'ok' });
    } catch (err) {
        next(err);
    }
});

app.get('/jobs/:jobId/history', async (req, res, next) => {
    try {
        const history = await getLocationHistory.execute(req.params.jobId);
        res.json(history);
    } catch (err) {
        next(err);
    }
});

// Export the app
export const trackingApp = app;
