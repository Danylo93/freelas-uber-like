import 'reflect-metadata';
import { container } from 'tsyringe';
import { RequestRepository } from '../../domain/repositories/requestRepository';
import { PrismaRequestRepository } from '../repositories/prismaRequestRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { KafkaMessageBroker } from '../messaging/kafkaMessageBroker';

// Register implementations
container.register<RequestRepository>('RequestRepository', {
    useClass: PrismaRequestRepository,
});

container.register<MessageBroker>('MessageBroker', {
    useClass: KafkaMessageBroker,
});

export { container };
