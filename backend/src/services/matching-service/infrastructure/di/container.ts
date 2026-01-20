import 'reflect-metadata';
import { container } from 'tsyringe';
import { GeoRepository } from '../../domain/repositories/geoRepository';
import { RedisGeoRepository } from '../repositories/redisGeoRepository';
import { MatchingRepository } from '../../domain/repositories/matchingRepository';
import { RedisMatchingRepository } from '../repositories/redisMatchingRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { KafkaMessageBroker } from '../messaging/kafkaMessageBroker';

// Register implementations
container.register<GeoRepository>('GeoRepository', {
    useClass: RedisGeoRepository,
});

container.register<MatchingRepository>('MatchingRepository', {
    useClass: RedisMatchingRepository,
});

container.register<MessageBroker>('MessageBroker', {
    useClass: KafkaMessageBroker,
});

export { container };
