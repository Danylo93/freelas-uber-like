import { User } from '../entities/user';

export interface UserRepository {
    findById(id: string): Promise<User | null>;
    // Other methods as needed (save, delete, etc. handled by auth-service mostly for creation)
}
