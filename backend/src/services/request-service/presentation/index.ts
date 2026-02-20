import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { RequestRepository } from '../domain/repositories/requestRepository';
import { MessageBroker } from '../domain/services/messageBroker';
import { CreateRequest } from '../application/usecases/createRequest';
import { GetRequest } from '../application/usecases/getRequest';
import { ProcessJobAccepted } from '../application/usecases/processJobAccepted';
import { KafkaClient } from '../../../shared/shared-kafka/src/index';
import { CONFIG } from '../../../shared/shared-config/src/index';
import { KAFKA_TOPICS } from '../../../shared/shared-contracts/src/index';
import { logger } from '../../../shared/shared-logger/src/index';
import { prisma } from '../../../shared/database/src/index';
import { CreateReview } from '../../review-service/application/usecases/createReview';
import { PrismaReviewRepository } from '../../review-service/infrastructure/repositories/prismaReviewRepository';
import { KafkaMessageBroker as ReviewKafkaMessageBroker } from '../../review-service/infrastructure/messaging/kafkaMessageBroker';

const app = express();
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
    console.log(`🔍 [REQUESTS] ${req.method} ${req.path} - Mounted at /requests`);
    next();
});

// Resolve dependencies
const requestRepo = container.resolve<RequestRepository>('RequestRepository');
const messageBroker = container.resolve<MessageBroker>('MessageBroker');

const createRequest = new CreateRequest(requestRepo, messageBroker);
const getRequest = new GetRequest(requestRepo);
const processJobAccepted = new ProcessJobAccepted(requestRepo);

const kafkaProducer = new KafkaClient('request-producer', CONFIG.KAFKA.BROKERS);
kafkaProducer.connectProducer().catch((err) => {
    logger.error('Failed to connect request-service Kafka producer', err);
});

const reviewRepo = new PrismaReviewRepository();
const reviewBroker = new ReviewKafkaMessageBroker();
const createReview = new CreateReview(reviewRepo, reviewBroker);

function mapJobStatusToFrontendStatus(jobStatus?: string | null, requestStatus?: string | null): string {
    const normalizedJobStatus = (jobStatus || '').toUpperCase();
    if (normalizedJobStatus === 'ACCEPTED') return 'accepted';
    if (normalizedJobStatus === 'ON_THE_WAY') return 'in_progress';
    if (normalizedJobStatus === 'ARRIVED') return 'near_client';
    if (normalizedJobStatus === 'STARTED') return 'started';
    if (normalizedJobStatus === 'COMPLETED') return 'completed';
    if (normalizedJobStatus === 'CANCELED') return 'canceled';
    return (requestStatus || '').toLowerCase();
}

function mapFrontendStatusToJobStatus(status: string): string | null {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'in_progress') return 'ON_THE_WAY';
    if (normalized === 'near_client') return 'ARRIVED';
    if (normalized === 'started') return 'STARTED';
    if (normalized === 'completed') return 'COMPLETED';
    if (normalized === 'canceled') return 'CANCELED';
    return null;
}

function parseStatusFilter(input: unknown): string[] {
    if (!input) return [];
    return String(input)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

function parseRequestStatusFilter(input: unknown): string[] {
    const allowed = new Set(['PENDING', 'OFFERED', 'ACCEPTED', 'CANCELED', 'EXPIRED']);
    return parseStatusFilter(input)
        .map((s) => s.toUpperCase())
        .filter((s) => allowed.has(s));
}

// --- Kafka Consumer Setup ---
async function startConsumer() {
    try {
        const consumer = new KafkaClient('request-consumer', CONFIG.KAFKA.BROKERS);
        consumer.connectConsumer('request-group', [KAFKA_TOPICS.JOB_ACCEPTED], async (payload) => {
            try {
                const data = JSON.parse(payload.message.value?.toString() || '{}');
                await processJobAccepted.execute({
                    requestId: data.requestId,
                    jobId: data.jobId,
                    providerId: data.providerId
                });
            } catch (err) {
                logger.error('Error processing job accepted event', err);
            }
        }).catch(err => logger.error('Failed to start request consumer', err));
    } catch (err) {
        logger.error('Failed to initialize request consumer', err);
        // Não re-throw - permite que o serviço continue funcionando
    }
}
startConsumer();

// --- HTTP Routes ---

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'request-service' });
});

