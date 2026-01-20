export interface Service {
    id: string;
    name: string;
    categoryId: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    services?: Service[];
}
