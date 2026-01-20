import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../../shared-logger/src/index';

export class KafkaClient {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer | null = null;
  private isConnected: boolean = false;

  constructor(clientId: string, brokers: string[]) {
    this.kafka = new Kafka({
      clientId,
      brokers,
    });
    this.producer = this.kafka.producer();
  }

  async connectProducer() {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka Producer connected');
    }
  }

  async publish(topic: string, message: any) {
    if (!this.isConnected) await this.connectProducer();

    await this.producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) },
      ],
    });
    logger.info(`Published to ${topic}`, message);
  }

  async connectConsumer(groupId: string, topics: string[], eachMessage: (payload: EachMessagePayload) => Promise<void>) {
    try {
      this.consumer = this.kafka.consumer({ groupId });
      await this.consumer.connect();
      await this.consumer.subscribe({ topics, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async (payload) => {
          try {
            await eachMessage(payload);
          } catch (error) {
            logger.error('Error processing Kafka message', error);
            // Não re-throw para não crashar o consumer
          }
        },
      });
      logger.info(`Kafka Consumer connected to group ${groupId}, topics: ${topics.join(',')}`);
    } catch (error) {
      logger.error(`Failed to connect Kafka consumer for group ${groupId}`, error);
      // Não re-throw para não crashar o app
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    if (this.consumer) await this.consumer.disconnect();
  }
}
