// notifications.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { NotificationService } from '../../core/services/NotificationService';

// Models
export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: TypeNotification;
  priorite: PrioriteNotification;
  statut: StatutNotification;
  utilisateurId: number;
  utilisateurNom?: string;
  reclamationId?: number;
  reclamationNumero?: string;
  dateCreation: Date;
  dateLue?: Date;
  dateExpiration?: Date;
  metadata?: { [key: string]: any };
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  libelle: string;
  icone: string;
  couleur: string;
  action: () => void;
}

export enum TypeNotification {
  INFO = 'INFO',
  SUCCES = 'SUCCES',
  AVERTISSEMENT = 'AVERTISSEMENT',
  ERREUR = 'ERREUR',
  NOUVELLE_RECLAMATION = 'NOUVELLE_RECLAMATION',
  ASSIGNATION = 'ASSIGNATION',
  CHANGEMENT_STATUT = 'CHANGEMENT_STATUT',
  COMMENTAIRE = 'COMMENTAIRE',
  ECHEANCE = 'ECHEANCE',
  RAPPEL = 'RAPPEL',
  SYSTEME = 'SYSTEME'
}

export enum PrioriteNotification {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}

export enum StatutNotification {
  NON_LUE = 'NON_LUE',
  LUE = 'LUE',
  ARCHIVEE = 'ARCHIVEE'
}

export interface NotificationFilter {
  type?: TypeNotification;
  priorite?: PrioriteNotification;
  statut?: StatutNotification;
  dateDebut?: Date;
  dateFin?: Date;
  utilisateurId?: number;
  reclamationId?: number;
}

export interface NotificationStats {
  total: number;
  nonLues: number;
  parType: { [key: string]: number };
  parPriorite: { [key: string]: number };
  parJour: { date: string; count: number }[];
}

