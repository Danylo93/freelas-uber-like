import 'reflect-metadata';
import { container } from 'tsyringe';
import { EarningsRepository } from '../../domain/repositories/earningsRepository';
import { PrismaEarningsRepository } from '../repositories/prismaEarningsRepository';

// Register implementations
container.register<EarningsRepository>('EarningsRepository', {
    useClass: PrismaEarningsRepository,
});

export { container };
