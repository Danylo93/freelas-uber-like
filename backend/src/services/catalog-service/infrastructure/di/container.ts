import 'reflect-metadata';
import { container } from 'tsyringe';
import { CatalogRepository } from '../../domain/repositories/catalogRepository';
import { PrismaCatalogRepository } from '../repositories/prismaCatalogRepository';

// Register implementations
container.register<CatalogRepository>('CatalogRepository', {
    useClass: PrismaCatalogRepository,
});

export { container };
