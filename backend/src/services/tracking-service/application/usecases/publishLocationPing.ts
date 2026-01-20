import { MessageBroker } from '../../domain/services/messageBroker';
import { KAFKA_TOPICS } from '../../../../shared/shared-contracts/src/index';

export class PublishLocationPing {
    constructor(private readonly messageBroker: MessageBroker) { }

    async execute(data: { jobId: string; providerId: string; lat: number; lng: number }) {
        await this.messageBroker.publish(KAFKA_TOPICS.JOB_LOCATION_PINGED, data);
    }
}
