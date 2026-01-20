import { CatalogRepository } from '../../domain/repositories/catalogRepository';
import { logger } from '../../../../shared/shared-logger/src/index';

export class SeedCatalog {
    constructor(private readonly catalogRepo: CatalogRepository) { }

    async execute() {
        const count = await this.catalogRepo.count();
        if (count === 0) {
            logger.info('Seeding catalog...');
            const cat1 = await this.catalogRepo.createCategory({ name: 'Home Cleaning', icon: 'cleaning-services' });
            await this.catalogRepo.createService({ name: 'Standard Cleaning', categoryId: cat1.id });
            await this.catalogRepo.createService({ name: 'Deep Cleaning', categoryId: cat1.id });

            const cat2 = await this.catalogRepo.createCategory({ name: 'Plumbing', icon: 'plumbing' });
            await this.catalogRepo.createService({ name: 'Leak Repair', categoryId: cat2.id });
            await this.catalogRepo.createService({ name: 'Installation', categoryId: cat2.id });

            const cat3 = await this.catalogRepo.createCategory({ name: 'Electrician', icon: 'electrical-services' });
            await this.catalogRepo.createService({ name: 'Wiring', categoryId: cat3.id });

            logger.info('Seeding complete');
        }
    }
}
