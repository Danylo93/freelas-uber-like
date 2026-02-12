export interface ProviderProfile {
    id: string;
    userId: string;
    currentLat?: number;
    currentLng?: number;
    isOnline?: boolean;
    vehicleType?: string;
    documentStatus?: string;
    // Add other fields as needed
}
