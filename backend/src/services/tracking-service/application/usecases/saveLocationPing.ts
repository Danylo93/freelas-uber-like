import { TrackingRepository } from '../../domain/repositories/trackingRepository';
import { LocationPing } from '../../domain/entities/locationPing';
import { logger } from '../../../../shared/shared-logger/src/index';

export class SaveLocationPing {
    constructor(private readonly trackingRepo: TrackingRepository) { }

    async execute(data: LocationPing) {
        try {
            // Persist the ping history
            await this.trackingRepo.save(data);

            // Update the provider's current location
            await this.trackingRepo.updateProviderLocation(data.providerId, data.lat, data.lng);

            logger.info(`Persisted location for job ${data.jobId}`);
        } catch (error) {
            logger.error('Failed to save location ping', error);
            throw error;
        }
    }
}
