export interface GeoRepository {
    updateLocation(providerId: string, lat: number, lng: number): Promise<void>;
    findNearby(lat: number, lng: number, radiusKm: number): Promise<string[]>; // Returns providerIds
    removeLocation(providerId: string): Promise<void>;
}
