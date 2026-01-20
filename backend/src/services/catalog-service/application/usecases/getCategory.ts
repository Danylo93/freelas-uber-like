import { CatalogRepository } from '../../domain/repositories/catalogRepository';
import { AppError } from '../../../../shared/shared-errors/src/index';

export class GetCategory {
    constructor(private readonly catalogRepo: CatalogRepository) { }

    async execute(id: string) {
        const category = await this.catalogRepo.findById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        return category;
    }
}
