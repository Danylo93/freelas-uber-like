import { MatchingRepository } from '../../domain/repositories/matchingRepository';
import Redis from 'ioredis';
import { CONFIG } from '../../../../shared/shared-config/src/index';

export class RedisMatchingRepository implements MatchingRepository {
    private redis: Redis;

    constructor() {
        this.redis = new Redis(CONFIG.REDIS.URL);
    }

    async tryAcceptJob(jobId: string, providerId: string): Promise<boolean> {
        const key = `job:${jobId}:accepted`;
        // SETNX to ensure only one provider accepts
        const result = await this.redis.set(key, providerId, 'EX', 3600, 'NX'); // Expires in 1 hour
        return result === 'OK';
    }
}
