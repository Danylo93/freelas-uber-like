import { z } from 'zod';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED'
}

export enum JobStatus {
  ACCEPTED = 'ACCEPTED',
  ON_THE_WAY = 'ON_THE_WAY',
  ARRIVED = 'ARRIVED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  category: z.string().optional(), // Category for providers
});

export const CreateRequestSchema = z.object({
  categoryId: z.string(),
  description: z.string(),
  price: z.number().optional(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  address: z.string().optional(),
});

export const LocationUpdateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const ReviewSchema = z.object({
  jobId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const KAFKA_TOPICS = {
  REQUEST_CREATED: 'request.created',
  REQUEST_CANCELED: 'request.canceled',
  PROVIDER_ONLINE_CHANGED: 'provider.online.changed',
  PROVIDER_LOCATION_UPDATED: 'provider.location.updated',
  MATCHING_OFFER_SENT: 'matching.offer.sent',
  OFFER_CREATED: 'offer.created',
  JOB_ACCEPTED: 'job.accepted',
  JOB_STATUS_CHANGED: 'job.status.changed',
  JOB_LOCATION_PINGED: 'job.location.pinged',
  JOB_COMPLETED: 'job.completed',
  REVIEW_CREATED: 'review.created',
};

// Event Payloads
export interface RequestCreatedEvent {
  requestId: string;
  customerId: string;
  categoryId: string;
  lat: number;
  lng: number;
  description: string;
  price?: number;
}

export interface OfferSentEvent {
  requestId: string;
  providerId: string;
  timeout: number;
}

export interface JobAcceptedEvent {
  requestId: string;
  jobId: string;
  providerId: string;
  customerId: string;
}

export interface LocationPingEvent {
  jobId: string;
  providerId: string;
  lat: number;
  lng: number;
}
