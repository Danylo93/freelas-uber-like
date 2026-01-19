import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { prisma, UserRole } from '@freelas/database';
import { logger } from '@freelas/shared-logger';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'users-service' });
});

// Get user profile (basic)
app.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Get provider profile
app.get('/providers/:id', async (req, res) => {
  const provider = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { providerProfile: true }
  });

  if (!provider || provider.role !== UserRole.PROVIDER) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  res.json({
    id: provider.id,
    name: provider.name,
    specialties: provider.providerProfile?.specialties || [],
    rating: provider.providerProfile?.rating || 0,
    isOnline: provider.providerProfile?.isOnline || false
  });
});

// Update provider specialties/docs
app.put('/providers/:id', async (req, res) => {
  const { specialties, isOnline } = req.body;
  // In real app, check Auth token here (Gateway handles verification, passes User ID)

  try {
    const updated = await prisma.providerProfile.update({
      where: { userId: req.params.id },
      data: {
        specialties,
        isOnline
      }
    });
    res.json(updated);
  } catch (e) {
    logger.error(e);
    res.status(500).json({ message: 'Update failed' });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`users-service listening on port ${PORT}`);
});
