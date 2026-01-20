import { CatalogRepository } from '../../domain/repositories/catalogRepository';

export class GetCategories {
    constructor(private readonly catalogRepo: CatalogRepository) { }

    async execute() {
        return this.catalogRepo.findAll();
    }
}
