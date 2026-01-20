import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserRepository } from '../../domain/repositories/userRepository';
import { PrismaUserRepository } from '../repositories/prismaUserRepository';
import { ProviderRepository } from '../../domain/repositories/providerRepository';
import { PrismaProviderRepository } from '../repositories/prismaProviderRepository';

// Register implementations
container.register<UserRepository>('UserRepository', {
    useClass: PrismaUserRepository,
});

container.register<ProviderRepository>('ProviderRepository', {
    useClass: PrismaProviderRepository,
});

export { container };
