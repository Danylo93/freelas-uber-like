import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { CreateReview } from '../application/usecases/createReview';
import { MessageBroker } from '../domain/services/messageBroker';
import { ReviewRepository } from '../domain/repositories/reviewRepository';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const reviewRepo = container.resolve<ReviewRepository>('ReviewRepository');
const messageBroker = container.resolve<MessageBroker>('MessageBroker');
const createReview = new CreateReview(reviewRepo, messageBroker);

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'review-service' });
});

app.post('/jobs/:jobId/reviews', async (req, res, next) => {
    try {
        const data = { ...req.body, jobId: req.params.jobId };
        const review = await createReview.execute(data);
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
});

// Alternative endpoint for compatibility
app.post('/reviews', async (req, res, next) => {
    try {
        const { jobId, rating, comment } = req.body;
        const data = { jobId, rating, comment };
        const review = await createReview.execute(data);
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
});

// Export the app
export const reviewApp = app;
