import express from 'express';
import cors from 'cors';
import { prisma, JobStatus } from '@freelas/database';
import { logger } from '@freelas/shared-logger';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'earnings-service' });
});

app.get('/providers/:id/earnings', async (req, res) => {
    // Join Job + Request to get price
    const jobs = await prisma.job.findMany({
        where: {
            providerId: req.params.id,
            status: JobStatus.COMPLETED
        },
        include: {
            request: true
        }
    });

    const total = jobs.reduce((acc, job) => acc + (job.request.price || 0), 0);

    res.json({
        total,
        currency: 'BRL',
        jobsCount: jobs.length,
        recentJobs: jobs.slice(0, 5)
    });
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  logger.info(`earnings-service listening on port ${PORT}`);
});
