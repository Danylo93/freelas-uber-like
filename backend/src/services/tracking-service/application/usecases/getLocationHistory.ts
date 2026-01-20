import { TrackingRepository } from '../../domain/repositories/trackingRepository';

export class GetLocationHistory {
    constructor(private readonly trackingRepo: TrackingRepository) { }

    async execute(jobId: string) {
        return this.trackingRepo.getHistory(jobId);
    }
}
