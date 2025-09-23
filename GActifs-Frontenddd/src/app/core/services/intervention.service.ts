import {PageRequest, PageResponse} from "../../shared/models/service-direction.model";

@Injectable({
    providedIn: 'root'
})
export class InterventionService {
    private readonly apiUrl = `${environment.SERVER_API_URL_2}/interventions`;

    constructor(private http: HttpClient) {}

    // CRUD Operations
    getInterventionsPaginated(pageRequest: PageRequest): Observable<PageResponse<Intervention>> {
        let params = new HttpParams()
            .set('page', pageRequest.page.toString())
            .set('size', pageRequest.size.toString())
            .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
            .set('direction', pageRequest.direction ?? 'asc');

        return this.http.get<PageResponse<Intervention>>(this.apiUrl, { params });
    }

    getInterventionById(id: number): Observable<Intervention> {
        return this.http.get<Intervention>(`${this.apiUrl}/${id}`);
    }

    createIntervention(intervention: InterventionCreateRequest): Observable<Intervention> {
        return this.http.post<Intervention>(this.apiUrl, intervention);
    }

    updateIntervention(id: number, intervention: InterventionUpdateRequest): Observable<Intervention> {
        return this.http.put<Intervention>(`${this.apiUrl}/${id}`, intervention);
    }

    deleteIntervention(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Search and Filter
    searchInterventions(
        filter: InterventionFilter,
        pageRequest?: PageRequest
    ): Observable<PageResponse<Intervention>> {
        let params = new HttpParams();

        // Add pagination parameters
        if (pageRequest) {
            params = params
                .set('page', pageRequest.page.toString())
                .set('size', pageRequest.size.toString())
                .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
                .set('direction', pageRequest.direction ?? 'asc');
        }

        // Add filter parameters
        Object.keys(filter).forEach(key => {
            const value = filter[key as keyof InterventionFilter];
            if (value !== undefined && value !== null && value !== '') {
                if (value instanceof Date) {
                    params = params.set(key, value.toISOString());
                } else {
                    params = params.set(key, value.toString());
                }
            }
        });

        return this.http.get<PageResponse<Intervention>>(`${this.apiUrl}/search`, { params });
    }

    // Statistics
    getInterventionStats(): Observable<InterventionStats> {
        return this.http.get<InterventionStats>(`${this.apiUrl}/stats`);
    }

    getInterventionStatsByPeriod(startDate: Date, endDate: Date): Observable<InterventionStats> {
        const params = new HttpParams()
            .set('startDate', startDate.toISOString())
            .set('endDate', endDate.toISOString());

        return this.http.get<InterventionStats>(`${this.apiUrl}/stats/period`, { params });
    }

    // Status Management
    changeInterventionStatus(id: number, newStatus: string): Observable<Intervention> {
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/status`, { statut: newStatus });
    }

    startIntervention(id: number): Observable<Intervention> {
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/start`, {});
    }

