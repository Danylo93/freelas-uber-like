import { Category } from '../entities/category';

export interface CatalogRepository {
    findAll(): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    count(): Promise<number>;
    createCategory(data: { name: string; icon: string }): Promise<Category>;
    createService(data: { name: string; categoryId: string }): Promise<any>;
}
