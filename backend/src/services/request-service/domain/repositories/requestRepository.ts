import { Request } from '../entities/request';

export interface RequestRepository {
    create(data: Partial<Request>): Promise<Request>;
    findById(id: string): Promise<Request | null>;
    update(id: string, data: Partial<Request>): Promise<Request>;
}