// Service

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-15px)' }),
          stagger('50ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          stagger('50ms', [
            animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-15px)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('pulse', style({ transform: 'scale(1.05)' })),
      transition('normal <=> pulse', animate('200ms ease-in-out'))
    ])
  ]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() utilisateurId?: number;
  @Input() mode: 'dropdown' | 'page' | 'widget' = 'page';
  @Input() maxItems = 10;
  @Input() autoRefresh = true;
  @Input() refreshInterval = 30000; // 30 secondes

  @Output() notificationClick = new EventEmitter<Notification>();
  @Output() notificationAction = new EventEmitter<{ notification: Notification; action: string }>();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private refreshSubject = new Subject<void>();

  // Data
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  paginatedNotifications: Notification[] = [];
  selectedNotification?: Notification;

  // Stats
  stats: NotificationStats = {
    total: 0,
    nonLues: 0,
    parType: {},
    parPriorite: {},
    parJour: []
  };

  // UI State
  loading = false;
  isOpen = false;
  showFilters = false;
  viewMode: 'liste' | 'cartes' = 'liste';

  // Filters
  filters: NotificationFilter = {};
  searchTerm = '';
  dateDebutFilter = '';
  dateFinFilter = '';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;

  // Sorting
  sortField = 'dateCreation';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Enums for template
  TypeNotification = TypeNotification;
  PrioriteNotification = PrioriteNotification;
  StatutNotification = StatutNotification;

  // Animation states
  pulseStates: { [key: number]: string } = {};

  constructor(
      private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebounce();
    this.setupAutoRefresh();
    this.setupRealTimeNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.loadNotifications();
    if (this.mode === 'page') {
      this.loadStats();
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubject
        .pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.applyFilters();
        });
  }

  private setupAutoRefresh(): void {
    if (this.autoRefresh) {
      interval(this.refreshInterval)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.refreshNotifications();
          });
    }
  }

  private setupRealTimeNotifications(): void {
    this.notificationService.getNotificationsEnTempsReel()

  }

  // Data Loading
  private loadNotifications(): void {
    this.loading = true;

    const filter: NotificationFilter = { ...this.filters };
    if (this.utilisateurId) {
      filter.utilisateurId = this.utilisateurId;
    }
    if (this.dateDebutFilter) {
      filter.dateDebut = new Date(this.dateDebutFilter);
    }
    if (this.dateFinFilter) {
      filter.dateFin = new Date(this.dateFinFilter);
    }

    const loadMethod = this.utilisateurId && this.mode !== 'page'
        ? this.notificationService.getNotificationsByUser(this.utilisateurId, this.filters.statut)
        : this.notificationService.getNotifications(filter, this.currentPage - 1, this.pageSize);

    loadMethod
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.notifications = response.content || response;
            this.totalPages = response.totalPages || Math.ceil(this.notifications.length / this.pageSize);
            this.applyFilters();
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement des notifications:', error);
            this.loading = false;
          }
        });
  }

  private loadStats(): void {
    this.notificationService.getStats(this.utilisateurId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats: NotificationStats) => {
            this.stats = stats;
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement des statistiques:', error);
          }
        });
  }

  private refreshNotifications(): void {
    if (!this.loading) {
      this.loadNotifications();
    }
  }

  private addNewNotification(notification: Notification): void {
    // Ajouter la nouvelle notification en haut de la liste
    this.notifications.unshift(notification);

    // Animation pulse pour attirer l'attention
    this.pulseStates[notification.id] = 'pulse';
    setTimeout(() => {
      this.pulseStates[notification.id] = 'normal';
    }, 1000);

    // Mettre à jour les filtres et stats
    this.applyFilters();
    this.stats.total++;
    if (notification.statut === StatutNotification.NON_LUE) {
      this.stats.nonLues++;
    }
  }

  // Filtering and Search
  onFilterChange(): void {
    if (this.searchTerm !== undefined) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.applyFilters();
    }
  }

  onDateFilterChange(): void {
    this.loadNotifications();
  }

  private applyFilters(): void {
    let filtered = [...this.notifications];

    // Search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
          notification.titre?.toLowerCase().includes(searchLower) ||
          notification.message?.toLowerCase().includes(searchLower) ||
          notification.utilisateurNom?.toLowerCase().includes(searchLower) ||
          notification.reclamationNumero?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (this.filters.type) {
      filtered = filtered.filter(notification => notification.type === this.filters.type);
    }

    // Priority filter
    if (this.filters.priorite) {
      filtered = filtered.filter(notification => notification.priorite === this.filters.priorite);
    }

    // Status filter
    if (this.filters.statut) {
      filtered = filtered.filter(notification => notification.statut === this.filters.statut);
    }

    // Reclamation filter
    if (this.filters.reclamationId) {
      filtered = filtered.filter(notification => notification.reclamationId === this.filters.reclamationId);
    }

    this.filteredNotifications = this.sortNotifications(filtered);
    this.currentPage = 1;
    this.updatePagination();
  }

  private sortNotifications(notifications: Notification[]): Notification[] {
    return notifications.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortField) {
        case 'dateCreation':
          aValue = new Date(a.dateCreation);
          bValue = new Date(b.dateCreation);
          break;
        case 'priorite':
          const priorityOrder = {
            [PrioriteNotification.CRITIQUE]: 4,
            [PrioriteNotification.HAUTE]: 3,
            [PrioriteNotification.NORMALE]: 2,
            [PrioriteNotification.BASSE]: 1
          };
          aValue = priorityOrder[a.priorite];
          bValue = priorityOrder[b.priorite];
          break;
        case 'titre':
          aValue = a.titre.toLowerCase();
          bValue = b.titre.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.dateDebutFilter = '';
    this.dateFinFilter = '';
    this.loadNotifications();
  }

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredNotifications = this.sortNotifications(this.filteredNotifications);
    this.updatePagination();
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    if (this.mode === 'dropdown' || this.mode === 'widget') {
      this.paginatedNotifications = this.filteredNotifications.slice(0, this.maxItems);
    } else {
      this.paginatedNotifications = this.filteredNotifications.slice(startIndex, endIndex);
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Notification Actions
  onNotificationClick(notification: Notification): void {
    this.selectedNotification = notification;

    if (notification.statut === StatutNotification.NON_LUE) {
      this.marquerCommeLue(notification);
    }

    this.notificationClick.emit(notification);

    if (this.mode === 'dropdown') {
      this.toggleDropdown();
    }
  }

  marquerCommeLue(notification: Notification): void {
    if (notification.statut === StatutNotification.NON_LUE) {
      this.notificationService.marquerCommeLue(notification.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              notification.statut = StatutNotification.LUE;
              notification.dateLue = new Date();
              this.stats.nonLues--;
            },
            error: (error: any) => {
              console.error('Erreur lors du marquage comme lue:', error);
            }
          });
    }
  }

  marquerToutesCommeLues(): void {
    if (this.utilisateurId) {
      this.notificationService.marquerToutesCommeLues(this.utilisateurId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notifications.forEach(notification => {
                if (notification.statut === StatutNotification.NON_LUE) {
                  notification.statut = StatutNotification.LUE;
                  notification.dateLue = new Date();
                }
              });
              this.stats.nonLues = 0;
              this.applyFilters();
            },
            error: (error: any) => {
              console.error('Erreur lors du marquage de toutes comme lues:', error);
            }
          });
    }
  }

  archiverNotification(notification: Notification): void {
    this.notificationService.archiverNotification(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.statut = StatutNotification.ARCHIVEE;
            this.applyFilters();
          },
          error: (error: any) => {
            console.error('Erreur lors de l\'archivage:', error);
          }
        });
  }

  supprimerNotification(notification: Notification): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      this.notificationService.supprimerNotification(notification.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notifications = this.notifications.filter(n => n.id !== notification.id);
              this.stats.total--;
              if (notification.statut === StatutNotification.NON_LUE) {
                this.stats.nonLues--;
              }
              this.applyFilters();
            },
            error: (error: any) => {
              console.error('Erreur lors de la suppression:', error);
            }
          });
    }
  }

  executerAction(notification: Notification, actionId: string): void {
    const action = notification.actions?.find(a => a.id === actionId);
    if (action) {
      action.action();
      this.notificationAction.emit({ notification, action: actionId });
    }
  }

  // UI Methods
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.notifications.length) {
      this.loadNotifications();
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'liste' ? 'cartes' : 'liste';
  }

  // Utility Methods
  getTypeIcon(type: TypeNotification): string {
    const icons = {
      [TypeNotification.INFO]: 'fa-info-circle',
      [TypeNotification.SUCCES]: 'fa-check-circle',
      [TypeNotification.AVERTISSEMENT]: 'fa-exclamation-triangle',
      [TypeNotification.ERREUR]: 'fa-times-circle',
      [TypeNotification.NOUVELLE_RECLAMATION]: 'fa-plus-circle',
      [TypeNotification.ASSIGNATION]: 'fa-user-tag',
      [TypeNotification.CHANGEMENT_STATUT]: 'fa-exchange-alt',
      [TypeNotification.COMMENTAIRE]: 'fa-comment',
      [TypeNotification.ECHEANCE]: 'fa-clock',
      [TypeNotification.RAPPEL]: 'fa-bell',
      [TypeNotification.SYSTEME]: 'fa-cog'
    };
    return icons[type] || 'fa-bell';
  }

  getTypeColor(type: TypeNotification): string {
    const colors = {
      [TypeNotification.INFO]: '#007bff',
      [TypeNotification.SUCCES]: '#28a745',
      [TypeNotification.AVERTISSEMENT]: '#ffc107',
      [TypeNotification.ERREUR]: '#dc3545',
      [TypeNotification.NOUVELLE_RECLAMATION]: '#17a2b8',
      [TypeNotification.ASSIGNATION]: '#6f42c1',
      [TypeNotification.CHANGEMENT_STATUT]: '#fd7e14',
      [TypeNotification.COMMENTAIRE]: '#20c997',
      [TypeNotification.ECHEANCE]: '#e83e8c',
      [TypeNotification.RAPPEL]: '#6c757d',
      [TypeNotification.SYSTEME]: '#343a40'
    };
    return colors[type] || '#6c757d';
  }

  getPrioriteIcon(priorite: PrioriteNotification): string {
    const icons = {
      [PrioriteNotification.BASSE]: 'fa-arrow-down',
      [PrioriteNotification.NORMALE]: 'fa-minus',
      [PrioriteNotification.HAUTE]: 'fa-arrow-up',
      [PrioriteNotification.CRITIQUE]: 'fa-exclamation'
    };
    return icons[priorite] || 'fa-minus';
  }

  getPrioriteColor(priorite: PrioriteNotification): string {
    const colors = {
      [PrioriteNotification.BASSE]: '#6c757d',
      [PrioriteNotification.NORMALE]: '#007bff',
      [PrioriteNotification.HAUTE]: '#ffc107',
      [PrioriteNotification.CRITIQUE]: '#dc3545'
    };
    return colors[priorite] || '#6c757d';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  }

  isExpired(notification: Notification): boolean {
    return notification.dateExpiration ? new Date() > new Date(notification.dateExpiration) : false;
  }

  // Template Helper Methods
  getTypeNotificationValues(): string[] {
    return Object.values(this.TypeNotification);
  }

  getPrioriteNotificationValues(): string[] {
    return Object.values(this.PrioriteNotification);
  }

  getStatutNotificationValues(): string[] {
    return Object.values(this.StatutNotification);
  }

  getStatsTypeKeys(): string[] {
    return Object.keys(this.stats.parType || {});
  }

  getStatsPrioriteKeys(): string[] {
    return Object.keys(this.stats.parPriorite || {});
  }

  protected readonly Object = Object;
}