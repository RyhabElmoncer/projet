import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';
import {CurrencyPipe, DatePipe, DecimalPipe, NgClass, NgForOf, NgIf, SlicePipe} from '@angular/common';

import {
  Reclamation,
  TypeReclamation,
  PrioriteReclamation,
  StatutReclamation,
  ReclamationCreateRequest,
  ReclamationUpdateRequest,
  ReclamationFilter,
  ReclamationStats,
  Technicien,
  CommentaireReclamation,
  PieceJointe
} from '../../shared/models/reclamation.model';
import { Asset } from '../../shared/models/asset.model';
import { ServiceDirection } from '../../shared/models/service-direction.model';
import { ReclamationService, TechnicienReclamationService } from '../../core/services/reclamation.service';
import { AssetService } from '../../core/services/asset.service';
import { ServiceDirectionService } from '../../core/services/service-direction.service';

@Component({
  selector: 'app-reclamation-management',
  templateUrl: './reclamation-management.component.html',
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    CurrencyPipe,
    NgIf,
    NgForOf,
    DecimalPipe,
    SlicePipe
  ],
  styleUrls: ['./reclamation-management.component.scss']
})
export class ReclamationManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  paginatedReclamations: Reclamation[] = [];
  techniciens: Technicien[] = [];
  assets: Asset[] = [];
  services: ServiceDirection[] = [];

  // Modal states
  showReclamationModal = false;
  showCommentModal = false;
  showDetailsModal = false;
  isEditMode = false;
  currentReclamation: Partial<Reclamation> = {};
  saving = false;

  // Comments and attachments
  selectedReclamationForComment: Reclamation | null = null;
  commentaires: CommentaireReclamation[] = [];
  pieceJointes: PieceJointe[] = [];
  newComment = '';
  selectedFiles: File[] = [];

  // Filters
  filters: ReclamationFilter = {};
  searchTerm = '';

  // Selection
  selectedReclamations = new Set<number>();

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Statistics
  stats: ReclamationStats = {
    total: 0,
    nouvelles: 0,
    enCours: 0,
    enAttente: 0,
    resolues: 0,
    fermees: 0,
    enRetard: 0,
    tempsMoyenResolution: 0,
    tauxSatisfaction: 0
  };

  // Enums for template
  TypeReclamation = TypeReclamation;
  PrioriteReclamation = PrioriteReclamation;
  StatutReclamation = StatutReclamation;

  Math = Math;
  Object: any;

  constructor(
      private reclamationService: ReclamationService,
      private technicienService: TechnicienReclamationService,
      private assetService: AssetService,
      private serviceDirectionService: ServiceDirectionService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  toggleInterventionSelection(id: number): void {
    if (this.selectedReclamations.has(id)) {
      this.selectedReclamations.delete(id);
    } else {
      this.selectedReclamations.add(id);
    }
  }

  sort(field: string): void {
    if (this.sortField === field) {
      // Si on clique sur la même colonne, inverser le sens
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Sinon, on trie par la nouvelle colonne en ascendant
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    // Recharge les données (si pagination backend)
    this.loadReclamations();

    // Ou trie localement si tu fais tout côté front :
    // this.filteredReclamations.sort((a: any, b: any) => {
    //   const valueA = (a[field] ?? '').toString().toLowerCase();
    //   const valueB = (b[field] ?? '').toString().toLowerCase();
    //   if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
    //   if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
    //   return 0;
    // });
    // this.updatePagination();
  }

  private initializeComponent(): void {
    this.loadReclamations();
    this.loadTechniciens();
    this.loadAssets();
    this.loadServices();
    this.loadStatistics();
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
  private loadReclamations(): void {
    const pageRequest = {
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: this.sortField,
      direction: this.sortDirection
    };

    this.reclamationService.getReclamationsPaginated(pageRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.reclamations = response.content;
            this.totalPages = response.totalPages;
            this.applyFilters();
          },
          error: (error) => {
            console.error('Erreur lors du chargement des réclamations:', error);
          }
        });
  }



  private loadAssets(): void {
    this.assetService.getAllAssets()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (assets) => {
            this.assets = assets;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des actifs:', error);
          }
        });
  }

  private loadServices(): void {
    this.serviceDirectionService.getAllServices()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (services) => {
            this.services = services;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des services:', error);
          }
        });
  }

  private loadStatistics(): void {
    this.reclamationService.getReclamationStats()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => {
            this.stats = stats;
          },
          error: (error) => {
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

  private applyFilters(): void {
    let filtered = [...this.reclamations];

    // Apply search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(reclamation =>
          reclamation.objet?.toLowerCase().includes(searchLower) ||
          reclamation.description?.toLowerCase().includes(searchLower) ||
          reclamation.reclamantNom?.toLowerCase().includes(searchLower) ||
          reclamation.reclamantEmail?.toLowerCase().includes(searchLower) ||
          reclamation.numero?.toLowerCase().includes(searchLower)
      );
    }

    // Apply other filters
    if (this.filters.statut) {
      filtered = filtered.filter(r => r.statut === this.filters.statut);
    }
    if (this.filters.priorite) {
      filtered = filtered.filter(r => r.priorite === this.filters.priorite);
    }
    if (this.filters.typeReclamation) {
      filtered = filtered.filter(r => r.typeReclamation === this.filters.typeReclamation);
    }

    this.filteredReclamations = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.applyFilters();
  }

  // CRUD Operations
  openCreateModal(): void {
    this.currentReclamation = {
      priorite: PrioriteReclamation.MOYENNE,
      typeReclamation: TypeReclamation.TECHNIQUE,
      statut: StatutReclamation.NOUVELLE
    };
    this.isEditMode = false;
    this.showReclamationModal = true;
  }

  openEditModal(reclamation: Reclamation): void {
    this.currentReclamation = { ...reclamation };
    this.isEditMode = true;
    this.showReclamationModal = true;
  }

  closeModal(): void {
    this.showReclamationModal = false;
    this.showCommentModal = false;
    this.showDetailsModal = false;
    this.currentReclamation = {};
    this.selectedFiles = [];
  }

  saveReclamation(): void {
    if (!this.currentReclamation.objet || !this.currentReclamation.description) {
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.currentReclamation.id) {
      const updateRequest: ReclamationUpdateRequest = {
        objet: this.currentReclamation.objet,
        description: this.currentReclamation.description,
        typeReclamation: this.currentReclamation.typeReclamation,
        priorite: this.currentReclamation.priorite,
        statut: this.currentReclamation.statut
      };

      this.reclamationService.updateReclamation(this.currentReclamation.id, updateRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadReclamations();
              this.closeModal();
              this.saving = false;
            },
            error: (error) => {
              console.error('Erreur lors de la mise à jour:', error);
              this.saving = false;
            }
          });
    } else {
      const createRequest: ReclamationCreateRequest = {
        objet: this.currentReclamation.objet!,
        description: this.currentReclamation.description!,
        typeReclamation: this.currentReclamation.typeReclamation!,
        priorite: this.currentReclamation.priorite!,
        reclamantNom: this.currentReclamation.reclamantNom!,
        reclamantEmail: this.currentReclamation.reclamantEmail!,
        reclamantTelephone: this.currentReclamation.reclamantTelephone,
        pieceJointes: this.selectedFiles
      };

      this.reclamationService.createReclamation(createRequest)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadReclamations();
              this.closeModal();
              this.saving = false;
            },
            error: (error) => {
              console.error('Erreur lors de la création:', error);
              this.saving = false;
            }
          });
    }
  }

  deleteReclamation(reclamation: Reclamation): void {
    if (reclamation.id && confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) {
      this.reclamationService.deleteReclamation(reclamation.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadReclamations();
            },
            error: (error) => {
              console.error('Erreur lors de la suppression:', error);
            }
          });
    }
  }

  // Status Management
  changerStatut(reclamation: Reclamation, nouveauStatut: StatutReclamation): void {
    if (!reclamation.id) return;

    this.reclamationService.changerStatut(reclamation.id, nouveauStatut)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadReclamations();
          },
          error: (error) => {
            console.error('Erreur lors du changement de statut:', error);
          }
        });
  }

  assignerTechnicien(reclamation: Reclamation, technicienId: number): void {
    if (!reclamation.id) return;

    this.reclamationService.assignerTechnicien(reclamation.id, technicienId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadReclamations();
          },
          error: (error) => {
            console.error('Erreur lors de l\'assignation:', error);
          }
        });
  }

  // Comments and Details
  openDetailsModal(reclamation: Reclamation): void {
    this.currentReclamation = reclamation;
    this.showDetailsModal = true;
    this.loadCommentaires(reclamation);
    this.loadPieceJointes(reclamation);
  }

  openCommentModal(reclamation: Reclamation): void {
    this.selectedReclamationForComment = reclamation;
    this.showCommentModal = true;
    this.newComment = '';
    this.selectedFiles = [];
  }

  private loadCommentaires(reclamation: Reclamation): void {
    if (!reclamation.id) return;

    this.reclamationService.getCommentaires(reclamation.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (commentaires) => {
            this.commentaires = commentaires;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des commentaires:', error);
          }
        });
  }
  private loadTechniciens(): void {
    this.technicienService.getTechniciensActifs()

  }
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedReclamations.clear();
    } else {
      this.filteredReclamations.forEach(r => {
        if (r.id) this.selectedReclamations.add(r.id);
      });
    }
  }

  isAllSelected(): boolean {
    return this.filteredReclamations.length > 0 &&
        this.filteredReclamations.every(r => r.id && this.selectedReclamations.has(r.id));
  }

  toggleSelection(id: number): void {
    if (this.selectedReclamations.has(id)) {
      this.selectedReclamations.delete(id);
    } else {
      this.selectedReclamations.add(id);
    }
  }

  private loadPieceJointes(reclamation: Reclamation): void {
    if (!reclamation.id) return;


  }


  ajouterCommentaire(): void {
    if (!this.selectedReclamationForComment?.id || !this.newComment.trim()) return;

    this.reclamationService.ajouterCommentaire(
        this.selectedReclamationForComment.id,
        this.newComment,
        this.selectedFiles
    )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.newComment = '';
            this.selectedFiles = [];
            this.closeModal();
            if (this.showDetailsModal) {
              this.loadCommentaires(this.selectedReclamationForComment!);
            }
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout du commentaire:', error);
          }
        });
  }

  // File handling
  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  // Utility methods
  getPrioriteColor(priorite: PrioriteReclamation): string {
    return this.reclamationService.getPrioriteColor(priorite);
  }

  getStatutColor(statut: StatutReclamation): string {
    return this.reclamationService.getStatutColor(statut);
  }
  onTechnicienChange(event: Event, reclamation: Reclamation): void {
    const select = event.target as HTMLSelectElement;
    const technicienId = Number(select.value);
    this.assignerTechnicien(reclamation, technicienId);
  }

  isEnRetard(reclamation: Reclamation): boolean {
    return this.reclamationService.isEnRetard(reclamation);
  }

  formatDuration(heures: number): string {
    if (heures < 24) {
      return `${heures}h`;
    }
    const jours = Math.floor(heures / 24);
    const heuresRestantes = heures % 24;
    return heuresRestantes > 0 ? `${jours}j ${heuresRestantes}h` : `${jours}j`;
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredReclamations.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedReclamations = this.filteredReclamations.slice(startIndex, endIndex);
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

  // Export
  exportReclamations(format: 'excel' | 'pdf'): void {
    this.reclamationService.exporterReclamations(format, this.filters)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reclamations.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: (error) => {
            console.error('Erreur lors de l\'export:', error);
          }
        });
  }

  protected readonly HTMLSelectElement = HTMLSelectElement;
}