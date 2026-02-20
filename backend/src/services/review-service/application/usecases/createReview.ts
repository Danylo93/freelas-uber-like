import { ReviewRepository } from '../../domain/repositories/reviewRepository';
import { MessageBroker } from '../../domain/services/messageBroker';
import { ReviewSchema, KAFKA_TOPICS } from '../../../../shared/shared-contracts/src/index';
import { logger } from '../../../../shared/shared-logger/src/index';

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

        // Publish event (non-blocking for core API success)
        try {
            await this.messageBroker.publish(KAFKA_TOPICS.REVIEW_CREATED, {
                reviewId: review.id,
                jobId: review.jobId,
                rating: review.rating
            });
        } catch (publishErr) {
            logger.warn(`REVIEW_CREATED publish failed for review ${review.id}, continuing`);
            logger.error(publishErr as any);
        }

        return review;
    }
}
