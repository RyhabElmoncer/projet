// historique.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { HistoriqueEntry} from "../../shared/models/historique";
import {HistoriqueService} from "../../core/services/HistoriqueService";

export enum TypeAction {
  CREATION = 'CREATION',
  MODIFICATION = 'MODIFICATION',
  CHANGEMENT_STATUT = 'CHANGEMENT_STATUT',
  ASSIGNATION = 'ASSIGNATION',
  COMMENTAIRE = 'COMMENTAIRE',
  PIECE_JOINTE = 'PIECE_JOINTE',
  RESOLUTION = 'RESOLUTION',
  FERMETURE = 'FERMETURE',
  SUPPRESSION = 'SUPPRESSION',
  EXPORT = 'EXPORT',
  CONSULTATION = 'CONSULTATION'
}

export enum RoleUtilisateur {
  ADMIN = 'ADMIN',
  TECHNICIEN = 'TECHNICIEN',
  RECLAMANT = 'RECLAMANT',
  SUPERVISEUR = 'SUPERVISEUR',
  SYSTEM = 'SYSTEM'
}

export interface HistoriqueFilter {
  reclamationId?: number;
  utilisateur?: string;
  action?: TypeAction;
  roleUtilisateur?: RoleUtilisateur;
  dateDebut?: Date;
  dateFin?: Date;
}

export interface HistoriqueStats {
  totalActions: number;
  actionsParType: { [key: string]: number };
  actionsParUtilisateur: { [key: string]: number };
  actionsParJour: { date: string; count: number }[];
  utilisateursActifs: number;
}



