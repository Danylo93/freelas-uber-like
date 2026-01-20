import express, { Request, Response } from 'express';
import cors from 'cors';
import { container } from '../infrastructure/di/container';
import { GetCategories } from '../application/usecases/getCategories';
import { GetCategory } from '../application/usecases/getCategory';
import { SeedCatalog } from '../application/usecases/seedCatalog';
import { CatalogRepository } from '../domain/repositories/catalogRepository';

const app = express();
app.use(cors());
app.use(express.json());

// Resolve dependencies
const catalogRepo = container.resolve<CatalogRepository>('CatalogRepository');
const getCategories = new GetCategories(catalogRepo);
const getCategory = new GetCategory(catalogRepo);
const seedCatalog = new SeedCatalog(catalogRepo);

// Seed on startup (optional, or via specific endpoint/script)
seedCatalog.execute().catch(console.error);

app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', service: 'catalog-service' });
});

app.get('/categories', async (req, res, next) => {
    try {
        const categories = await getCategories.execute();
        res.json(categories);
    } catch (err) {
        next(err);
    }
});

app.get('/categories/:id', async (req, res, next) => {
    try {
        const category = await getCategory.execute(req.params.id);
        res.json(category);
    } catch (err) {
        // Basic error handling, can be improved with middleware
        res.status(404).json({ message: (err as Error).message });
    }
});

// Export the app
export const catalogApp = app;
