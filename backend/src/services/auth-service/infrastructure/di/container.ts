import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserRepository } from '../../domain/repositories/userRepository';
import { PrismaUserRepository } from '../repositories/prismaUserRepository';

// Register implementations
container.register<UserRepository>('UserRepository', {
    useClass: PrismaUserRepository,
});

export { container };
