import { EarningsRepository } from '../../domain/repositories/earningsRepository';
import { ProviderEarnings } from '../../domain/entities/providerEarnings';
import { prisma } from '../../../../shared/database/src/index';

export class PrismaEarningsRepository implements EarningsRepository {
    async getEarnings(providerId: string): Promise<ProviderEarnings> {
        // Job doesn't have price, but ServiceRequest does
        const jobs = await prisma.job.findMany({
            where: { providerId: providerId, status: 'COMPLETED' },
            include: { request: true }
        });
        
        const total = jobs.reduce((sum, job) => {
            return sum + (job.request.price || 0);
        }, 0);
        
        return {
            providerId,
            total
        };
    }
}
