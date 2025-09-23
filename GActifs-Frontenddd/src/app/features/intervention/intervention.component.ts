
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Asset } from '../../shared/models/asset.model';
import {PageRequest, PageResponse, ServiceDirection} from '../../shared/models/service-direction.model';
import { AssetService } from '../../core/services/asset.service';
import { ServiceDirectionService } from '../../core/services/service-direction.service';
import {
  Intervention,
  InterventionCreateRequest,
  InterventionFilter,
  InterventionStats, InterventionUpdateRequest, PrioriteIntervention, StatutIntervention,
  Technicien, TypeIntervention
} from '../../shared/models/Intervention';
import {InterventionService, TechnicienService} from "../../core/services/intervention.service";

@Component({
  selector: 'app-intervention',
  templateUrl: './intervention.component.html',
  styleUrls: ['./intervention.component.scss']
})
export class InterventionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  interventions: Intervention[] = [];
  pagedInterventions: PageResponse<Intervention> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: true
  };

  stats: InterventionStats | null = null;
  availableAssets: Asset[] = [];
  availableTechniciens: Technicien[] = [];
  availableServices: ServiceDirection[] = [];

  // UI state
  loading = false;
  showModal = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  currentIntervention: Intervention | null = null;

  // Forms
  interventionForm!: FormGroup;
  searchForm!: FormGroup;

  // Pagination
  pageRequest: PageRequest = {
    page: 0,
    size: 10,
    sort: 'dateCreation',
    direction: 'desc'
  };

  constructor(
      private interventionService: InterventionService,
      private assetService: AssetService,
      private technicienService: TechnicienService,
      private serviceDirectionService: ServiceDirectionService,
      private formBuilder: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadInterventions();
    this.loadStats();
    this.loadReferenceData();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.interventionForm = this.formBuilder.group({
      titre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      typeIntervention: ['', [Validators.required]],
      priorite: ['', [Validators.required]],
      statut: ['PLANIFIEE'],
      dateEcheance: ['', [Validators.required]],
      dureeEstimee: [null, [Validators.min(0)]],
      cout: [null, [Validators.min(0)]],
      assetId: [null],
      technicienId: [null],
      serviceId: [null]
    });

    this.searchForm = this.formBuilder.group({
      query: [''],
      statut: [''],
      priorite: [''],
      typeIntervention: ['']
    });
  }

  private setupSearch(): void {
    // Recherche textuelle
    this.searchForm.get('query')?.valueChanges
        .pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        )
        .subscribe(() => this.applyFilters());

    // Filtres
    ['statut', 'priorite', 'typeIntervention'].forEach(filterName => {
      this.searchForm.get(filterName)?.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => this.applyFilters());
    });
  }

  private applyFilters(): void {
    const filters: InterventionFilter = {
      titre: this.searchForm.get('query')?.value || undefined,
      statut: this.searchForm.get('statut')?.value || undefined,
      priorite: this.searchForm.get('priorite')?.value || undefined,
      typeIntervention: this.searchForm.get('typeIntervention')?.value || undefined
    };

    this.searchInterventions(filters);
  }

  loadInterventions(): void {
    this.loading = true;
    this.interventionService.getInterventionsPaginated(this.pageRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.pagedInterventions = response;
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des interventions:', error);
            this.loading = false;
          }
        });
  }

  searchInterventions(filters: InterventionFilter): void {
    this.loading = true;
    this.interventionService.searchInterventions(filters, this.pageRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.pagedInterventions = response;
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la recherche:', error);
            this.loading = false;
          }
        });
  }

  loadStats(): void {
    this.interventionService.getInterventionStats()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => this.stats = stats,
          error: (error) => console.error('Erreur lors du chargement des statistiques:', error)
        });
  }

  loadReferenceData(): void {
    // Charger les assets
    this.assetService.getAllAssets()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (assets) => this.availableAssets = assets,
          error: (error) => console.error('Erreur lors du chargement des assets:', error)
        });

    // Charger les techniciens
    this.technicienService.getAllTechniciens()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (techniciens) => this.availableTechniciens = techniciens.filter(t => t.actif),
          error: (error) => console.error('Erreur lors du chargement des techniciens:', error)
        });

    // Charger les services
    this.serviceDirectionService.getAllServices()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (services) => this.availableServices = services.filter(s => s.actif),
          error: (error) => console.error('Erreur lors du chargement des services:', error)
        });
  }

  onPageChange(page: number): void {
    this.pageRequest.page = page;
    this.hasFilters() ? this.applyFilters() : this.loadInterventions();
  }

  onPageSizeChange(size: number): void {
    this.pageRequest.size = size;
    this.pageRequest.page = 0;
    this.hasFilters() ? this.applyFilters() : this.loadInterventions();
  }

  onSortChange(sort: string): void {
    if (this.pageRequest.sort === sort) {
      this.pageRequest.direction = this.pageRequest.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.pageRequest.sort = sort;
      this.pageRequest.direction = 'asc';
    }
    this.hasFilters() ? this.applyFilters() : this.loadInterventions();
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.currentIntervention = null;
    this.interventionForm.reset();
    this.interventionForm.patchValue({
      statut: 'PLANIFIEE',
      priorite: 'MOYENNE',
      typeIntervention: 'MAINTENANCE_PREVENTIVE'
    });
    this.showModal = true;
  }

  openEditModal(intervention: Intervention): void {
    this.modalMode = 'edit';
    this.currentIntervention = intervention;

    // Convertir les dates pour le formulaire
    const formData = {
      ...intervention,
      dateEcheance: this.formatDateForInput(intervention.dateEcheance),
      dateDebut: intervention.dateDebut ? this.formatDateForInput(intervention.dateDebut) : null,
      dateFin: intervention.dateFin ? this.formatDateForInput(intervention.dateFin) : null,
      assetId: intervention.asset?.id || null,
      technicienId: intervention.technicienAssigne?.id || null,
      serviceId: intervention.serviceDirection?.id || null
    };

    this.interventionForm.patchValue(formData);
    this.showModal = true;
  }

  openViewModal(intervention: Intervention): void {
    this.modalMode = 'view';
    this.currentIntervention = intervention;

    const formData = {
      ...intervention,
      dateEcheance: this.formatDateForInput(intervention.dateEcheance),
      dateDebut: intervention.dateDebut ? this.formatDateForInput(intervention.dateDebut) : null,
      dateFin: intervention.dateFin ? this.formatDateForInput(intervention.dateFin) : null,
      assetId: intervention.asset?.id || null,
      technicienId: intervention.technicienAssigne?.id || null,
      serviceId: intervention.serviceDirection?.id || null
    };

    this.interventionForm.patchValue(formData);
    this.interventionForm.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.interventionForm.enable();
    this.interventionForm.reset();
    this.currentIntervention = null;
  }

  onSubmit(): void {
    if (this.interventionForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.interventionForm.value;

    if (this.modalMode === 'create') {
      this.createIntervention(formValue);
    } else if (this.modalMode === 'edit') {
      this.updateIntervention(formValue);
    }
  }

  private createIntervention(interventionData: any): void {
    const createRequest: InterventionCreateRequest = {
      titre: interventionData.titre,
      description: interventionData.description,
      typeIntervention: interventionData.typeIntervention as TypeIntervention,
      priorite: interventionData.priorite as PrioriteIntervention,
      dateEcheance: new Date(interventionData.dateEcheance),
      dureeEstimee: interventionData.dureeEstimee,
      cout: interventionData.cout,
      assetId: interventionData.assetId,
      technicienId: interventionData.technicienId,
      serviceId: interventionData.serviceId
    };

    this.loading = true;
    this.interventionService.createIntervention(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (intervention) => {
            this.loadInterventions();
            this.loadStats();
            this.closeModal();
            this.loading = false;
            // Notification de succès
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.loading = false;
            // Notification d'erreur
          }
        });
  }

  private updateIntervention(interventionData: any): void {
    if (!this.currentIntervention?.id) return;

    const updateRequest: InterventionUpdateRequest = {
      titre: interventionData.titre,
      description: interventionData.description,
      typeIntervention: interventionData.typeIntervention as TypeIntervention,
      priorite: interventionData.priorite as PrioriteIntervention,
      statut: interventionData.statut as StatutIntervention,
      dateEcheance: new Date(interventionData.dateEcheance),
      dureeEstimee: interventionData.dureeEstimee,
      cout: interventionData.cout,
      technicienId: interventionData.technicienId
    };

    this.loading = true;
    this.interventionService.updateIntervention(this.currentIntervention.id, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (intervention) => {
            this.loadInterventions();
            this.loadStats();
            this.closeModal();
            this.loading = false;
            // Notification de succès
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            this.loading = false;
            // Notification d'erreur
          }
        });
  }

  deleteIntervention(intervention: Intervention): void {
    if (!intervention.id) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'intervention "${intervention.titre}" ?`)) {
      this.loading = true;
      this.interventionService.deleteIntervention(intervention.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadInterventions();
              this.loadStats();
              this.loading = false;
              // Notification de succès
            },
            error: (error) => {
              console.error('Erreur lors de la suppression:', error);
              this.loading = false;
              // Notification d'erreur
            }
          });
    }
  }

  changeStatus(intervention: Intervention, newStatus: StatutIntervention): void {
    if (!intervention.id) return;

    const updateRequest: InterventionUpdateRequest = {
      statut: newStatus
    };

    this.interventionService.updateIntervention(intervention.id, updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadInterventions();
            this.loadStats();
            // Notification de succès
          },
          error: (error) => {
            console.error('Erreur lors du changement de statut:', error);
            // Notification d'erreur
          }
        });
  }

  // Utility methods
  isOverdue(intervention: Intervention): boolean {
    const today = new Date();
    const echeance = new Date(intervention.dateEcheance);
    return echeance < today &&
        intervention.statut !== 'TERMINEE' &&
        intervention.statut !== 'ANNULEE' &&
        intervention.statut !== 'VALIDEE';
  }

  hasFilters(): boolean {
    const query = this.searchForm.get('query')?.value;
    const statut = this.searchForm.get('statut')?.value;
    const priorite = this.searchForm.get('priorite')?.value;
    const type = this.searchForm.get('typeIntervention')?.value;

    return !!(query || statut || priorite || type);
  }

  private formatDateForInput(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  }

  private markFormGroupTouched(): void {
    Object.keys(this.interventionForm.controls).forEach(key => {
      const control = this.interventionForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.interventionForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} est requis`;
      }
      if (control.errors['minlength']) {
        return `${fieldName} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères`;
      }
      if (control.errors['maxlength']) {
        return `${fieldName} ne peut pas dépasser ${control.errors['maxlength'].requiredLength} caractères`;
      }
      if (control.errors['min']) {
        return `${fieldName} doit être supérieur ou égal à ${control.errors['min'].min}`;
      }
    }
    return '';
  }

  get modalTitle(): string {
    switch (this.modalMode) {
      case 'create': return 'Créer une nouvelle intervention';
      case 'edit': return 'Modifier l\'intervention';
      case 'view': return 'Détails de l\'intervention';
      default: return '';
    }
  }

  // Label getters for templates
  getTypeLabel(type: TypeIntervention): string {
    const labels: Record<TypeIntervention, string> = {
      [TypeIntervention.MAINTENANCE_PREVENTIVE]: 'Maintenance Préventive',
      [TypeIntervention.MAINTENANCE_CORRECTIVE]: 'Maintenance Corrective',
      [TypeIntervention.REPARATION]: 'Réparation',
      [TypeIntervention.INSTALLATION]: 'Installation',
      [TypeIntervention.CONFIGURATION]: 'Configuration',
      [TypeIntervention.MISE_A_JOUR]: 'Mise à jour',
      [TypeIntervention.DIAGNOSTIC]: 'Diagnostic',
      [TypeIntervention.AUTRE]: 'Autre'
    };
    return labels[type] || type;
  }

  getPriorityLabel(priority: PrioriteIntervention): string {
    const labels: Record<PrioriteIntervention, string> = {
      [PrioriteIntervention.CRITIQUE]: 'Critique',
      [PrioriteIntervention.HAUTE]: 'Haute',
      [PrioriteIntervention.MOYENNE]: 'Moyenne',
      [PrioriteIntervention.BASSE]: 'Basse'
    };
    return labels[priority] || priority;
  }

  getStatusLabel(status: StatutIntervention): string {
    const labels: Record<StatutIntervention, string> = {
      [StatutIntervention.PLANIFIEE]: 'Planifiée',
      [StatutIntervention.EN_ATTENTE]: 'En attente',
      [StatutIntervention.EN_COURS]: 'En cours',
      [StatutIntervention.SUSPENDUE]: 'Suspendue',
      [StatutIntervention.TERMINEE]: 'Terminée',
      [StatutIntervention.ANNULEE]: 'Annulée',
      [StatutIntervention.VALIDEE]: 'Validée'
    };
    return labels[status] || status;
  }

  // CSS class getters for styling
  getTypeClass(type: TypeIntervention): string {
    return `type-${type.toLowerCase().replace('_', '-')}`;
  }

  getPriorityClass(priority: PrioriteIntervention): string {
    const classes: Record<PrioriteIntervention, string> = {
      [PrioriteIntervention.CRITIQUE]: 'priority-critical',
      [PrioriteIntervention.HAUTE]: 'priority-high',
      [PrioriteIntervention.MOYENNE]: 'priority-medium',
      [PrioriteIntervention.BASSE]: 'priority-low'
    };
    return classes[priority] || '';
  }

  getStatusClass(status: StatutIntervention): string {
    const classes: Record<StatutIntervention, string> = {
      [StatutIntervention.PLANIFIEE]: 'status-planned',
      [StatutIntervention.EN_ATTENTE]: 'status-waiting',
      [StatutIntervention.EN_COURS]: 'status-progress',
      [StatutIntervention.SUSPENDUE]: 'status-suspended',
      [StatutIntervention.TERMINEE]: 'status-completed',
      [StatutIntervention.ANNULEE]: 'status-cancelled',
      [StatutIntervention.VALIDEE]: 'status-validated'
    };
    return classes[status] || '';
  }

  protected readonly Math = Math;
}