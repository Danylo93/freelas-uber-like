import 'reflect-metadata';
import { container } from 'tsyringe';
import { ReviewRepository } from '../../domain/repositories/reviewRepository';
import { PrismaReviewRepository } from '../repositories/prismaReviewRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { KafkaMessageBroker } from '../messaging/kafkaMessageBroker';

// Register implementations
container.register<ReviewRepository>('ReviewRepository', {
    useClass: PrismaReviewRepository,
});

container.register<MessageBroker>('MessageBroker', {
    useClass: KafkaMessageBroker,
});

export { container };
