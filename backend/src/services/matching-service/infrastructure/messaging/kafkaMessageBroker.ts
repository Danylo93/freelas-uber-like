import { MessageBroker } from '../../domain/services/messageBroker';
import { KafkaClient } from '../../../../shared/shared-kafka/src/index';
import { CONFIG } from '../../../../shared/shared-config/src/index';

export class KafkaMessageBroker implements MessageBroker {
    private client: KafkaClient;

    constructor() {
        this.client = new KafkaClient('matching-producer', CONFIG.KAFKA.BROKERS);
    }

    async publish(topic: string, message: any): Promise<void> {
        await this.client.publish(topic, message);
    }
}
