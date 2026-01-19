import { Server } from 'socket.io';
import { KafkaClient } from '@freelas/shared-kafka';
import { CONFIG } from '@freelas/shared-config';
import { KAFKA_TOPICS, OfferSentEvent, JobAcceptedEvent, RequestCreatedEvent } from '@freelas/shared-contracts';
import { logger } from '@freelas/shared-logger';

export async function setupKafkaConsumers(io: Server) {
  const kafka = new KafkaClient('api-gateway-consumer', CONFIG.KAFKA.BROKERS);

  await kafka.connectConsumer('api-gateway-group', [
    KAFKA_TOPICS.MATCHING_OFFER_SENT,
    KAFKA_TOPICS.JOB_ACCEPTED,
    KAFKA_TOPICS.JOB_STATUS_CHANGED,
    // KAFKA_TOPICS.JOB_LOCATION_UPDATE // If separate topic
    KAFKA_TOPICS.JOB_LOCATION_PINGED // For now re-emitting Ping directly or listen to processed update
  ], async (payload) => {
    const topic = payload.topic;
    const message = payload.message.value?.toString();
    if (!message) return;

    const data = JSON.parse(message);
    logger.info(`Gateway received ${topic}`, data);

    switch (topic) {
      case KAFKA_TOPICS.MATCHING_OFFER_SENT:
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
        // Both join job room (client side should emit join_job, but we can emit event to trigger it)
        break;

      case KAFKA_TOPICS.JOB_STATUS_CHANGED:
        io.to(`job:${data.jobId}`).emit('job_status_update', data);
        break;

      case KAFKA_TOPICS.JOB_LOCATION_PINGED:
         // If we want to broadcast raw pings directly
         io.to(`job:${data.jobId}`).emit('location_update', data);
         break;
    }
  });
}