    completeIntervention(id: number, dureeReelle?: number): Observable<Intervention> {
        const body = dureeReelle ? { dureeReelle } : {};
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/complete`, body);
    }

    validateIntervention(id: number): Observable<Intervention> {
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/validate`, {});
    }

    suspendIntervention(id: number, reason?: string): Observable<Intervention> {
        const body = reason ? { reason } : {};
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/suspend`, body);
    }

    cancelIntervention(id: number, reason?: string): Observable<Intervention> {
        const body = reason ? { reason } : {};
        return this.http.patch<Intervention>(`${this.apiUrl}/${id}/cancel`, body);
    }

    // Assignment
    assignTechnician(interventionId: number, technicienId: number): Observable<Intervention> {
        return this.http.patch<Intervention>(
            `${this.apiUrl}/${interventionId}/assign`,
            { technicienId }
        );
    }

    unassignTechnician(interventionId: number): Observable<Intervention> {
        return this.http.patch<Intervention>(`${this.apiUrl}/${interventionId}/unassign`, {});
    }

    // Comments
    getInterventionComments(interventionId: number): Observable<CommentaireIntervention[]> {
        return this.http.get<CommentaireIntervention[]>(`${this.apiUrl}/${interventionId}/comments`);
    }

    addComment(interventionId: number, contenu: string): Observable<CommentaireIntervention> {
        return this.http.post<CommentaireIntervention>(
            `${this.apiUrl}/${interventionId}/comments`,
            { contenu }
        );
    }

    updateComment(
        interventionId: number,
        commentId: number,
        contenu: string
    ): Observable<CommentaireIntervention> {
        return this.http.put<CommentaireIntervention>(
            `${this.apiUrl}/${interventionId}/comments/${commentId}`,
            { contenu }
        );
    }

    deleteComment(interventionId: number, commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${interventionId}/comments/${commentId}`);
    }

    // Attachments
    getInterventionAttachments(interventionId: number): Observable<PieceJointe[]> {
        return this.http.get<PieceJointe[]>(`${this.apiUrl}/${interventionId}/attachments`);
    }

    uploadAttachment(interventionId: number, file: File): Observable<PieceJointe> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<PieceJointe>(
            `${this.apiUrl}/${interventionId}/attachments`,
            formData
        );
    }

    deleteAttachment(interventionId: number, attachmentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${interventionId}/attachments/${attachmentId}`);
    }

    downloadAttachment(interventionId: number, attachmentId: number): Observable<Blob> {
        return this.http.get(
            `${this.apiUrl}/${interventionId}/attachments/${attachmentId}/download`,
            { responseType: 'blob' }
        );
    }

    // Materials
    getInterventionMaterials(interventionId: number): Observable<MaterielUtilise[]> {
        return this.http.get<MaterielUtilise[]>(`${this.apiUrl}/${interventionId}/materials`);
    }

    addMaterial(interventionId: number, material: Omit<MaterielUtilise, 'id'>): Observable<MaterielUtilise> {
        return this.http.post<MaterielUtilise>(
            `${this.apiUrl}/${interventionId}/materials`,
            material
        );
    }

    updateMaterial(
        interventionId: number,
        materialId: number,
        material: Partial<MaterielUtilise>
    ): Observable<MaterielUtilise> {
        return this.http.put<MaterielUtilise>(
            `${this.apiUrl}/${interventionId}/materials/${materialId}`,
            material
        );
    }

    deleteMaterial(interventionId: number, materialId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${interventionId}/materials/${materialId}`);
    }

    // Reporting
    getInterventionsByTechnician(
        technicienId: number,
        pageRequest?: PageRequest
    ): Observable<PageResponse<Intervention>> {
        let params = new HttpParams();

        if (pageRequest) {
            params = params
                .set('page', pageRequest.page.toString())
                .set('size', pageRequest.size.toString())
                .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
                .set('direction', pageRequest.direction ?? 'asc');

        }

        return this.http.get<PageResponse<Intervention>>(
            `${this.apiUrl}/technician/${technicienId}`,
            { params }
        );
    }

    getInterventionsByAsset(
        assetId: number,
        pageRequest?: PageRequest
    ): Observable<PageResponse<Intervention>> {
        let params = new HttpParams();

        if (pageRequest) {
            params = params
                .set('page', pageRequest.page.toString())
                .set('size', pageRequest.size.toString())
                .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
                .set('direction', pageRequest.direction ?? 'asc');
        }

        return this.http.get<PageResponse<Intervention>>(
            `${this.apiUrl}/asset/${assetId}`,
            { params }
        );
    }

    getInterventionsByService(
        serviceId: number,
        pageRequest?: PageRequest
    ): Observable<PageResponse<Intervention>> {
        let params = new HttpParams();

        if (pageRequest) {
            params = params
                .set('page', pageRequest.page.toString())
                .set('size', pageRequest.size.toString())
                .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
                .set('direction', pageRequest.direction ?? 'asc');
        }

        return this.http.get<PageResponse<Intervention>>(
            `${this.apiUrl}/service/${serviceId}`,
            { params }
        );
    }

    getOverdueInterventions(): Observable<Intervention[]> {
        return this.http.get<Intervention[]>(`${this.apiUrl}/overdue`);
    }

    getCriticalInterventions(): Observable<Intervention[]> {
        return this.http.get<Intervention[]>(`${this.apiUrl}/critical`);
    }

    getUpcomingInterventions(days: number = 7): Observable<Intervention[]> {
        const params = new HttpParams().set('days', days.toString());
        return this.http.get<Intervention[]>(`${this.apiUrl}/upcoming`, { params });
    }

    // Export
    exportInterventionsToExcel(filter?: InterventionFilter): Observable<Blob> {
        let params = new HttpParams();

        if (filter) {
            Object.keys(filter).forEach(key => {
                const value = filter[key as keyof InterventionFilter];
                if (value !== undefined && value !== null && value !== '') {
                    if (value instanceof Date) {
                        params = params.set(key, value.toISOString());
                    } else {
                        params = params.set(key, value.toString());
                    }
                }
            });
        }

        return this.http.get(`${this.apiUrl}/export/excel`, {
            params,
            responseType: 'blob'
        });
    }

    exportInterventionsToPdf(filter?: InterventionFilter): Observable<Blob> {
        let params = new HttpParams();

        if (filter) {
            Object.keys(filter).forEach(key => {
                const value = filter[key as keyof InterventionFilter];
                if (value !== undefined && value !== null && value !== '') {
                    if (value instanceof Date) {
                        params = params.set(key, value.toISOString());
                    } else {
                        params = params.set(key, value.toString());
                    }
                }
            });
        }

        return this.http.get(`${this.apiUrl}/export/pdf`, {
            params,
            responseType: 'blob'
        });
    }

    // Planning and Scheduling
    getInterventionCalendar(startDate: Date, endDate: Date): Observable<Intervention[]> {
        const params = new HttpParams()
            .set('startDate', startDate.toISOString())
            .set('endDate', endDate.toISOString());

        return this.http.get<Intervention[]>(`${this.apiUrl}/calendar`, { params });
    }

    scheduleIntervention(
        interventionId: number,
        dateDebut: Date,
        dateFin?: Date
    ): Observable<Intervention> {
        const body: any = { dateDebut: dateDebut.toISOString() };
        if (dateFin) {
            body.dateFin = dateFin.toISOString();
        }

        return this.http.patch<Intervention>(`${this.apiUrl}/${interventionId}/schedule`, body);
    }

    rescheduleIntervention(
        interventionId: number,
        newDateDebut: Date,
        newDateFin?: Date
    ): Observable<Intervention> {
        const body: any = { dateDebut: newDateDebut.toISOString() };
        if (newDateFin) {
            body.dateFin = newDateFin.toISOString();
        }

        return this.http.patch<Intervention>(`${this.apiUrl}/${interventionId}/reschedule`, body);
    }

    // Duplication
    duplicateIntervention(interventionId: number): Observable<Intervention> {
        return this.http.post<Intervention>(`${this.apiUrl}/${interventionId}/duplicate`, {});
    }

    // Bulk Operations
    bulkUpdateStatus(interventionIds: number[], newStatus: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/bulk/status`, {
            interventionIds,
            statut: newStatus
        });
    }

    bulkAssignTechnician(interventionIds: number[], technicienId: number): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/bulk/assign`, {
            interventionIds,
            technicienId
        });
    }

    bulkDelete(interventionIds: number[]): Observable<void> {
        return this.http.request<void>('DELETE', `${this.apiUrl}/bulk`, {
            body: { interventionIds }
        });
    }
}

