import { GeoRepository } from '../../domain/repositories/geoRepository';
import Redis from 'ioredis';
import { CONFIG } from '../../../../shared/shared-config/src/index';

export class RedisGeoRepository implements GeoRepository {
    private redis: Redis;
    private readonly GEO_KEY = 'providers:locations';

    constructor() {
        this.redis = new Redis(CONFIG.REDIS.URL);
    }

    async updateLocation(providerId: string, lat: number, lng: number): Promise<void> {
        await this.redis.geoadd(this.GEO_KEY, lng, lat, providerId);
    }

    async findNearby(lat: number, lng: number, radiusKm: number): Promise<string[]> {
        // georadius is deprecated in newer Redis versions in favor of geosearch, but ioredis supports both.
        // simpler syntax:
        const results = await this.redis.georadius(
            this.GEO_KEY,
            lng,
            lat,
            radiusKm,
            'km'
        );
        // returns array of member strings (providerIds)
        return results as string[];
    }

    async removeLocation(providerId: string): Promise<void> {
        await this.redis.zrem(this.GEO_KEY, providerId);
    }
}
