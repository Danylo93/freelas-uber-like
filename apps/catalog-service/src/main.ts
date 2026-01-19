import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { prisma } from '@freelas/database';
import { logger } from '@freelas/shared-logger';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'catalog-service' });
});

app.get('/categories', async (req, res) => {
  const categories = await prisma.serviceCategory.findMany({
    include: { services: true }
  });
  res.json(categories);
});

app.get('/categories/:id', async (req, res) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: req.params.id },
    include: { services: true }
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

async function seed() {
  const count = await prisma.serviceCategory.count();
  if (count === 0) {
    logger.info('Seeding catalog...');
    const cat1 = await prisma.serviceCategory.create({
      data: { name: 'Home Cleaning', icon: 'cleaning-services' }
    });
    await prisma.service.create({ data: { name: 'Standard Cleaning', categoryId: cat1.id } });
    await prisma.service.create({ data: { name: 'Deep Cleaning', categoryId: cat1.id } });

    const cat2 = await prisma.serviceCategory.create({
      data: { name: 'Plumbing', icon: 'plumbing' }
    });
    await prisma.service.create({ data: { name: 'Leak Repair', categoryId: cat2.id } });
    await prisma.service.create({ data: { name: 'Installation', categoryId: cat2.id } });

    const cat3 = await prisma.serviceCategory.create({
      data: { name: 'Electrician', icon: 'electrical-services' }
    });
    await prisma.service.create({ data: { name: 'Wiring', categoryId: cat3.id } });

    logger.info('Seeding complete');
  }
}

const PORT = process.env.PORT || 3003;

app.listen(PORT, async () => {
  await seed();
  logger.info(`catalog-service listening on port ${PORT}`);
});