// technicien.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
    CommentaireIntervention,
    Intervention,
    InterventionCreateRequest,
    InterventionFilter, InterventionStats,
    InterventionUpdateRequest, MaterielUtilise, PieceJointe, Technicien
} from '../../shared/models/Intervention';

@Injectable({
    providedIn: 'root'
})
export class TechnicienService {
    private readonly apiUrl = `${environment.SERVER_API_URL}/techniciens`;

    constructor(private http: HttpClient) {}

    getAllTechniciens(): Observable<Technicien[]> {
        return this.http.get<Technicien[]>(this.apiUrl);
    }

    getTechniciensPaginated(pageRequest: PageRequest): Observable<PageResponse<Technicien>> {
        let params = new HttpParams()
            .set('page', pageRequest.page.toString())
            .set('size', pageRequest.size.toString())
            .set('sort', pageRequest.sort ?? '')        // valeur par défaut si undefined
            .set('direction', pageRequest.direction ?? 'asc');

        return this.http.get<PageResponse<Technicien>>(this.apiUrl, { params });
    }

    getTechnicienById(id: number): Observable<Technicien> {
        return this.http.get<Technicien>(`${this.apiUrl}/${id}`);
    }

    createTechnicien(technicien: Omit<Technicien, 'id'>): Observable<Technicien> {
        return this.http.post<Technicien>(this.apiUrl, technicien);
    }

    updateTechnicien(id: number, technicien: Partial<Technicien>): Observable<Technicien> {
        return this.http.put<Technicien>(`${this.apiUrl}/${id}`, technicien);
    }

    deleteTechnicien(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    searchTechniciens(query: string): Observable<Technicien[]> {
        const params = new HttpParams().set('query', query);
        return this.http.get<Technicien[]>(`${this.apiUrl}/search`, { params });
    }

    getAvailableTechniciens(): Observable<Technicien[]> {
        return this.http.get<Technicien[]>(`${this.apiUrl}/available`);
    }

    getTechniciensBySpecialite(specialite: string): Observable<Technicien[]> {
        const params = new HttpParams().set('specialite', specialite);
        return this.http.get<Technicien[]>(`${this.apiUrl}/specialite`, { params });
    }
}