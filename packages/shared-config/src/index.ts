import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  KAFKA: {
    BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'freelas-service',
  },
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379'),
  },
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  DATABASE_URL: process.env.DATABASE_URL,
};
