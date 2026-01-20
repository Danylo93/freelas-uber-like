import { ProviderProfile } from '../entities/providerProfile';

export interface ProviderRepository {
    findByUserId(userId: string): Promise<ProviderProfile | null>;
    update(userId: string, data: Partial<ProviderProfile>): Promise<ProviderProfile>;
}
