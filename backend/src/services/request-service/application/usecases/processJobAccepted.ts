import { RequestRepository } from '../../domain/repositories/requestRepository';
import { logger } from '../../../../shared/shared-logger/src/index';

export class ProcessJobAccepted {
    constructor(private readonly requestRepo: RequestRepository) { }

    async execute(data: { requestId?: string; jobId?: string; providerId: string }) {
        try {
            const requestId = data.requestId || data.jobId;
            if (!requestId) {
                logger.warn('Job accepted event missing requestId/jobId');
                return;
            }
            
            const request = await this.requestRepo.findById(requestId);
            if (request) {
                await this.requestRepo.update(request.id, {
                    status: 'ACCEPTED',
                    providerId: data.providerId
                } as any);
                logger.info(`Request ${request.id} accepted by provider ${data.providerId}`);
            } else {
                logger.warn(`Job accepted event received for unknown request ${requestId}`);
            }
        } catch (err) {
            logger.error('Error processing job accepted event', err);
            // Don't throw to avoid killing consumer, just log
        }
    }
}
