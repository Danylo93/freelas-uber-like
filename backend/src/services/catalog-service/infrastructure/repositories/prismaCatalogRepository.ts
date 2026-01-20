import { CatalogRepository } from '../../domain/repositories/catalogRepository';
import { Category } from '../../domain/entities/category';
import { prisma } from '../../../../shared/database/src/index';

export class PrismaCatalogRepository implements CatalogRepository {
    async findAll(): Promise<Category[]> {
        return prisma.serviceCategory.findMany({
            include: { services: true }
        });
    }

    async findById(id: string): Promise<Category | null> {
        return prisma.serviceCategory.findUnique({
            where: { id },
            include: { services: true }
        });
    }

    async count(): Promise<number> {
        return prisma.serviceCategory.count();
    }

    async createCategory(data: { name: string; icon: string }): Promise<Category> {
        return prisma.serviceCategory.create({ data });
    }

    async createService(data: { name: string; categoryId: string }): Promise<any> {
        return prisma.service.create({ data });
    }
}
