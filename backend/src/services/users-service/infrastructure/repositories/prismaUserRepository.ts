import { UserRepository } from '../../domain/repositories/userRepository';
import { User } from '../../domain/entities/user';
import { prisma } from '../../../../shared/database/src/index';

export class PrismaUserRepository implements UserRepository {
    async findById(id: string): Promise<User | null> {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return null;
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || undefined,
            createdAt: user.createdAt
        };
    }
}
