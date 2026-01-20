import { Review } from '../entities/review';

export interface ReviewRepository {
    create(data: Partial<Review>): Promise<Review>;
    // Other methods if needed
}
