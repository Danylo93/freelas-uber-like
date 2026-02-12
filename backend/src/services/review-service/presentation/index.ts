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

const createReviewHandler = async (req: Request, res: Response, next: Function) => {
    try {
        const jobId = req.params.jobId || req.body.jobId || req.body.request_id;
        const { rating, comment, tags } = req.body;
        const data = { jobId, rating, comment, tags };
        const review = await createReview.execute(data);
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
};

app.post('/jobs/:jobId/reviews', createReviewHandler);

// Compatibility endpoints (mounts at /reviews and /ratings)
app.post('/', createReviewHandler);
app.put('/', createReviewHandler);

// Export the app
export const reviewApp = app;
