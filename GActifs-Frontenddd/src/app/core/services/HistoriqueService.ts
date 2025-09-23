import {Injectable} from "@angular/core";
import {HistoriqueFilter} from "../../shared/models/historique";

@Injectable({
    providedIn: 'root'
})
export class HistoriqueService {
    private readonly apiUrl = '/api/historique';

    constructor(private http: any) {}

    getHistorique(filter?: HistoriqueFilter, page = 0, size = 50): any {
        // Implementation would call backend
        return this.http.get(`${this.apiUrl}`, { params: { ...filter, page, size } });
    }

    getHistoriqueByReclamation(reclamationId: number): any {
        return this.http.get(`${this.apiUrl}/reclamation/${reclamationId}`);
    }

    getHistoriqueStats(dateDebut?: Date, dateFin?: Date): any {
        return this.http.get(`${this.apiUrl}/stats`, {
            params: { dateDebut: dateDebut?.toISOString(), dateFin: dateFin?.toISOString() }
        });
    }

    exportHistorique(filter?: HistoriqueFilter): any {
        return this.http.get(`${this.apiUrl}/export`, {
            params: filter,
            responseType: 'blob'
        });
    }
}