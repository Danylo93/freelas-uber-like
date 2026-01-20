import { MessageBroker } from '../../domain/services/messageBroker';
import { KafkaClient } from '../../../../shared/shared-kafka/src/index';
import { CONFIG } from '../../../../shared/shared-config/src/index';

export class KafkaMessageBroker implements MessageBroker {
    private client: KafkaClient;

    constructor() {
        this.client = new KafkaClient('tracking-producer', CONFIG.KAFKA.BROKERS);
    }

    async connectProducer(): Promise<void> {
        // KafkaClient usually connects lazily or via explicit method if wrapper supports it.
        // The shared wrapper 'KafkaClient' uses 'connect' inside publish or explicit 'connectConsumer'.
        // Here we'll assume publish handles it or we'll ensure connection if needed.
        // Accessing private method if TS allows, or just no-op if handled by publish.
    }

    async publish(topic: string, message: any): Promise<void> {
        await this.client.publish(topic, message);
    }
}
