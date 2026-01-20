import { RequestRepository } from '../../domain/repositories/requestRepository';
import { Request } from '../../domain/entities/request';
import { prisma, RequestStatus } from '../../../../shared/database/src/index';

export class PrismaRequestRepository implements RequestRepository {
    async create(data: Partial<Request>): Promise<Request> {
        const res = await prisma.serviceRequest.create({
            data: {
                customerId: (data as any).customerId!,
                categoryId: (data as any).categoryId!,
                description: (data as any).description || '',
                price: (data as any).price,
                pickupLat: (data as any).pickupLat!,
                pickupLng: (data as any).pickupLng!,
                address: (data as any).address,
                status: RequestStatus.PENDING
            }
        });
        return {
            id: res.id,
            userId: res.customerId,
            serviceId: res.categoryId,
            description: res.description,
            location: { lat: res.pickupLat, lng: res.pickupLng },
            scheduledTo: res.createdAt,
            status: res.status,
            providerId: undefined,
            createdAt: res.createdAt
        } as Request;
    }

    async findById(id: string): Promise<Request | null> {
        const res = await prisma.serviceRequest.findUnique({ 
            where: { id },
            include: { job: true }
        });
        if (!res) return null;
        
        return {
            id: res.id,
            userId: res.customerId,
            serviceId: res.categoryId,
            description: res.description,
            location: { lat: res.pickupLat, lng: res.pickupLng },
            scheduledTo: res.createdAt,
            status: res.status,
            providerId: res.job?.providerId,
            createdAt: res.createdAt
        } as Request;
    }

    async update(id: string, data: Partial<Request>): Promise<Request> {
        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if ((data as any).providerId) updateData.providerId = (data as any).providerId;
        
        const res = await prisma.serviceRequest.update({
            where: { id },
            data: updateData
        });
        
        return {
            id: res.id,
            userId: res.customerId,
            serviceId: res.categoryId,
            description: res.description,
            location: { lat: res.pickupLat, lng: res.pickupLng },
            scheduledTo: res.createdAt,
            status: res.status,
            createdAt: res.createdAt
        } as Request;
    }
}
