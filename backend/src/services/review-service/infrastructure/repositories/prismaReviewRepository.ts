import { ReviewRepository } from '../../domain/repositories/reviewRepository';
import { Review } from '../../domain/entities/review';
import { prisma } from '../../../../shared/database/src/index';

export class PrismaReviewRepository implements ReviewRepository {
    async create(data: Partial<Review>): Promise<Review> {
        const review = await prisma.review.create({
            data: {
                jobId: data.jobId!,
                rating: data.rating!,
                comment: data.comment,
                tags: data.tags || []
            }
        });
        return review as unknown as Review; // Prisma type vs Domain type
    }
}
