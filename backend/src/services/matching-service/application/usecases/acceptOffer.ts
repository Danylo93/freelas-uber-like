import { MatchingRepository } from '../../domain/repositories/matchingRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { KAFKA_TOPICS } from '../../../../shared/shared-contracts/src/index';
import { AppError } from '../../../../shared/shared-errors/src/index';

export class AcceptOffer {
    constructor(
        private readonly matchingRepo: MatchingRepository,
        private readonly messageBroker: MessageBroker
    ) { }

    async execute(data: { requestId: string; providerId: string }) {
        // Try to acquire lock
        const locked = await this.matchingRepo.tryAcceptJob(data.requestId, data.providerId);
        if (!locked) {
            throw new AppError('Offer no longer available or already accepted', 409);
        }

        // Publish accepted event
        await this.messageBroker.publish(KAFKA_TOPICS.JOB_ACCEPTED, {
            jobId: data.requestId, // Mapping requestId to jobId
            providerId: data.providerId,
            timestamp: new Date().toISOString()
        });

        return { status: 'accepted', jobId: data.requestId };
    }
}
