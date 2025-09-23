import {RoleUtilisateur, TypeAction} from "../../features/historique/historique.component";

export interface HistoriqueEntry {
    id?: number;
    reclamationId: number;
    reclamationNumero?: string;
    action: TypeAction;
    description: string;
    ancienneValeur?: string;
    nouvelleValeur?: string;
    utilisateur: string;
    roleUtilisateur: RoleUtilisateur;
    dateAction: Date;
    adresseIP?: string;
    details?: { [key: string]: any };
}
