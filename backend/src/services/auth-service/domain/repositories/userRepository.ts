export interface UserRepository {
    findByEmail(email: string): Promise<any | null>;
    create(user: {
        name: string;
        email: string;
        password: string;
        role: string;
        phone?: string;
    }): Promise<any>;
    // Additional methods can be added as needed
}
