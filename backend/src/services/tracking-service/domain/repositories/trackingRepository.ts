import { LocationPing } from '../entities/locationPing';

export interface TrackingRepository {
    save(ping: LocationPing): Promise<void>;
    updateProviderLocation(providerId: string, lat: number, lng: number): Promise<void>;
    getHistory(jobId: string): Promise<LocationPing[]>;
}
