import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ChangePasswordRequest,
    CreateUserRequest,
    UpdateUserRequest,
    User,
    UserPermissions,
    UserRole
} from "../../shared/models/User";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.SERVER_API_URL_2}/users`;

    constructor(private http: HttpClient) {}

    private getHttpOptions(): { headers: HttpHeaders } {
        const token = localStorage.getItem('token');
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            })
        };
    }

    // CRUD Operations
    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl, this.getHttpOptions());
    }

    getUserById(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}${id}`, this.getHttpOptions());
    }

    createUser(userData: CreateUserRequest): Observable<User> {
        return this.http.post<User>(this.apiUrl, userData, this.getHttpOptions());
    }

    updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}${id}`, userData, this.getHttpOptions());
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}${id}`, this.getHttpOptions());
    }

    // Activation/Désactivation
    activateUser(id: string): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${id}/activate`, {}, this.getHttpOptions());
    }


    deactivateUser(id: string): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}${id}/deactivate`, {}, this.getHttpOptions());
    }

    // Changement de mot de passe
    changePassword(id: string, passwordData: ChangePasswordRequest): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}${id}/change-password`, passwordData, this.getHttpOptions());
    }

    // Réinitialisation de mot de passe (admin seulement)
    resetPassword(id: string): Observable<{ temporaryPassword: string }> {
        return this.http.patch<{ temporaryPassword: string }>(`${this.apiUrl}${id}/reset-password`, {}, this.getHttpOptions());
    }

    // Gestion des rôles et permissions
    getUserPermissions(role: UserRole): UserPermissions {
        switch (role) {
            case UserRole.ADMIN:
                return {
                    canManageUsers: true,
                    canManageAssets: true,
                    canManageDirections: true,
                    canViewReports: true,
                    canEditSettings: true
                };
            case UserRole.RESPONSABLE:
                return {
                    canManageUsers: false,
                    canManageAssets: true,
                    canManageDirections: true,
                    canViewReports: true,
                    canEditSettings: false
                };
            case UserRole.TECHNICIEN:
                return {
                    canManageUsers: false,
                    canManageAssets: false,
                    canManageDirections: false,
                    canViewReports: false,
                    canEditSettings: false
                };
            default:
                return {
                    canManageUsers: false,
                    canManageAssets: false,
                    canManageDirections: false,
                    canViewReports: false,
                    canEditSettings: false
                };
        }
    }

    // Vérification des permissions
    hasPermission(permission: keyof UserPermissions): boolean {
        const userRole = localStorage.getItem('role') as UserRole;
        if (!userRole) return false;

        const permissions = this.getUserPermissions(userRole);
        return permissions[permission];
    }

    // Filtres et recherche
    searchUsers(searchTerm: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/search?q=${encodeURIComponent(searchTerm)}`, this.getHttpOptions());
    }

    getUsersByRole(role: UserRole): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/by-role/${role}`, this.getHttpOptions());
    }

    getActiveUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/active`, this.getHttpOptions());
    }

    // Statistiques
    getUserStats(): Observable<{
        total: number;
        active: number;
        inactive: number;
        byRole: Record<UserRole, number>;
    }> {
        return this.http.get<any>(`${this.apiUrl}/stats`, this.getHttpOptions());
    }
}