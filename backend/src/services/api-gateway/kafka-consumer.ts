import { Server } from 'socket.io';
import { KafkaClient } from '../../shared/shared-kafka/src/index';
import { CONFIG } from '../../shared/shared-config/src/index';
import { KAFKA_TOPICS, OfferSentEvent, JobAcceptedEvent, RequestCreatedEvent } from '../../shared/shared-contracts/src/index';
import { logger } from '../../shared/shared-logger/src/index';

export async function setupKafkaConsumers(io: Server) {
  try {
    const kafka = new KafkaClient('api-gateway-consumer', CONFIG.KAFKA.BROKERS);

    kafka.connectConsumer('api-gateway-group', [
      KAFKA_TOPICS.MATCHING_OFFER_SENT,
      KAFKA_TOPICS.OFFER_CREATED,
      KAFKA_TOPICS.JOB_ACCEPTED,
      KAFKA_TOPICS.JOB_STATUS_CHANGED,
      KAFKA_TOPICS.JOB_LOCATION_PINGED
    ], async (payload) => {
      const topic = payload.topic;
      const message = payload.message.value?.toString();
      if (!message) return;

      const data = JSON.parse(message);
      logger.info(`Gateway received ${topic}`, data);

      switch (topic) {
        case KAFKA_TOPICS.MATCHING_OFFER_SENT:
        case KAFKA_TOPICS.OFFER_CREATED:
          // Emit to specific provider
          const offer = data as OfferSentEvent;
          io.to(`provider:${offer.providerId}`).emit('request_offer', offer);
          break;

        case KAFKA_TOPICS.JOB_ACCEPTED:
          const job = data as JobAcceptedEvent;
          // Notify Customer
          io.to(`customer:${job.customerId}`).emit('job_accepted', job);
          // Notify Provider (ack)
          io.to(`provider:${job.providerId}`).emit('job_accepted', job);
          break;

        case KAFKA_TOPICS.JOB_STATUS_CHANGED:
          io.to(`job:${data.jobId}`).emit('job_status_update', data);
          break;

        case KAFKA_TOPICS.JOB_LOCATION_PINGED:
          // If we want to broadcast raw pings directly
          io.to(`job:${data.jobId}`).emit('location_update', data);
          break;
      }
    }).catch(err => logger.error('Failed to start API Gateway Kafka consumer', err));
  } catch (err) {
    logger.error('Failed to setup Kafka consumers', err);
    // Não re-throw - permite que o servidor continue funcionando
  }
}
