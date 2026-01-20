import { UserRepository } from '../../domain/repositories/userRepository';
import { AppError } from '../../../../shared/shared-errors/src/index';

export class GetUser {
    constructor(private readonly userRepo: UserRepository) { }

    async execute(id: string) {
        const user = await this.userRepo.findById(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }
}
