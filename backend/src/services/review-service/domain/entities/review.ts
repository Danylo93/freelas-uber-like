export interface Review {
    id: string;
    jobId: string;
    rating: number;
    comment?: string;
    tags: string[];
    createdAt?: Date;
}
