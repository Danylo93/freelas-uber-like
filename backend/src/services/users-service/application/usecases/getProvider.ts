import { ProviderRepository } from '../../domain/repositories/providerRepository';
import { AppError } from '../../../../shared/shared-errors/src/index';

export class GetProvider {
    constructor(private readonly providerRepo: ProviderRepository) { }

    async execute(userId: string) {
        const profile = await this.providerRepo.findByUserId(userId);
        if (!profile) {
            throw new AppError('Provider profile not found', 404);
        }
        return profile;
    }
}
