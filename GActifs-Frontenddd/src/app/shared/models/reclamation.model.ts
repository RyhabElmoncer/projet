// shared/models/reclamation.model.ts
import { Asset } from './asset.model';
import { ServiceDirection } from './service-direction.model';

export interface Reclamation {
    id?: number;
    numero?: string;
    objet: string;
    description: string;
    typeReclamation: TypeReclamation;
    priorite: PrioriteReclamation;
    statut: StatutReclamation;
    dateCreation: Date;
    dateEcheance?: Date;
    dateResolution?: Date;
    reclamantNom: string;
    reclamantEmail: string;
    reclamantTelephone?: string;
    serviceDirection?: ServiceDirection;
    asset?: Asset;
    technicienAssigne?: Technicien;
    pieceJointes?: PieceJointe[];
    commentaires?: CommentaireReclamation[];
    resolution?: string;
    satisfactionClient?: number; // 1-5 étoiles
    cout?: number;
    tempsResolution?: number; // en heures
}

export enum TypeReclamation {
    TECHNIQUE = 'TECHNIQUE',
    FONCTIONNEL = 'FONCTIONNEL',
    PERFORMANCE = 'PERFORMANCE',
    SECURITE = 'SECURITE',
    ACCES = 'ACCES',
    FORMATION = 'FORMATION',
    AUTRE = 'AUTRE'
}

export enum PrioriteReclamation {
    CRITIQUE = 'CRITIQUE',
    HAUTE = 'HAUTE',
    MOYENNE = 'MOYENNE',
    BASSE = 'BASSE'
}

export enum StatutReclamation {
    NOUVELLE = 'NOUVELLE',
    EN_ATTENTE = 'EN_ATTENTE',
    EN_COURS = 'EN_COURS',
    EN_ATTENTE_CLIENT = 'EN_ATTENTE_CLIENT',
    RESOLUE = 'RESOLUE',
    FERMEE = 'FERMEE',
    ANNULEE = 'ANNULEE'
}

export interface ReclamationCreateRequest {
    objet: string;
    description: string;
    typeReclamation: TypeReclamation;
    priorite: PrioriteReclamation;
    dateEcheance?: Date;
    reclamantNom: string;
    reclamantEmail: string;
    reclamantTelephone?: string;
    serviceId?: number;
    assetId?: number;
    pieceJointes?: File[];
}

export interface ReclamationUpdateRequest {
    objet?: string;
    description?: string;
    typeReclamation?: TypeReclamation;
    priorite?: PrioriteReclamation;
    statut?: StatutReclamation;
    dateEcheance?: Date;
    technicienId?: number;
    resolution?: string;
    cout?: number;
}

export interface ReclamationFilter {
    objet?: string;
    statut?: StatutReclamation;
    priorite?: PrioriteReclamation;
    typeReclamation?: TypeReclamation;
    reclamantEmail?: string;
    dateCreationDebut?: Date;
    dateCreationFin?: Date;
    technicienId?: number;
    serviceId?: number;
}

export interface ReclamationStats {
    total: number;
    nouvelles: number;
    enCours: number;
    enAttente: number;
    resolues: number;
    fermees: number;
    enRetard: number;
    tempsMoyenResolution: number;
    tauxSatisfaction: number;
}

// shared/models/reclamation.model.ts
export interface Technicien {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    dateCreation: string; // obligatoire ici
}

export interface PieceJointe {
    id: number;
    nomFichier: string;
    typeFichier: string;
    tailleFichier: number;
    cheminFichier: string;
    dateAjout: string;
}


export interface CommentaireReclamation {
    id?: number;
    contenu: string;
    dateCreation: Date;
    auteur: string;
    typeAuteur: 'RECLAMANT' | 'TECHNICIEN' | 'ADMIN';
    pieceJointes?: PieceJointe[];
}


// Interface pour l'export/rapport
export interface ReclamationRapport {
    periode: string;
    totalReclamations: number;
    repartitionParType: { [key: string]: number };
    repartitionParPriorite: { [key: string]: number };
    repartitionParStatut: { [key: string]: number };
    tempsMoyenResolution: number;
    tauxResolutionDansLesDelais: number;
    satisfactionMoyenne: number;
    top10ReclamationsLongues: Reclamation[];
}

export interface SLA {
    typeReclamation: TypeReclamation;
    priorite: PrioriteReclamation;
    delaiResolutionHeures: number;
    description: string;
}