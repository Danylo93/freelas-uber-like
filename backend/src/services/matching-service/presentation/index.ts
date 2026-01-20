import express from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { GeoRepository } from '../domain/repositories/geoRepository';
import { MatchingRepository } from '../domain/repositories/matchingRepository';
import { MessageBroker } from '../domain/services/messageBroker';
import { UpdateProviderLocation } from '../application/usecases/updateProviderLocation';
import { FindAndNotifyProviders } from '../application/usecases/findAndNotifyProviders';
import { AcceptOffer } from '../application/usecases/acceptOffer';
import { KafkaClient } from '../../../shared/shared-kafka/src/index';
import { CONFIG } from '../../../shared/shared-config/src/index';
import { KAFKA_TOPICS } from '../../../shared/shared-contracts/src/index';
import { logger } from '../../../shared/shared-logger/src/index';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const geoRepo = container.resolve<GeoRepository>('GeoRepository');
const matchingRepo = container.resolve<MatchingRepository>('MatchingRepository');
const messageBroker = container.resolve<MessageBroker>('MessageBroker');

const updateProviderLocation = new UpdateProviderLocation(geoRepo);
const findAndNotifyProviders = new FindAndNotifyProviders(geoRepo, messageBroker);
const acceptOffer = new AcceptOffer(matchingRepo, messageBroker);

// --- Kafka Consumer Setup ---
async function startConsumer() {
    try {
        const consumer = new KafkaClient('matching-consumer', CONFIG.KAFKA.BROKERS);

        // Subscribe to Request Created
        consumer.connectConsumer('matching-group-request', [KAFKA_TOPICS.REQUEST_CREATED], async (payload) => {
            try {
                const data = JSON.parse(payload.message.value?.toString() || '{}');
                await findAndNotifyProviders.execute({
                    requestId: data.requestId,
                    location: { lat: data.lat, lng: data.lng }
                });
            } catch (err) {
                logger.error('Error processing request created event', err);
            }
        }).catch(err => logger.error('Failed to start request consumer', err));

        // Subscribe to Provider Location Updated (opcional - não crasha se falhar)
        const locConsumer = new KafkaClient('matching-consumer-loc', CONFIG.KAFKA.BROKERS);
        locConsumer.connectConsumer('matching-group-loc', [KAFKA_TOPICS.PROVIDER_LOCATION_UPDATED], async (payload) => {
            try {
                const data = JSON.parse(payload.message.value?.toString() || '{}');
                await updateProviderLocation.execute({
                    providerId: data.providerId,
                    lat: data.lat,
                    lng: data.lng
                });
            } catch (err) {
                logger.error('Error processing provider location update', err);
            }
        }).catch(err => logger.warn('Provider location consumer not started (optional)', err));

    } catch (err) {
        logger.error('Failed to start matching consumers', err);
        // Não re-throw - permite que o serviço continue funcionando
    }
}
startConsumer();

// --- HTTP Routes ---

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'matching-service' });
});

app.post('/offers/:requestId/accept', async (req, res, next) => {
    try {
        const { providerId } = req.body;
        const result = await acceptOffer.execute({
            requestId: req.params.requestId,
            providerId
        });
        res.json(result);
    } catch (err) {
        // Basic error mapping
        if ((err as Error).message.includes('Offer no longer available')) {
            res.status(409).json({ message: (err as Error).message });
        } else {
            next(err);
        }
    }
});

// Export the app
export const matchingApp = app;