@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    CurrencyPipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit, OnDestroy {
  @Input() reclamationId?: number; // Si fourni, affiche l'historique pour une réclamation spécifique
  @Input() mode: 'full' | 'widget' = 'full'; // Mode d'affichage

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  historiqueEntries: HistoriqueEntry[] = [];
  filteredEntries: HistoriqueEntry[] = [];
  paginatedEntries: HistoriqueEntry[] = [];

  // Stats
  stats: HistoriqueStats = {
    totalActions: 0,
    actionsParType: {},
    actionsParUtilisateur: {},
    actionsParJour: [],
    utilisateursActifs: 0
  };

  // Filters
  filters: HistoriqueFilter = {};
  searchTerm = '';
  dateDebutFilter: string = '';
  dateFinFilter: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  loading = false;

  // Sorting
  sortField = 'dateAction';
  sortDirection: 'asc' | 'desc' = 'desc';

  // View options
  showDetails = false;
  groupByDate = false;
  showStats = true;

  // Enums for template
  TypeAction = TypeAction;
  RoleUtilisateur = RoleUtilisateur;

  // Math reference
  Math = Math;

  constructor(
      private historiqueService: HistoriqueService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    if (this.reclamationId) {
      this.loadHistoriqueByReclamation(this.reclamationId);
    } else {
      this.loadHistorique();
    }

    if (this.mode === 'full' && this.showStats) {
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

  // Data Loading
  private loadHistorique(): void {
    this.loading = true;

    // Préparer les filtres avec les dates
    const filter: HistoriqueFilter = { ...this.filters };
    if (this.dateDebutFilter) {
      filter.dateDebut = new Date(this.dateDebutFilter);
    }
    if (this.dateFinFilter) {
      filter.dateFin = new Date(this.dateFinFilter);
    }

    this.historiqueService.getHistorique(filter, this.currentPage - 1, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.historiqueEntries = response.content || response;
            this.totalPages = response.totalPages || Math.ceil(this.historiqueEntries.length / this.pageSize);
            this.applyFilters();
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement de l\'historique:', error);
            this.loading = false;
          }
        });
  }

  private loadHistoriqueByReclamation(reclamationId: number): void {
    this.loading = true;

    this.historiqueService.getHistoriqueByReclamation(reclamationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (entries: HistoriqueEntry[]) => {
            this.historiqueEntries = entries;
            this.applyFilters();
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement de l\'historique:', error);
            this.loading = false;
          }
        });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return `il y a ${years} an${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `il y a ${months} mois`;
    } else if (days > 0) {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  }
  private loadStats(): void {
    const dateDebut = this.dateDebutFilter ? new Date(this.dateDebutFilter) : undefined;
    const dateFin = this.dateFinFilter ? new Date(this.dateFinFilter) : undefined;

    this.historiqueService.getHistoriqueStats(dateDebut, dateFin)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats: HistoriqueStats) => {
            this.stats = stats;
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement des statistiques:', error);
          }
        });
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
    this.loadHistorique();
    if (this.showStats && this.mode === 'full') {
      this.loadStats();
    }
  }

  private applyFilters(): void {
    let filtered = [...this.historiqueEntries];

    // Search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
          entry.description?.toLowerCase().includes(searchLower) ||
          entry.utilisateur?.toLowerCase().includes(searchLower) ||
          entry.reclamationNumero?.toLowerCase().includes(searchLower) ||
          entry.ancienneValeur?.toLowerCase().includes(searchLower) ||
          entry.nouvelleValeur?.toLowerCase().includes(searchLower)
      );
    }

    // Action filter
    if (this.filters.action) {
      filtered = filtered.filter(entry => entry.action === this.filters.action);
    }

    // Role filter
    if (this.filters.roleUtilisateur) {
      filtered = filtered.filter(entry => entry.roleUtilisateur === this.filters.roleUtilisateur);
    }

    // User filter
    if (this.filters.utilisateur) {
      filtered = filtered.filter(entry =>
          entry.utilisateur.toLowerCase().includes(this.filters.utilisateur!.toLowerCase())
      );
    }

    this.filteredEntries = this.sortEntries(filtered);
    this.currentPage = 1;
    this.updatePagination();
  }

  private sortEntries(entries: HistoriqueEntry[]): HistoriqueEntry[] {
    return entries.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortField) {
        case 'dateAction':
          aValue = new Date(a.dateAction);
          bValue = new Date(b.dateAction);
          break;
        case 'utilisateur':
          aValue = a.utilisateur.toLowerCase();
          bValue = b.utilisateur.toLowerCase();
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
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
    this.loadHistorique();
  }

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredEntries = this.sortEntries(this.filteredEntries);
    this.updatePagination();
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEntries.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEntries = this.filteredEntries.slice(startIndex, endIndex);
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

  // Utility Methods
  getActionIcon(action: TypeAction): string {
    const icons = {
      [TypeAction.CREATION]: 'fa-plus-circle',
      [TypeAction.MODIFICATION]: 'fa-edit',
      [TypeAction.CHANGEMENT_STATUT]: 'fa-exchange-alt',
      [TypeAction.ASSIGNATION]: 'fa-user-tag',
      [TypeAction.COMMENTAIRE]: 'fa-comment',
      [TypeAction.PIECE_JOINTE]: 'fa-paperclip',
      [TypeAction.RESOLUTION]: 'fa-check-circle',
      [TypeAction.FERMETURE]: 'fa-lock',
      [TypeAction.SUPPRESSION]: 'fa-trash',
      [TypeAction.EXPORT]: 'fa-download',
      [TypeAction.CONSULTATION]: 'fa-eye'
    };
    return icons[action] || 'fa-info-circle';
  }

  getActionColor(action: TypeAction): string {
    const colors = {
      [TypeAction.CREATION]: '#28a745',
      [TypeAction.MODIFICATION]: '#007bff',
      [TypeAction.CHANGEMENT_STATUT]: '#ffc107',
      [TypeAction.ASSIGNATION]: '#17a2b8',
      [TypeAction.COMMENTAIRE]: '#6f42c1',
      [TypeAction.PIECE_JOINTE]: '#fd7e14',
      [TypeAction.RESOLUTION]: '#20c997',
      [TypeAction.FERMETURE]: '#6c757d',
      [TypeAction.SUPPRESSION]: '#dc3545',
      [TypeAction.EXPORT]: '#e83e8c',
      [TypeAction.CONSULTATION]: '#6c757d'
    };
    return colors[action] || '#6c757d';
  }

  getRoleIcon(role: RoleUtilisateur): string {
    const icons = {
      [RoleUtilisateur.ADMIN]: 'fa-user-shield',
      [RoleUtilisateur.TECHNICIEN]: 'fa-user-cog',
      [RoleUtilisateur.RECLAMANT]: 'fa-user',
      [RoleUtilisateur.SUPERVISEUR]: 'fa-user-tie',
      [RoleUtilisateur.SYSTEM]: 'fa-robot'
    };
    return icons[role] || 'fa-user';
  }

  formatActionDescription(entry: HistoriqueEntry): string {
    let description = entry.description;

    if (entry.ancienneValeur && entry.nouvelleValeur) {
      description += ` (${entry.ancienneValeur} → ${entry.nouvelleValeur})`;
    }

    return description;
  }

  groupEntriesByDate(): { [date: string]: HistoriqueEntry[] } {
    return this.paginatedEntries.reduce((groups, entry) => {
      const date = new Date(entry.dateAction).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {} as { [date: string]: HistoriqueEntry[] });
  }

  // Export
  exportHistorique(): void {
    const filter: HistoriqueFilter = { ...this.filters };
    if (this.dateDebutFilter) {
      filter.dateDebut = new Date(this.dateDebutFilter);
    }
    if (this.dateFinFilter) {
      filter.dateFin = new Date(this.dateFinFilter);
    }

    this.historiqueService.exportHistorique(filter)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historique_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: (error: any) => {
            console.error('Erreur lors de l\'export:', error);
          }
        });
  }

  // View toggles
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  toggleGroupByDate(): void {
    this.groupByDate = !this.groupByDate;
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
    if (this.showStats) {
      this.loadStats();
    }
  }

  protected readonly Object = Object;
}