export interface ServiceDirection {
    id?: number;
    serviceName : string;
    description?: string;
    code?: string;
    responsable?: string;
    email?: string;
    telephone?: string;
    actif: boolean;
    dateCreation?: string;
    dateModification?: string;
}

export interface ServiceDirectionCreateDto {
    nom: string;
    description?: string;
    code?: string;
    responsable?: string;
    email?: string;
    telephone?: string;
    actif?: boolean;
}

export interface ServiceDirectionUpdateDto {
    nom?: string;
    description?: string;
    code?: string;
    responsable?: string;
    email?: string;
    telephone?: string;
    actif?: boolean;
}

export interface PageRequest {
    page: number;
    size: number;
    sort?: string;
    direction?: 'asc' | 'desc';
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
    timestamp: string;
}