import { ReviewRepository } from '../../domain/repositories/reviewRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { ReviewSchema, KAFKA_TOPICS } from '../../../../shared/shared-contracts/src/index';

export class CreateReview {
    constructor(
        private readonly reviewRepo: ReviewRepository,
        private readonly messageBroker: MessageBroker
    ) { }

    async execute(data: any) {
        const validated = ReviewSchema.parse(data);

        // Create review
        const review = await this.reviewRepo.create({
            jobId: validated.jobId,
            rating: validated.rating,
            comment: validated.comment,
            tags: validated.tags || []
        });

        // Publish event
        await this.messageBroker.publish(KAFKA_TOPICS.REVIEW_CREATED, {
            reviewId: review.id,
            jobId: review.jobId,
            rating: review.rating
        });

        return review;
    }
}
