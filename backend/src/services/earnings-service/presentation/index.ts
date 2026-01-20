import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { GetProviderEarnings } from '../application/usecases/getProviderEarnings';
import { EarningsRepository } from '../domain/repositories/earningsRepository';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const earningsRepo = container.resolve<EarningsRepository>('EarningsRepository');
const getProviderEarnings = new GetProviderEarnings(earningsRepo);

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'earnings-service' });
});

app.get('/providers/:id/earnings', async (req, res, next) => {
    try {
        const earnings = await getProviderEarnings.execute(req.params.id);
        res.json(earnings);
    } catch (err) {
        next(err);
    }
});

// Export the app
export const earningsApp = app;
