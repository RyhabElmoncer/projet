import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {Category, CategoryCreateRequest, CategoryFilter, CategoryUpdateRequest} from "../../shared/models/Category";

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private readonly API_URL = `${environment.SERVER_API_URL_2}/categories`;

    constructor(private http: HttpClient) {}

    /**
     * Récupère toutes les catégories
     */
    getAllCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.API_URL)
            .pipe(
                map(categories => categories.map(this.mapCategory)),
                catchError(this.handleError)
            );
    }

    /**
     * Récupère les catégories actives uniquement
     */
    getActiveCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.API_URL}/active`)
            .pipe(
                map(categories => categories.map(this.mapCategory)),
                catchError(this.handleError)
            );
    }

    /**
     * Récupère une catégorie par son ID
     */
    getCategoryById(id: number): Observable<Category> {
        return this.http.get<Category>(`${this.API_URL}/${id}`)
            .pipe(
                map(this.mapCategory),
                catchError(this.handleError)
            );
    }

    /**
     * Crée une nouvelle catégorie
     */
    createCategory(categoryData: CategoryCreateRequest): Observable<Category> {
        return this.http.post<Category>(this.API_URL, categoryData)
            .pipe(
                map(this.mapCategory),
                catchError(this.handleError)
            );
    }

    /**
     * Met à jour une catégorie existante
     */
    updateCategory(id: number, categoryData: CategoryUpdateRequest): Observable<Category> {
        return this.http.put<Category>(`${this.API_URL}/${id}`, categoryData)
            .pipe(
                map(this.mapCategory),
                catchError(this.handleError)
            );
    }

    /**
     * Supprime une catégorie
     */
    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Archive/Désarchive une catégorie (change le statut actif)
     */
    toggleCategoryStatus(id: number): Observable<Category> {
        return this.http.patch<Category>(`${this.API_URL}/${id}/toggle-status`, {})
            .pipe(
                map(this.mapCategory),
                catchError(this.handleError)
            );
    }

    /**
     * Recherche les catégories avec filtres
     */
    searchCategories(filters: CategoryFilter): Observable<Category[]> {
        const params: any = {};

        if (filters.nom) params.nom = filters.nom;
        if (filters.actif !== undefined) params.actif = filters.actif;
        if (filters.dateCreationDebut) params.dateCreationDebut = filters.dateCreationDebut.toISOString();
        if (filters.dateCreationFin) params.dateCreationFin = filters.dateCreationFin.toISOString();

        return this.http.get<Category[]>(`${this.API_URL}/search`, { params })
            .pipe(
                map(categories => categories.map(this.mapCategory)),
                catchError(this.handleError)
            );
    }

    /**
     * Vérifie si un code de catégorie existe déjà
     */
    checkCodeExists(code: string, excludeId?: number): Observable<boolean> {
        const params: any = { code };
        if (excludeId) params.excludeId = excludeId;

        return this.http.get<{ exists: boolean }>(`${this.API_URL}/check-code`, { params })
            .pipe(
                map(response => response.exists),
                catchError(this.handleError)
            );
    }

    /**
     * Exporte les catégories vers Excel
     */
    exportCategories(categories: Category[]): Observable<Blob> {
        const categoryIds = categories.map(c => c.id).filter(id => id !== undefined);

        return this.http.post(`${this.API_URL}/export`,
            { categoryIds },
            { responseType: 'blob' }
        ).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Importe les catégories depuis un fichier Excel
     */
    importCategories(file: File): Observable<{ success: number; errors: string[] }> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<{ success: number; errors: string[] }>(`${this.API_URL}/import`, formData)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Récupère les statistiques des catégories
     */
    getCategoryStatistics(): Observable<{
        total: number;
        active: number;
        inactive: number;
        withAssets: number;
        withoutAssets: number;
    }> {
        return this.http.get<any>(`${this.API_URL}/statistics`)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Mappe les données de catégorie du serveur vers le modèle client
     */
    private mapCategory = (category: any): Category => {
        return {
            ...category,
            dateCreation: category.dateCreation ? new Date(category.dateCreation) : undefined,
            dateModification: category.dateModification ? new Date(category.dateModification) : undefined
        };
    };

    /**
     * Gestion des erreurs HTTP
     */
    private handleError = (error: HttpErrorResponse): Observable<never> => {
        let errorMessage = 'Une erreur est survenue';

        if (error.error instanceof ErrorEvent) {
            // Erreur côté client
            errorMessage = `Erreur: ${error.error.message}`;
        } else {
            // Erreur côté serveur
            switch (error.status) {
                case 400:
                    errorMessage = error.error?.message || 'Données invalides';
                    break;
                case 404:
                    errorMessage = 'Catégorie non trouvée';
                    break;
                case 409:
                    errorMessage = 'Cette catégorie existe déjà';
                    break;
                case 422:
                    errorMessage = 'Des actifs sont encore associés à cette catégorie';
                    break;
                case 500:
                    errorMessage = 'Erreur interne du serveur';
                    break;
                default:
                    errorMessage = `Erreur ${error.status}: ${error.error?.message || 'Erreur inconnue'}`;
            }
        }

        console.error('CategoryService Error:', error);
        return throwError(() => new Error(errorMessage));
    };
}