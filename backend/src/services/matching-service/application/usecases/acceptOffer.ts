import { MatchingRepository } from '../../domain/repositories/matchingRepository';
import { AppError } from '../../../../shared/shared-errors/src/index';

export class AcceptOffer {
    constructor(
        private readonly matchingRepo: MatchingRepository
    ) { }

    async execute(data: { requestId: string; providerId: string }) {
        // Try to acquire lock
        const locked = await this.matchingRepo.tryAcceptJob(data.requestId, data.providerId);
        if (!locked) {
            throw new AppError('Offer no longer available or already accepted', 409);
        }

        return { status: 'accepted' };
    }
}
