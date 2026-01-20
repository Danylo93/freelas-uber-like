import { ProviderRepository } from '../../domain/repositories/providerRepository';
import { ProviderProfile } from '../../domain/entities/providerProfile';
import { prisma } from '../../../../shared/database/src/index';

export class PrismaProviderRepository implements ProviderRepository {
    async findByUserId(userId: string): Promise<ProviderProfile | null> {
        const profile = await prisma.providerProfile.findUnique({ where: { userId } });
        if (!profile) return null;
        return {
            id: profile.id,
            userId: profile.userId,
            currentLat: profile.currentLat || undefined,
            currentLng: profile.currentLng || undefined,
            // vehicleType and documentStatus not in Prisma schema
            vehicleType: undefined,
            documentStatus: undefined
        };
    }

    async update(userId: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
        const updated = await prisma.providerProfile.update({
            where: { userId },
            data: {
                // vehicleType and documentStatus not in Prisma schema - ignoring
                // lat/lng are usually updated via tracking service, but maybe editable here too?
                // Let's allow updating what's passed
                currentLat: data.currentLat,
                currentLng: data.currentLng
            }
        });
        return {
            id: updated.id,
            userId: updated.userId,
            currentLat: updated.currentLat || undefined,
            currentLng: updated.currentLng || undefined,
            // vehicleType and documentStatus not in Prisma schema
            vehicleType: undefined,
            documentStatus: undefined
        };
    }
}
