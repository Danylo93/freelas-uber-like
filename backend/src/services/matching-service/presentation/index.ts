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
import { prisma } from '../../../shared/database/src/index';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const geoRepo = container.resolve<GeoRepository>('GeoRepository');
const matchingRepo = container.resolve<MatchingRepository>('MatchingRepository');
const messageBroker = container.resolve<MessageBroker>('MessageBroker');

const updateProviderLocation = new UpdateProviderLocation(geoRepo);
const findAndNotifyProviders = new FindAndNotifyProviders(geoRepo, messageBroker);
const acceptOffer = new AcceptOffer(matchingRepo);

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

app.post('/:requestId/accept', async (req, res, next) => {
    try {
        const offerId = req.params.requestId;
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: { request: { select: { customerId: true } } }
        });
        const isProposalAccept = Boolean(offer);

        const requestId = isProposalAccept ? offer!.requestId : req.params.requestId;
        const providerId = isProposalAccept ? offer!.providerId : req.body.providerId;

        if (!providerId) {
            return res.status(400).json({ message: 'providerId is required' });
        }

        if (offer && offer.status !== 'PENDING') {
            return res.status(409).json({ message: 'Offer is no longer available' });
        }

        const request = isProposalAccept ? offer!.request : await prisma.serviceRequest.findUnique({
            where: { id: requestId },
            select: { customerId: true }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        const result = await acceptOffer.execute({
            requestId,
            providerId
        });

        const existingJob = await prisma.job.findUnique({
            where: { requestId }
        });
        if (existingJob) {
            return res.json({ status: 'accepted', job_id: existingJob.id });
        }

        const job = await prisma.job.create({
            data: {
                requestId,
                providerId,
                status: 'ACCEPTED'
            }
        });

        await prisma.serviceRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
        });

        if (offer) {
            await prisma.offer.update({
                where: { id: offer.id },
                data: { status: 'ACCEPTED' }
            });
            await prisma.offer.updateMany({
                where: { requestId, id: { not: offer.id } },
                data: { status: 'REJECTED' }
            });
        }

        await messageBroker.publish(KAFKA_TOPICS.JOB_ACCEPTED, {
            requestId,
            jobId: job.id,
            providerId,
            customerId: request.customerId
        });

        res.json({ ...result, job_id: job.id });
    } catch (err) {
        // Basic error mapping
        if ((err as Error).message.includes('Offer no longer available')) {
            res.status(409).json({ message: (err as Error).message });
        } else {
            next(err);
        }
    }
});

app.post('/:requestId/propose', async (req, res, next) => {
    try {
        const { providerId, proposedPrice, message } = req.body || {};
        if (!providerId || !proposedPrice) {
            return res.status(400).json({ message: 'providerId and proposedPrice are required' });
        }

        const request = await prisma.serviceRequest.findUnique({
            where: { id: req.params.requestId },
            select: { customerId: true, status: true }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (request.status === 'ACCEPTED' || request.status === 'CANCELED' || request.status === 'EXPIRED') {
            return res.status(409).json({ message: 'Request is not available' });
        }

        const provider = await prisma.user.findUnique({
            where: { id: providerId },
            select: { name: true }
        });

        const offer = await prisma.offer.create({
            data: {
                requestId: req.params.requestId,
                providerId,
                proposedPrice: Number(proposedPrice),
                message
            }
        });

        if (request.status === 'PENDING') {
            await prisma.serviceRequest.update({
                where: { id: req.params.requestId },
                data: { status: 'OFFERED' }
            });
        }

        await messageBroker.publish(KAFKA_TOPICS.OFFER_CREATED, {
            requestId: offer.requestId,
            providerId: offer.providerId,
            timeout: 30,
            offerId: offer.id,
            proposedPrice: offer.proposedPrice,
            message: offer.message,
            customerId: request.customerId,
            providerName: provider?.name || 'Prestador',
            forCustomer: true
        });

        res.status(201).json({
            status: 'created',
            offer: {
                id: offer.id,
                requestId: offer.requestId,
                providerId: offer.providerId,
                providerName: provider?.name || 'Prestador',
                proposedPrice: offer.proposedPrice,
                message: offer.message,
                createdAt: offer.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
});

app.get('/:requestId', async (req, res, next) => {
    try {
        const offers = await prisma.offer.findMany({
            where: { requestId: req.params.requestId },
            orderBy: { createdAt: 'desc' },
            include: { provider: { select: { name: true } } }
        });
        res.json({
            offers: offers.map((offer) => ({
                id: offer.id,
                providerId: offer.providerId,
                providerName: offer.provider?.name || 'Prestador',
                proposedPrice: offer.proposedPrice,
                message: offer.message,
                createdAt: offer.createdAt,
                status: offer.status
            }))
        });
    } catch (err) {
        next(err);
    }
});

// Export the app
export const matchingApp = app;