app.post('/', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        // Use process.env.JWT_SECRET to match other routes, though CONFIG.JWT_SECRET is better
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

        const result = await createRequest.execute({
            ...req.body,
            customerId: payload.userId
        });

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

// IMPORTANTE: GET / deve vir ANTES de GET /:id para evitar conflito
app.get('/', async (req, res, next) => {
    try {
        // Support status filtering
        const statusFilter = parseRequestStatusFilter(req.query.status);

        // List all requests (for providers to see available requests)
        const requests = await prisma.serviceRequest.findMany({
            where: {
                ...(statusFilter.length > 0 && { status: { in: statusFilter as any[] } })
            },
            include: {
                customer: true,
                job: {
                    include: { provider: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(requests.map((r: any) => {
            const mappedStatus = mapJobStatusToFrontendStatus(r.job?.status, r.status);
            return {
                id: r.id,
                provider_id: r.job?.providerId,
                job_id: r.job?.id,
                status: mappedStatus,

                // Client Info (Critical for Provider)
                client_name: r.customer?.name || 'Cliente',
                client_phone: r.customer?.phone || '',
                client_address: r.address || 'Endereço não disponível',
                client_latitude: r.pickupLat,
                client_longitude: r.pickupLng,

                // Metadata
                created_at: r.createdAt,
                category: r.categoryId,
                price: r.price || 0,
                description: r.description,

                // Legacy fields just in case
                provider_name: r.job?.provider?.name || '',
                provider_phone: r.job?.provider?.phone || '',
            };
        }));
    } catch (err) {
        next(err);
    }
});

app.get('/client/:clientId', async (req, res, next) => {
    try {
        const statusFilter = parseStatusFilter(req.query.status);

        const requests = await prisma.serviceRequest.findMany({
            where: {
                customerId: req.params.clientId
            },
            include: { job: { include: { provider: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const mappedRequests = requests.map((r: any) => {
            const mappedStatus = mapJobStatusToFrontendStatus(r.job?.status, r.status);
            return {
                id: r.id,
                provider_id: r.job?.providerId,
                job_id: r.job?.id,
                status: mappedStatus,
                provider_name: r.job?.provider?.name || '',
                provider_phone: r.job?.provider?.phone || '',
                category: r.categoryId,
                price: r.price || 0,
                description: r.description,
                created_at: r.createdAt,
                request_status: (r.status || '').toLowerCase(),
                job_status: (r.job?.status || '').toLowerCase()
            };
        });

        const filtered = statusFilter.length > 0
            ? mappedRequests.filter((r: any) => {
                const candidates = new Set<string>([
                    r.status,
                    r.request_status,
                    r.job_status
                ].filter(Boolean));
                return statusFilter.some((f) => candidates.has(f));
            })
            : mappedRequests;

        res.json(filtered.map(({ request_status, job_status, ...payload }: any) => payload));
    } catch (err) {
        next(err);
    }
});

app.get('/:id', async (req, res, next) => {
    try {
        const request = await getRequest.execute(req.params.id);
        res.json(request);
    } catch (err) {
        if ((err as Error).message === 'Request not found') {
            res.status(404).json({ message: 'Request not found' });
        } else {
            next(err);
        }
    }
});

app.get('/:id/receipt', async (req, res, next) => {
    try {
        const request = await prisma.serviceRequest.findUnique({
            where: { id: req.params.id },
            include: { customer: true, job: { include: { provider: true } } }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json({
            id: request.id,
            customer_name: request.customer.name,
            provider_name: request.job?.provider?.name || '',
            price: request.price || 0,
            description: request.description,
            completed_at: request.job?.completedAt || new Date()
        });
    } catch (err) {
        next(err);
    }
});

app.put('/:id/accept', async (req, res, next) => {
    try {
        // Accept request - creates a Job
        const request = await prisma.serviceRequest.findUnique({
            where: { id: req.params.id }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Get provider from auth token (simplified)
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

        if (request.status === 'ACCEPTED' || request.status === 'CANCELED' || request.status === 'EXPIRED') {
            return res.status(409).json({ message: 'Request is not available' });
        }

        const existingJob = await prisma.job.findUnique({
            where: { requestId: request.id }
        });
        if (existingJob) {
            return res.status(409).json({ message: 'Request already accepted', job_id: existingJob.id });
        }

        // Create Job
        const job = await prisma.job.create({
            data: {
                requestId: request.id,
                providerId: payload.userId,
                status: 'ACCEPTED'
            },
            include: { provider: true, request: true }
        });

        // Update request status
        await prisma.serviceRequest.update({
            where: { id: request.id },
            data: { status: 'ACCEPTED' }
        });

        try {
            await kafkaProducer.publish(KAFKA_TOPICS.JOB_ACCEPTED, {
                requestId: request.id,
                jobId: job.id,
                providerId: payload.userId,
                customerId: request.customerId
            });
        } catch (publishErr) {
            logger.warn(`JOB_ACCEPTED publish failed for request ${request.id}, continuing`);
            logger.error(publishErr as any);
        }

        res.json({
            id: request.id,
            status: 'ACCEPTED',
            job_id: job.id
        });
    } catch (err) {
        next(err);
    }
});

app.put('/:id/update-status', async (req, res, next) => {
    try {
        const { status } = req.body;
        // status comes from frontend as: in_progress, near_client, started, completed

        const jobStatus = mapFrontendStatusToJobStatus(status);

        if (!jobStatus) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

        // Find the job linked to this request
        const job = await prisma.job.findUnique({
            where: { requestId: req.params.id },
            include: {
                request: {
                    select: {
                        customerId: true,
                        status: true
                    }
                }
            }
        });

        if (!job) {
            return res.status(404).json({ message: 'Job not found for this request' });
        }

        if (job.providerId !== payload.userId) {
            return res.status(403).json({ message: 'Forbidden: this job belongs to another provider' });
        }

        const updateData: any = { status: jobStatus };
        if (jobStatus === 'STARTED') updateData.startedAt = new Date();
        if (jobStatus === 'COMPLETED') updateData.completedAt = new Date();

        await prisma.job.update({
            where: { id: job.id },
            data: updateData
        });

        // Also update request status if it's CANCELED (others map to ACCEPTED usually)
        if (jobStatus === 'CANCELED') {
            await prisma.serviceRequest.update({
                where: { id: req.params.id },
                data: { status: 'CANCELED' }
            });
        }

        const frontendStatus = mapJobStatusToFrontendStatus(jobStatus, job.request?.status);
        try {
            await kafkaProducer.publish(KAFKA_TOPICS.JOB_STATUS_CHANGED, {
                requestId: req.params.id,
                jobId: job.id,
                providerId: job.providerId,
                customerId: job.request?.customerId,
                status: frontendStatus
            });
        } catch (publishErr) {
            logger.warn(`JOB_STATUS_CHANGED publish failed for request ${req.params.id}, continuing`);
            logger.error(publishErr as any);
        }

        res.json({ success: true, status: frontendStatus, job_status: jobStatus });
    } catch (err) {
        next(err);
    }
});

app.post('/:id/payment', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

        // Process payment (simplified)
        const request = await prisma.serviceRequest.findUnique({
            where: { id: req.params.id },
            include: { job: true }
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.customerId !== payload.userId) {
            return res.status(403).json({ message: 'Forbidden: this request belongs to another customer' });
        }

        if (!request.job) {
            return res.status(409).json({ message: 'Request has no active job' });
        }

        if (request.job.status !== 'COMPLETED') {
            return res.status(409).json({ message: 'Service must be completed before payment' });
        }

        res.json({ success: true, message: 'Payment processed', request_id: request.id, job_id: request.job.id });
    } catch (err) {
        next(err);
    }
});

// Alias for review endpoint (mobile-customer uses PUT /requests/:id/review)
app.put('/:id/review', async (req, res, next) => {
    try {
        const job = await prisma.job.findUnique({
            where: { requestId: req.params.id }
        });
        if (!job) {
            return res.status(404).json({ message: 'Job not found for this request' });
        }
        const review = await createReview.execute({
            ...req.body,
            jobId: job.id
        });
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
});

// Export the app
export const requestApp = app;
