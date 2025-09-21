import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  ServiceDirection,
  ServiceDirectionCreateDto,
  ServiceDirectionUpdateDto,
  PageRequest,
  PageResponse
} from '../../shared/models/service-direction.model';
import {ServiceDirectionService} from "../../core/services/service-direction.service";
import {CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-service-direction',
  templateUrl: './service-direction.component.html',
  imports: [
    ReactiveFormsModule,
    FormsModule,

    NgIf,
    NgForOf
  ],
  styleUrls: ['./service-direction.component.scss']
})
export class ServiceDirectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  services: ServiceDirection[] = [];
  pagedServices: PageResponse<ServiceDirection> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: true
  };

  // UI state
  loading = false;
  showModal = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  currentService: ServiceDirection | null = null;

  // Forms
  serviceForm!: FormGroup;
  searchForm!: FormGroup;

  // Pagination
  pageRequest: PageRequest = {
    page: 0,
    size: 10,
    sort: 'nom',
    direction: 'asc'
  };

  // Table columns
  displayedColumns = ['nom', 'code', 'responsable', 'email', 'actif', 'actions'];

  constructor(
      private serviceDirectionService: ServiceDirectionService,
      private formBuilder: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadServices();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.serviceForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      responsable: ['', [Validators.maxLength(100)]],
      email: ['', [Validators.email]],
      telephone: ['', [Validators.pattern(/^[+]?[0-9\s\-\(\)]+$/)]],
      actif: [true]
    });

    this.searchForm = this.formBuilder.group({
      query: ['']
    });
  }

  private setupSearch(): void {
    this.searchForm.get('query')?.valueChanges
        .pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        )
        .subscribe(query => {
          if (query && query.trim()) {
            this.searchServices(query.trim());
          } else {
            this.loadServices();
          }
        });
  }

  loadServices(): void {
    this.loading = true;
    this.serviceDirectionService.getServicesPaginated(this.pageRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.pagedServices = response;
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement des services:', error);
            this.loading = false;
          }
        });
  }

  searchServices(query: string): void {
    this.loading = true;
    this.serviceDirectionService.searchServices(query)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (services) => {
            this.pagedServices = {
              content: services,
              totalElements: services.length,
              totalPages: 1,
              size: services.length,
              number: 0,
              first: true,
              last: true,
              empty: services.length === 0
            };
            this.loading = false;
          },
          error: (error) => {
            console.error('Erreur lors de la recherche:', error);
            this.loading = false;
          }
        });
  }

  onPageChange(page: number): void {
    this.pageRequest.page = page;
    this.loadServices();
  }

  onPageSizeChange(size: number): void {
    this.pageRequest.size = size;
    this.pageRequest.page = 0;
    this.loadServices();
  }

  onSortChange(sort: string): void {
    if (this.pageRequest.sort === sort) {
      this.pageRequest.direction = this.pageRequest.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.pageRequest.sort = sort;
      this.pageRequest.direction = 'asc';
    }
    this.loadServices();
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.currentService = null;
    this.serviceForm.reset();
    this.serviceForm.patchValue({ actif: true });
    this.showModal = true;
  }

  openEditModal(service: ServiceDirection): void {
    this.modalMode = 'edit';
    this.currentService = service;
    this.serviceForm.patchValue(service);
    this.showModal = true;
  }

  openViewModal(service: ServiceDirection): void {
    this.modalMode = 'view';
    this.currentService = service;
    this.serviceForm.patchValue(service);
    this.serviceForm.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.serviceForm.enable();
    this.serviceForm.reset();
    this.currentService = null;
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.serviceForm.value;

    if (this.modalMode === 'create') {
      this.createService(formValue);
    } else if (this.modalMode === 'edit') {
      this.updateService(formValue);
    }
  }

  private createService(serviceData: ServiceDirectionCreateDto): void {
    this.loading = true;
    this.serviceDirectionService.createService(serviceData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (service) => {
            this.loadServices();
            this.closeModal();
            this.loading = false;
            // Vous pouvez ajouter une notification de succès ici
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.loading = false;
            // Vous pouvez ajouter une notification d'erreur ici
          }
        });
  }

  private updateService(serviceData: ServiceDirectionUpdateDto): void {
    if (!this.currentService?.id) return;

    this.loading = true;
    this.serviceDirectionService.updateService(this.currentService.id, serviceData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (service) => {
            this.loadServices();
            this.closeModal();
            this.loading = false;
            // Vous pouvez ajouter une notification de succès ici
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour:', error);
            this.loading = false;
            // Vous pouvez ajouter une notification d'erreur ici
          }
        });
  }

  deleteService(service: ServiceDirection): void {
    if (!service.id) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.serviceName }" ?`)) {
      this.loading = true;
      this.serviceDirectionService.deleteService(service.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadServices();
              this.loading = false;
              // Vous pouvez ajouter une notification de succès ici
            },
            error: (error) => {
              console.error('Erreur lors de la suppression:', error);
              this.loading = false;
              // Vous pouvez ajouter une notification d'erreur ici
            }
          });
    }
  }

  toggleServiceStatus(service: ServiceDirection): void {
    if (!service.id) return;

    this.serviceDirectionService.toggleServiceStatus(service.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadServices();
            // Vous pouvez ajouter une notification de succès ici
          },
          error: (error) => {
            console.error('Erreur lors du changement de statut:', error);
            // Vous pouvez ajouter une notification d'erreur ici
          }
        });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.serviceForm.controls).forEach(key => {
      const control = this.serviceForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.serviceForm.get(fieldName);
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
      if (control.errors['email']) {
        return 'Format email invalide';
      }
      if (control.errors['pattern']) {
        return 'Format invalide';
      }
    }
    return '';
  }

  get modalTitle(): string {
    switch (this.modalMode) {
      case 'create': return 'Créer un nouveau service';
      case 'edit': return 'Modifier le service';
      case 'view': return 'Détails du service';
      default: return '';
    }
  }

  protected readonly Math = Math;
}