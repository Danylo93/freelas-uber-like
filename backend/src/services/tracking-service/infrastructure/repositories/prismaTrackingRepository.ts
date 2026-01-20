import { TrackingRepository } from '../../domain/repositories/trackingRepository';
import { LocationPing } from '../../domain/entities/locationPing';
import { prisma } from '../../../../shared/database/src/index';

export class PrismaTrackingRepository implements TrackingRepository {
    async save(ping: LocationPing): Promise<void> {
        await prisma.locationPing.create({
            data: {
                jobId: ping.jobId,
                providerId: ping.providerId,
                lat: ping.lat,
                lng: ping.lng,
                timestamp: ping.timestamp
            }
        });
    }

    async updateProviderLocation(providerId: string, lat: number, lng: number): Promise<void> {
        await prisma.providerProfile.update({
            where: { userId: providerId },
            data: {
                currentLat: lat,
                currentLng: lng
            }
        });
    }

    async getHistory(jobId: string): Promise<LocationPing[]> {
        const history = await prisma.locationPing.findMany({
            where: { jobId },
            orderBy: { timestamp: 'asc' }
        });
        // Map Prisma objects to Domain entities if strict DDD, but here they match close enough
        // Ideally we return explicit LocationPing objects
        return history.map(h => ({
            id: h.id,
            jobId: h.jobId,
            providerId: h.providerId,
            lat: h.lat,
            lng: h.lng,
            timestamp: h.timestamp
        }));
    }
}
