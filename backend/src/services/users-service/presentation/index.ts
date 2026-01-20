import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { UserRepository } from '../domain/repositories/userRepository';
import { ProviderRepository } from '../domain/repositories/providerRepository';
import { GetUser } from '../application/usecases/getUser';
import { GetProvider } from '../application/usecases/getProvider';
import { UpdateProvider } from '../application/usecases/updateProvider';
import { prisma } from '../../../shared/database/src/index';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const userRepo = container.resolve<UserRepository>('UserRepository');
const providerRepo = container.resolve<ProviderRepository>('ProviderRepository');

const getUser = new GetUser(userRepo);
const getProvider = new GetProvider(providerRepo);
const updateProvider = new UpdateProvider(providerRepo);

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'users-service' });
});

app.get('/users/:id', async (req, res, next) => {
    try {
        const user = await getUser.execute(req.params.id);
        res.json(user);
    } catch (err) {
        if ((err as Error).message === 'User not found') {
            res.status(404).json({ message: 'User not found' });
        } else {
            next(err);
        }
    }
});

// Providers routes - mounted at /providers in server.ts
app.get('/', async (req, res, next) => {
    try {
        // List all providers (simplified - in production would have pagination/filters)
        const providers = await prisma.providerProfile.findMany({
            include: { user: true }
        });
        res.json(providers.map((p: any) => ({
            id: p.id,
            user_id: p.userId,
            name: p.user.name,
            rating: p.rating,
            isOnline: p.isOnline,
            specialties: p.specialties,
            currentLat: p.currentLat,
            currentLng: p.currentLng
        })));
    } catch (err) {
        next(err);
    }
});

app.get('/:id', async (req, res, next) => {
    try {
        const profile = await getProvider.execute(req.params.id);
        res.json(profile);
    } catch (err) {
        next(err);
    }
});

app.put('/:id', async (req, res, next) => {
    try {
        const updated = await updateProvider.execute(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// Handle /provider/location (mobile apps call PUT /provider/location)
// This will be mounted at /provider in server.ts
app.put('/location', async (req, res, next) => {
    try {
        // Get provider from auth token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
        
        const { lat, lng, isOnline } = req.body;
        // Update provider location and online status
        const updated = await updateProvider.execute(payload.userId, {
            currentLat: lat,
            currentLng: lng,
            isOnline: isOnline !== undefined ? isOnline : undefined
        });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// Export the app
export const usersApp = app;
