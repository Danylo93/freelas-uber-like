import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { CONFIG } from '@freelas/shared-config';
import { logger } from '@freelas/shared-logger';
import { KafkaClient } from '@freelas/shared-kafka';
import { KAFKA_TOPICS } from '@freelas/shared-contracts';

let kafkaProducer: KafkaClient;

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Kafka Producer for sending events from Socket to Services (e.g. Location Ping)
  kafkaProducer = new KafkaClient('api-gateway-producer', CONFIG.KAFKA.BROKERS);
  kafkaProducer.connectProducer();

  // Middleware: Auth
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`User connected: ${user.userId} (${user.role})`);

    // Join personal room
    if (user.role === 'CUSTOMER') {
      socket.join(`customer:${user.userId}`);
    } else if (user.role === 'PROVIDER') {
      socket.join(`provider:${user.userId}`);
    }

    // Join Job Room
    socket.on('join_job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      logger.info(`User ${user.userId} joined job:${jobId}`);
    });

    // Provider Location Ping
    socket.on('location_ping', async (data: { jobId: string, lat: number, lng: number }) => {
       if (user.role !== 'PROVIDER') return;

       // Publish to Kafka for Tracking Service
       await kafkaProducer.publish(KAFKA_TOPICS.JOB_LOCATION_PINGED, {
         jobId: data.jobId,
         providerId: user.userId,
         lat: data.lat,
         lng: data.lng
       });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${user.userId}`);
    });
  });

  return io;
}
