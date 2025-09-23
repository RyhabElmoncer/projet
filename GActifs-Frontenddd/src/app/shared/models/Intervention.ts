 import { Asset } from './asset.model';
import { ServiceDirection } from './service-direction.model';
export interface Intervention {
    id?: number;
    titre: string;
    description: string;
    typeIntervention: TypeIntervention;
    priorite: PrioriteIntervention;
    statut: StatutIntervention;
    dateCreation?: Date;
    dateDebut?: Date;
    dateFin?: Date;
    dateEcheance: Date;
    dureeEstimee?: number; // en heures
    dureeReelle?: number; // en heures
    cout?: number;
    asset?: Asset;
    technicienAssigne?: Technicien;
    serviceDirection?: ServiceDirection;
    creePar?: string;
    commentaires?: CommentaireIntervention[];
    pieceJointes?: PieceJointe[];
    materielsUtilises?: MaterielUtilise[];
    validateur?: string;
    dateValidation?: Date;
}
export interface Technicien {
    id?: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    specialite?: string;
    service?: ServiceDirection;
    actif: boolean;
}
export interface CommentaireIntervention {
    id?: number;
    contenu: string;
    auteur: string;
    dateCreation: Date;
    interventionId: number;
}
export interface PieceJointe {
    id?: number;
    nom: string;
    url: string;
    taille: number;
    type: string;
    dateUpload: Date;
    uploadePar: string;
}
export interface MaterielUtilise {
    id?: number;
    designation: string;
    quantite: number;
    prixUnitaire?: number;
    fournisseur?: string;
    reference?: string;
}
export enum TypeIntervention {
    MAINTENANCE_PREVENTIVE = 'MAINTENANCE_PREVENTIVE',
    MAINTENANCE_CORRECTIVE = 'MAINTENANCE_CORRECTIVE',
    REPARATION = 'REPARATION',
    INSTALLATION = 'INSTALLATION',
    CONFIGURATION = 'CONFIGURATION',
    MISE_A_JOUR = 'MISE_A_JOUR',
    DIAGNOSTIC = 'DIAGNOSTIC',
    AUTRE = 'AUTRE'
}
export enum PrioriteIntervention {
    CRITIQUE = 'CRITIQUE',
    HAUTE = 'HAUTE',
    MOYENNE = 'MOYENNE',
    BASSE = 'BASSE'
}
export enum StatutIntervention {
    PLANIFIEE = 'PLANIFIEE',
    EN_ATTENTE = 'EN_ATTENTE',
    EN_COURS = 'EN_COURS',
    SUSPENDUE = 'SUSPENDUE',
    TERMINEE = 'TERMINEE',
    ANNULEE = 'ANNULEE',
    VALIDEE = 'VALIDEE'
}
export interface InterventionCreateRequest {
    titre: string;
    description: string;
    typeIntervention: TypeIntervention;
    priorite: PrioriteIntervention;
    dateEcheance: Date;
    dureeEstimee?: number;
    cout?: number;
    assetId?: number;
    technicienId?: number;
    serviceId?: number;
}
export interface InterventionUpdateRequest {
    titre?: string;
    description?: string;
    typeIntervention?: TypeIntervention;
    priorite?: PrioriteIntervention;
    statut?: StatutIntervention;
    dateDebut?: Date;
    dateFin?: Date;
    dateEcheance?: Date;
    dureeEstimee?: number;
    dureeReelle?: number;
    cout?: number;
    technicienId?: number;
}
export interface InterventionFilter {
    titre?: string;
    typeIntervention?: TypeIntervention;
    priorite?: PrioriteIntervention;
    statut?: StatutIntervention;
    technicienId?: number;
    serviceId?: number;
    assetId?: number;
    dateDebutMin?: Date;
    dateDebutMax?: Date;
    dateEcheanceMin?: Date;
    dateEcheanceMax?: Date;
}
export interface InterventionStats {
    total: number;
    planifiees: number;
    enCours: number;
    terminees: number;
    enRetard: number;
    critiques: number;
    coutTotal: number;
    dureeMovenne: number;
}