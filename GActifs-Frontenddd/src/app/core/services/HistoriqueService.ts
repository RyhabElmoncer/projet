import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // <-- importer HttpClient
import { HistoriqueFilter } from '../../features/historique/historique.component';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HistoriqueService {
    private readonly apiUrl = '/api/historique';

    // Utiliser HttpClient comme type
    constructor(private http: HttpClient) {}

    getHistorique(filter?: HistoriqueFilter, page = 0, size = 50): any {
         }

    getHistoriqueByReclamation(reclamationId: number): any {
        return this.http.get(`${this.apiUrl}/reclamation/${reclamationId}`);
    }

    getHistoriqueStats(dateDebut?: Date, dateFin?: Date): any {

    }

    exportHistorique(filter?: HistoriqueFilter): any {

    }
}