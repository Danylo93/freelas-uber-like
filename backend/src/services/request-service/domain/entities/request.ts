export interface Request {
    id: string;
    userId: string;
    serviceId: string;
    description?: string;
    location: any; // Using any for JSON scalar for now, or define LocationType
    scheduledTo: Date;
    status: string;
    providerId?: string;
    createdAt?: Date;
    // Fields used for creation (mapped from Prisma schema)
    customerId?: string;
    categoryId?: string;
    price?: number;
    pickupLat?: number;
    pickupLng?: number;
    address?: string;
}
