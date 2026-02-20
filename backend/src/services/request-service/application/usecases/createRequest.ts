import { RequestRepository } from '../../domain/repositories/requestRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { CreateRequestSchema, KAFKA_TOPICS, RequestCreatedEvent } from '../../../../shared/shared-contracts/src/index';
import { logger } from '../../../../shared/shared-logger/src/index';

export class CreateRequest {
    constructor(
        private readonly requestRepo: RequestRepository,
        private readonly messageBroker: MessageBroker
    ) { }

    async execute(data: any) {
        try {
            const validated = CreateRequestSchema.parse(data);
            
            // Get customerId from headers or body (Gateway should inject it)
            const customerId = (data as any).customerId || (data as any).userId || 'temp-user-id';

            // Create in DB
            const request = await this.requestRepo.create({
                customerId,
                categoryId: validated.categoryId,
                description: validated.description,
                price: validated.price,
                pickupLat: validated.pickupLat,
                pickupLng: validated.pickupLng,
                address: validated.address,
                status: 'PENDING'
            });

            // Publish event
            const event: RequestCreatedEvent = {
                requestId: request.id,
                customerId,
                categoryId: validated.categoryId,
                lat: validated.pickupLat,
                lng: validated.pickupLng,
                description: validated.description,
                price: validated.price
            };
            
            try {
                await this.messageBroker.publish(KAFKA_TOPICS.REQUEST_CREATED, event);
            } catch (publishErr) {
                logger.warn(`REQUEST_CREATED publish failed for request ${request.id}, continuing without event`);
                logger.error(publishErr as any);
            }
            logger.info(`Request created: ${request.id}`);

            return request;
        } catch (err) {
            logger.error('Error creating request', err);
            throw err;
        }
    }
}
