import { RequestRepository } from '../../domain/repositories/requestRepository';
import { AppError } from '../../../../shared/shared-errors/src/index';

export class GetRequest {
    constructor(private readonly requestRepo: RequestRepository) { }

    async execute(id: string) {
        const request = await this.requestRepo.findById(id);
        if (!request) {
            throw new AppError('Request not found', 404);
        }
        return request;
    }
}
