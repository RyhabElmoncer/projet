import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from "../../../environments/environment";
import {CreateUserRequest, User, UserRole} from "../../shared/models/User";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token?: string;
  accessToken?: string;
  user: User;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly ROLE_KEY = 'role';
  private readonly USER_KEY = 'user';
  private apiUrl = environment.SERVER_API_URL;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private getRoleFromToken(token: string): string | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Payload token :', payload);
      return payload.role ? payload.role.toString() : null;
    } catch (e) {
      console.error('Erreur décodage token', e);
      return null;
    }
  }

  private getUserFromToken(token: string): User | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user || null;
    } catch (e) {
      console.error('Erreur décodage user depuis token', e);
      return null;
    }
  }

  // Authentification
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}authenticate`, { email, password })
        .pipe(
            tap(res => {
              console.log('Réponse backend :', res);

              const token = res.access_token || res.accessToken;

              if (token) {
                console.log('Access token :', token);
                localStorage.setItem(this.TOKEN_KEY, token);

                // Stocker le rôle
                const role = res.role || this.getRoleFromToken(token);
                console.log('Role extrait :', role);

                if (role) {
                  localStorage.setItem(this.ROLE_KEY, role);
                }

                // Stocker les informations utilisateur
                if (res.user) {
                  localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
                  this.currentUserSubject.next(res.user);
                }
              }
            })
        );
  }

  // Inscription (pour les admins qui créent des comptes)
  register(request: CreateUserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}register`, request)
        .pipe(
            tap(res => {
              console.log('Réponse register backend :', res);

              const token = res.access_token || res.accessToken;
              if (token) {
                console.log('Access token après register :', token);
                localStorage.setItem(this.TOKEN_KEY, token);

                const role = res.role || this.getRoleFromToken(token);
                console.log('Role extrait après register :', role);

                if (role) {
                  localStorage.setItem(this.ROLE_KEY, role);
                }

                if (res.user) {
                  localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
                  this.currentUserSubject.next(res.user);
                }
              }
            })
        );
  }

  // Vérifier si connecté
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    // Vérifier si le token n'est pas expiré
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir en millisecondes
      return Date.now() < exp;
    } catch (e) {
      return false;
    }
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Récupérer rôle utilisateur
  getRole(): UserRole | null {
    return localStorage.getItem(this.ROLE_KEY) as UserRole;
  }

  // Récupérer utilisateur actuel
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }

  // Vérifier si l'utilisateur a l'un des rôles spécifiés
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.getRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // Vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  // Vérifier si l'utilisateur est responsable ou admin
  isResponsableOrAdmin(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.RESPONSABLE]);
  }

  // Rafraîchir le token
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}refresh-token`, {})
        .pipe(
            tap(res => {
              const token = res.access_token || res.accessToken;
              if (token) {
                localStorage.setItem(this.TOKEN_KEY, token);

                if (res.user) {
                  localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
                  this.currentUserSubject.next(res.user);
                }
              }
            })
        );
  }

  // Mettre à jour les informations utilisateur dans le localStorage
  updateCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Déconnexion
  logout(): void {
    // Appeler l'API de déconnexion si nécessaire
    this.http.post(`${this.apiUrl}logout`, {}).subscribe({
      next: () => console.log('Déconnexion côté serveur réussie'),
      error: (err) => console.error('Erreur lors de la déconnexion côté serveur', err)
    });

    // Nettoyer le localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USER_KEY);

    // Réinitialiser le subject
    this.currentUserSubject.next(null);

    // Rediriger vers la page de connexion
    this.router.navigate(['/login']);
  }

  // Mot de passe oublié
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}forgot-password`, { email });
  }

  // Réinitialiser le mot de passe avec token
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}reset-password`, {
      token,
      newPassword
    });
  }

  // Changer le mot de passe
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}change-password`, {
      currentPassword,
      newPassword
    });
  }

  // Vérifier la validité du token de réinitialisation
  validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.apiUrl}validate-reset-token`, { token });
  }
}