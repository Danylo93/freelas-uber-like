import { EarningsRepository } from '../../domain/repositories/earningsRepository';

export class GetProviderEarnings {
    constructor(private readonly earningsRepo: EarningsRepository) { }

    async execute(providerId: string) {
        return this.earningsRepo.getEarnings(providerId);
    }
}
