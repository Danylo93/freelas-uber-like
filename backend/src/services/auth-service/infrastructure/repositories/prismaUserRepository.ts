import { UserRepository } from '../../domain/repositories/userRepository';
import { prisma, UserRole } from '../../../../shared/database/src/index';

export class PrismaUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<any | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async create(user: { name: string; email: string; password: string; role: string; phone?: string; }): Promise<any> {
        return prisma.user.create({ 
            data: {
                ...user,
                role: user.role as UserRole
            }
        });
    }
}
