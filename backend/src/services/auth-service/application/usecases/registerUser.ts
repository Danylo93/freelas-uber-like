import { UserRepository } from '../../domain/repositories/userRepository';
import { BadRequestError } from '../../../../shared/shared-errors/src/index';
import bcrypt from 'bcryptjs';

export class RegisterUser {
    constructor(private readonly userRepo: UserRepository) { }

    async execute(data: {
        name: string;
        email: string;
        password: string;
        role: string;
        phone?: string;
    }) {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw new BadRequestError('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.userRepo.create({
            ...data,
            password: hashedPassword,
        });
        return user;
    }
}
