import {ServiceDirection} from "./service-direction.model";

export interface Asset {
    id?: number;
    nom: string;
    reference: string;
    description?: string;
    categorie: AssetCategory;
    etat: AssetStatus;
    dateAcquisition?: string;
    valeur?: number;
    numeroSerie?: string;
    localisation?: string;
    service: ServiceDirection;
    serviceId?: number;
    dateCreation?: string;
    dateModification?: string;
    createdBy?: string;
    modifiedBy?: string;
}

export enum AssetCategory {
    TOPOGRAPHIQUE = 'TOPOGRAPHIQUE',
    INFORMATIQUE = 'INFORMATIQUE',
    VEHICULE = 'VEHICULE',
    MOBILIER = 'MOBILIER',
    AUTRE = 'AUTRE'
}

export enum AssetStatus {
    EN_SERVICE = 'EN_SERVICE',
    EN_PANNE = 'EN_PANNE',
    EN_MAINTENANCE = 'EN_MAINTENANCE',
    HORS_USAGE = 'HORS_USAGE'
}

export interface AssetCreateDto {
    nom: string;
    reference: string;
    description?: string;
    categorie: AssetCategory;
    etat: AssetStatus;
    dateAcquisition?: string;
    valeur?: number;
    numeroSerie?: string;
    localisation?: string;
    serviceId: number;
}

export interface AssetUpdateDto {
    nom?: string;
    reference?: string;
    description?: string;
    categorie?: AssetCategory;
    etat?: AssetStatus;
    dateAcquisition?: string;
    valeur?: number;
    numeroSerie?: string;
    localisation?: string;
    serviceId?: number;
}

export interface AssetFilter {
    serviceId?: number;
    status?: AssetStatus;
    category?: AssetCategory;
    searchTerm?: string;
    dateAcquisitionFrom?: string;
    dateAcquisitionTo?: string;
    valeurMin?: number;
    valeurMax?: number;
}

export interface AssetStats {
    totalAssets: number;
    activeAssets: number;
    maintenanceAssets: number;
    brokenAssets: number;
    outOfServiceAssets: number;
    totalValue: number;
    averageAge: number;
}
