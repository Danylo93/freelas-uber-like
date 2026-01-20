import { GeoRepository } from '../../domain/repositories/geoRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { KAFKA_TOPICS } from '../../../../shared/shared-contracts/src/index';
import { logger } from '../../../../shared/shared-logger/src/index';

export class FindAndNotifyProviders {
    constructor(
        private readonly geoRepo: GeoRepository,
        private readonly messageBroker: MessageBroker
    ) { }

    async execute(data: { requestId: string; location: any }) {
        // Assuming location has lat/lng structure
        const lat = data.location.lat;
        const lng = data.location.lng;

        if (!lat || !lng) {
            logger.warn('Invalid location data for request matching', data);
            return;
        }

        const radiusKm = 10; // Configurable
        const providerIds = await this.geoRepo.findNearby(lat, lng, radiusKm);

        logger.info(`Found ${providerIds.length} providers for request ${data.requestId}`);

        for (const providerId of providerIds) {
            await this.messageBroker.publish(KAFKA_TOPICS.OFFER_CREATED, {
                requestId: data.requestId,
                providerId: providerId,
                timeout: 30 // seconds
            });
        }
    }
}
