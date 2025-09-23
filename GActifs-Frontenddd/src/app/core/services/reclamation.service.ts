import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PageRequest, PageResponse } from '../../shared/models/service-direction.model';
import {
    CommentaireReclamation,
    Reclamation, ReclamationCreateRequest,
    ReclamationFilter,
    ReclamationRapport, ReclamationStats, ReclamationUpdateRequest, SLA
} from '../../shared/models/reclamation.model';
import {PieceJointe, Technicien} from "../../shared/models/Intervention";

@Injectable({
    providedIn: 'root'
})
export class ReclamationService {
    private readonly apiUrl = '/api/reclamations';

    constructor(private http: HttpClient) {}

    // CRUD Operations
    getReclamationsPaginated(pageRequest: PageRequest): Observable<PageResponse<Reclamation>> {
        let params = new HttpParams()
            .set('page', pageRequest.page.toString())
            .set('size', pageRequest.size.toString())
            .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
            .set('direction', pageRequest.direction ?? 'asc');

        return this.http.get<PageResponse<Reclamation>>(`${this.apiUrl}/paginated`, { params });
    }

    searchReclamations(filter: ReclamationFilter, pageRequest: PageRequest): Observable<PageResponse<Reclamation>> {
        let params = new HttpParams()
            .set('page', pageRequest.page.toString())
            .set('size', pageRequest.size.toString())
            .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
            .set('direction', pageRequest.direction ?? 'asc');

        // Ajouter les filtres
        if (filter.objet) params = params.set('objet', filter.objet);
        if (filter.statut) params = params.set('statut', filter.statut);
        if (filter.priorite) params = params.set('priorite', filter.priorite);
        if (filter.typeReclamation) params = params.set('typeReclamation', filter.typeReclamation);
        if (filter.reclamantEmail) params = params.set('reclamantEmail', filter.reclamantEmail);
        if (filter.technicienId) params = params.set('technicienId', filter.technicienId.toString());
        if (filter.serviceId) params = params.set('serviceId', filter.serviceId.toString());
        if (filter.dateCreationDebut) params = params.set('dateCreationDebut', filter.dateCreationDebut.toISOString());
        if (filter.dateCreationFin) params = params.set('dateCreationFin', filter.dateCreationFin.toISOString());

        return this.http.get<PageResponse<Reclamation>>(`${this.apiUrl}/search`, { params });
    }

    getReclamationById(id: number): Observable<Reclamation> {
        return this.http.get<Reclamation>(`${this.apiUrl}/${id}`);
    }

    createReclamation(createRequest: ReclamationCreateRequest): Observable<Reclamation> {
        const formData = new FormData();
        formData.append('objet', createRequest.objet);
        formData.append('description', createRequest.description);
        formData.append('typeReclamation', createRequest.typeReclamation);
        formData.append('priorite', createRequest.priorite);
        formData.append('reclamantNom', createRequest.reclamantNom);
        formData.append('reclamantEmail', createRequest.reclamantEmail);

        if (createRequest.reclamantTelephone) {
            formData.append('reclamantTelephone', createRequest.reclamantTelephone);
        }
        if (createRequest.dateEcheance) {
            formData.append('dateEcheance', createRequest.dateEcheance.toISOString());
        }
        if (createRequest.serviceId) {
            formData.append('serviceId', createRequest.serviceId.toString());
        }
        if (createRequest.assetId) {
            formData.append('assetId', createRequest.assetId.toString());
        }

        // Ajouter les fichiers
        if (createRequest.pieceJointes) {
            createRequest.pieceJointes.forEach((file, index) => {
                formData.append(`pieceJointes[${index}]`, file);
            });
        }

        return this.http.post<Reclamation>(this.apiUrl, formData);
    }

    updateReclamation(id: number, updateRequest: ReclamationUpdateRequest): Observable<Reclamation> {
        return this.http.put<Reclamation>(`${this.apiUrl}/${id}`, updateRequest);
    }

    deleteReclamation(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Gestion des statuts
    changerStatut(id: number, nouveauStatut: string): Observable<Reclamation> {
        return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/statut`, { statut: nouveauStatut });
    }

    assignerTechnicien(id: number, technicienId: number): Observable<Reclamation> {
        return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/assignation`, { technicienId });
    }

