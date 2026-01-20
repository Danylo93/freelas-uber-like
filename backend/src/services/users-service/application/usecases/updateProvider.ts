import { ProviderRepository } from '../../domain/repositories/providerRepository';

export class UpdateProvider {
    constructor(private readonly providerRepo: ProviderRepository) { }

    async execute(userId: string, data: any) {
        return this.providerRepo.update(userId, data);
    }
}
