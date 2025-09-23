export interface Category {
    id?: number;
    nom: string;
    description?: string;
    code: string;
    couleur?: string;
    icone?: string;
    actif: boolean;
    dateCreation?: Date;
    dateModification?: Date;
    nombreActifs?: number; // Nombre d'actifs dans cette catégorie
}

export enum CategoryStatus {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF'
}

export interface CategoryCreateRequest {
    nom: string;
    description?: string;
    code: string;
    couleur?: string;
    icone?: string;
    actif: boolean;
}

export interface CategoryUpdateRequest {
    nom?: string;
    description?: string;
    code?: string;
    couleur?: string;
    icone?: string;
    actif?: boolean;
}

export interface CategoryFilter {
    nom?: string;
    actif?: boolean;
    dateCreationDebut?: Date;
    dateCreationFin?: Date;
}