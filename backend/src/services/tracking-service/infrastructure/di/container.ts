import 'reflect-metadata';
import { container } from 'tsyringe';
import { TrackingRepository } from '../../domain/repositories/trackingRepository';
import { PrismaTrackingRepository } from '../repositories/prismaTrackingRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { KafkaMessageBroker } from '../messaging/kafkaMessageBroker';

// Register implementations
container.register<TrackingRepository>('TrackingRepository', {
    useClass: PrismaTrackingRepository,
});

container.register<MessageBroker>('MessageBroker', {
    useClass: KafkaMessageBroker,
});

export { container };
