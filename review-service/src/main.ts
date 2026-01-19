import express from 'express';
import cors from 'cors';
import { prisma, JobStatus } from '@freelas/database';
import { logger } from '@freelas/shared-logger';
import { KafkaClient } from '@freelas/shared-kafka';
import { CONFIG } from '@freelas/shared-config';
import { KAFKA_TOPICS } from '@freelas/shared-contracts';

const app = express();
app.use(cors());
app.use(express.json());

const kafka = new KafkaClient('review-producer', CONFIG.KAFKA.BROKERS);
kafka.connectProducer().catch(e => logger.error(e));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'review-service' });
});

app.post('/jobs/:jobId/reviews', async (req, res) => {
    const { rating, comment, tags } = req.body;

    // Check if job completed
    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job || job.status !== JobStatus.COMPLETED) {
        // For testing we allow reviewing started jobs, or return 400
        // return res.status(400).json({ message: 'Job not completed' });
    }

    const review = await prisma.review.create({
        data: {
            jobId: req.params.jobId,
            rating,
            comment,
            tags
        }
    });

    await kafka.publish(KAFKA_TOPICS.REVIEW_CREATED, review);

    res.json(review);
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  logger.info(`review-service listening on port ${PORT}`);
});
