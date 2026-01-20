import { GeoRepository } from '../../domain/repositories/geoRepository';

export class UpdateProviderLocation {
    constructor(private readonly geoRepo: GeoRepository) { }

    async execute(data: { providerId: string; lat: number; lng: number }) {
        await this.geoRepo.updateLocation(data.providerId, data.lat, data.lng);
    }
}
