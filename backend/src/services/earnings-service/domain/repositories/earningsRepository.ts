import { ProviderEarnings } from '../entities/providerEarnings';

export interface EarningsRepository {
    getEarnings(providerId: string): Promise<ProviderEarnings>;
}