    resoudreReclamation(id: number, resolution: string, cout?: number): Observable<Reclamation> {
        const data: any = { resolution };
        if (cout !== undefined) data.cout = cout;
        return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/resolution`, data);
    }

    fermerReclamation(id: number, satisfactionClient: number): Observable<Reclamation> {
        return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/fermeture`, { satisfactionClient });
    }

    // Commentaires
    getCommentaires(reclamationId: number): Observable<CommentaireReclamation[]> {
        return this.http.get<CommentaireReclamation[]>(`${this.apiUrl}/${reclamationId}/commentaires`);
    }

    ajouterCommentaire(reclamationId: number, commentaire: string, pieceJointes?: File[]): Observable<CommentaireReclamation> {
        const formData = new FormData();
        formData.append('contenu', commentaire);

        if (pieceJointes) {
            pieceJointes.forEach((file, index) => {
                formData.append(`pieceJointes[${index}]`, file);
            });
        }

        return this.http.post<CommentaireReclamation>(`${this.apiUrl}/${reclamationId}/commentaires`, formData);
    }

    // Pièces jointes
    getPieceJointes(reclamationId: number): Observable<PieceJointe[]> {
        return this.http.get<PieceJointe[]>(`${this.apiUrl}/${reclamationId}/pieces-jointes`);
    }

    ajouterPieceJointe(reclamationId: number, file: File): Observable<PieceJointe> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<PieceJointe>(`${this.apiUrl}/${reclamationId}/pieces-jointes`, formData);
    }

    supprimerPieceJointe(reclamationId: number, pieceJointeId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${reclamationId}/pieces-jointes/${pieceJointeId}`);
    }

    telechargerPieceJointe(pieceJointeId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/pieces-jointes/${pieceJointeId}/download`, {
            responseType: 'blob'
        });
    }

    // Statistiques et rapports
    getReclamationStats(): Observable<ReclamationStats> {
        return this.http.get<ReclamationStats>(`${this.apiUrl}/stats`);
    }

    getReclamationsEnRetard(): Observable<Reclamation[]> {
        return this.http.get<Reclamation[]>(`${this.apiUrl}/en-retard`);
    }

    getReclamationRapport(dateDebut: Date, dateFin: Date): Observable<ReclamationRapport> {
        const params = new HttpParams()
            .set('dateDebut', dateDebut.toISOString())
            .set('dateFin', dateFin.toISOString());

        return this.http.get<ReclamationRapport>(`${this.apiUrl}/rapport`, { params });
    }

    exporterReclamations(format: 'excel' | 'pdf', filter?: ReclamationFilter): Observable<Blob> {
        let params = new HttpParams().set('format', format);

        if (filter) {
            if (filter.objet) params = params.set('objet', filter.objet);
            if (filter.statut) params = params.set('statut', filter.statut);
            if (filter.priorite) params = params.set('priorite', filter.priorite);
            if (filter.typeReclamation) params = params.set('typeReclamation', filter.typeReclamation);
            if (filter.dateCreationDebut) params = params.set('dateCreationDebut', filter.dateCreationDebut.toISOString());
            if (filter.dateCreationFin) params = params.set('dateCreationFin', filter.dateCreationFin.toISOString());
        }

        return this.http.get(`${this.apiUrl}/export`, {
            params,
            responseType: 'blob'
        });
    }

    // Gestion des SLA
    getSLAs(): Observable<SLA[]> {
        return this.http.get<SLA[]>(`${this.apiUrl}/sla`);
    }

    verifierSLA(reclamationId: number): Observable<{ respecte: boolean; tempsRestant: number; depassement: number }> {
        return this.http.get<any>(`${this.apiUrl}/${reclamationId}/sla-check`);
    }

    // Notifications
    getNotificationsReclamations(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/notifications`);
    }

    marquerNotificationLue(notificationId: number): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/notifications/${notificationId}/lue`, {});
    }

    // Dashboard
    getDashboardData(): Observable<{
        statsGenerales: ReclamationStats;
        reclamationsRecentes: Reclamation[];
        reclamationsEnRetard: Reclamation[];
        repartitionParType: { [key: string]: number };
        tendanceMensuelle: { mois: string; total: number; resolues: number }[];
    }> {
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    // Méthodes utilitaires
    calculerTempsResolution(dateCreation: Date, dateResolution: Date): number {
        const diffMs = dateResolution.getTime() - dateCreation.getTime();
        return Math.round(diffMs / (1000 * 60 * 60)); // en heures
    }

    isEnRetard(reclamation: Reclamation): boolean {
        if (!reclamation.dateEcheance || reclamation.statut === 'RESOLUE' || reclamation.statut === 'FERMEE') {
            return false;
        }
        return new Date() > new Date(reclamation.dateEcheance);
    }

    getPrioriteColor(priorite: string): string {
        const colors: { [key: string]: string } = {
            'CRITIQUE': '#dc3545',
            'HAUTE': '#fd7e14',
            'MOYENNE': '#ffc107',
            'BASSE': '#28a745'
        };
        return colors[priorite] || '#6c757d';
    }

    getStatutColor(statut: string): string {
        const colors: { [key: string]: string } = {
            'NOUVELLE': '#007bff',
            'EN_ATTENTE': '#ffc107',
            'EN_COURS': '#17a2b8',
            'EN_ATTENTE_CLIENT': '#fd7e14',
            'RESOLUE': '#28a745',
            'FERMEE': '#6c757d',
            'ANNULEE': '#dc3545'
        };
        return colors[statut] || '#6c757d';
    }
}

// Service pour les techniciens
@Injectable({
    providedIn: 'root'
})
export class TechnicienReclamationService {
    private readonly apiUrl = '/api/techniciens';

    constructor(private http: HttpClient) {}

    getAllTechniciens(): Observable<Technicien[]> {
        return this.http.get<Technicien[]>(this.apiUrl);
    }

    getTechnicienById(id: number): Observable<Technicien> {
        return this.http.get<Technicien>(`${this.apiUrl}/${id}`);
    }

    getTechniciensActifs(): Observable<Technicien[]> {
        return this.http.get<Technicien[]>(`${this.apiUrl}/actifs`);
    }

    getTechniciensBySpecialite(specialite: string): Observable<Technicien[]> {
        return this.http.get<Technicien[]>(`${this.apiUrl}/specialite/${specialite}`);
    }

    getChargeTraivilTechnicien(technicienId: number): Observable<{
        reclamationsActives: number;
        reclamationsResoluesCeMois: number;
        tempsMoyenResolution: number;
        satisfactionMoyenne: number;
    }> {
        return this.http.get<any>(`${this.apiUrl}/${technicienId}/charge-travail`);
    }
}