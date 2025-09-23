import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import { NotificationFilter, StatutNotification } from '../../features/notifications/notifications.component';



@Injectable({
  providedIn: 'root' // le service est injectable globalement
})
export class NotificationService {
  private readonly apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(filter?: NotificationFilter, page = 0, size = 50): Observable<Notification[]> {
    const params: Record<string, string | number | boolean> = { page, size };
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key as keyof NotificationFilter];

      });
    }
    return this.http.get<Notification[]>(`${this.apiUrl}`, { params });
  }

  getNotificationsByUser(utilisateurId: number, statut?: StatutNotification): Observable<Notification[]> {
    const params: Record<string, string | number | boolean> = {};
    if (statut !== undefined) params['statut'] = statut;
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${utilisateurId}`, { params });
  }

  marquerCommeLue(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/lue`, {});
  }

  marquerToutesCommeLues(utilisateurId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/user/${utilisateurId}/toutes-lues`, {});
  }

  archiverNotification(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/archiver`, {});
  }

  supprimerNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`);
  }

  getStats(utilisateurId?: number): Observable<any> {
    const params: Record<string, string | number> = {};
    if (utilisateurId !== undefined) params['utilisateurId'] = utilisateurId;
    return this.http.get(`${this.apiUrl}/stats`, { params });
  }

  envoyerNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}`, notification);
  }

  // Notifications en temps réel via RxJS Subject
  getNotificationsEnTempsReel(): Subject<Notification> {
    return new Subject<Notification>();
  }
}
