import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {Asset, AssetCategory, AssetStatus} from "../../shared/models/asset.model";
import {ServiceDirection} from "../../shared/models/service-direction.model";
import {AssetService} from "../../core/services/asset.service";
import {ServiceDirectionService} from "../../core/services/service-direction.service";
import {FormsModule} from "@angular/forms";
import {CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf} from "@angular/common";


@Component({
  selector: 'app-asset-management',
  templateUrl: './asset-management.component.html',
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    CurrencyPipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./asset-management.component.scss']
})
export class AssetManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  paginatedAssets: Asset[] = [];
  services: ServiceDirection[] = [];

  // Modal
  showAssetModal = false;
  isEditMode = false;
  currentAsset: Partial<Asset> = {};
  saving = false;

  // Filters
  selectedService = '';
  selectedStatus = '';
  selectedCategory = '';
  searchTerm = '';

  // Selection
  selectedAssets = new Set<number>();

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Statistics
  totalAssets = 0;
  activeAssets = 0;
  maintenanceAssets = 0;
  brokenAssets = 0;

  // Math reference for template
  Math = Math;

  constructor(
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

  private initializeComponent(): void {
    this.loadServices();
    this.loadAssets();
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

  private loadAssets(): void {
    this.assetService.getAllAssets()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (assets) => {
            this.assets = assets;
            this.applyFilters();
            this.calculateStatistics();
          },
          error: (error) => {
            console.error('Erreur lors du chargement des actifs:', error);
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
    let filtered = [...this.assets];

    // Filter by service
    if (this.selectedService) {
      filtered = filtered.filter(asset =>
          asset.service?.id?.toString() === this.selectedService
      );
    }

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(asset => asset.etat === this.selectedStatus);
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(asset => asset.categorie === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
          asset.nom ?.toLowerCase().includes(searchLower) ||
          asset.reference?.toLowerCase().includes(searchLower) ||
          asset.description?.toLowerCase().includes(searchLower) ||
          asset.numeroSerie?.toLowerCase().includes(searchLower)
      );
    }

    this.filteredAssets = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.selectedService = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredAssets.sort((a, b) => {
      const aValue = this.getFieldValue(a, field);
      const bValue = this.getFieldValue(b, field);

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.updatePagination();
  }

  private getFieldValue(asset: Asset, field: string): any {
    switch (field) {
      case 'nom':
        return asset.nom ?.toLowerCase() || '';
      case 'reference':
        return asset.reference?.toLowerCase() || '';
      case 'dateAcquisition':
        return asset.dateAcquisition ? new Date(asset.dateAcquisition) : new Date(0);
      default:
        return '';
    }
  }

  // Selection
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedAssets.clear();
    } else {
      this.paginatedAssets.forEach(asset => {
        if (asset.id) {
          this.selectedAssets.add(asset.id);
        }
      });
    }
  }

  toggleAssetSelection(assetId: number): void {
    if (this.selectedAssets.has(assetId)) {
      this.selectedAssets.delete(assetId);
    } else {
      this.selectedAssets.add(assetId);
    }
  }

  isAllSelected(): boolean {
    return this.paginatedAssets.length > 0 &&
        this.paginatedAssets.every(asset => asset.id && this.selectedAssets.has(asset.id));
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAssets.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedAssets = this.filteredAssets.slice(startIndex, endIndex);
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

  // Statistics
  private calculateStatistics(): void {
    this.totalAssets = this.assets.length;
    this.activeAssets = this.assets.filter(asset => asset.etat === AssetStatus.EN_SERVICE).length;
    this.maintenanceAssets = this.assets.filter(asset => asset.etat === AssetStatus.EN_MAINTENANCE).length;
    this.brokenAssets = this.assets.filter(asset => asset.etat === AssetStatus.EN_PANNE).length;
  }

  // Modal Management
  openAssetModal(): void {
    this.isEditMode = false;
    this.currentAsset = {
      etat: AssetStatus.EN_SERVICE,
      categorie: AssetCategory.INFORMATIQUE
    };
    this.showAssetModal = true;
  }

  closeAssetModal(): void {
    this.showAssetModal = false;
    this.currentAsset = {};
    this.saving = false;
  }

  // Asset CRUD Operations
  saveAsset(): void {
    this.saving = true;

    if (this.isEditMode && this.currentAsset.id) {
      this.updateAsset();
    } else {
      this.createAsset();
    }
  }

  private createAsset(): void {
    const assetData = this.prepareAssetData();

    this.assetService.createAsset(assetData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (asset) => {
            this.assets.push(asset);
            this.applyFilters();
            this.calculateStatistics();
            this.closeAssetModal();
            this.showSuccessMessage('Actif créé avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.showErrorMessage('Erreur lors de la création de l\'actif');
            this.saving = false;
          }
        });
  }

  private updateAsset(): void {
    const assetData = this.prepareAssetData();

    this.assetService.updateAsset(this.currentAsset.id!, assetData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (asset) => {
            const index = this.assets.findIndex(a => a.id === asset.id);
            if (index !== -1) {
              this.assets[index] = asset;
            }
            this.applyFilters();
            this.calculateStatistics();
            this.closeAssetModal();
            this.showSuccessMessage('Actif modifié avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.showErrorMessage('Erreur lors de la modification de l\'actif');
            this.saving = false;
          }
        });
  }

  private prepareAssetData(): any {
    const selectedService = this.services.find(s => s.id?.toString() === this.currentAsset.serviceId?.toString());

    return {
      ...this.currentAsset,
      service: selectedService,
      dateAcquisition: this.currentAsset.dateAcquisition ?
          new Date(this.currentAsset.dateAcquisition).toISOString().split('T')[0] : null
    };
  }

  editAsset(asset: Asset): void {
    this.isEditMode = true;
    this.currentAsset = {
      ...asset,
      serviceId: asset.service?.id,
      dateAcquisition: asset.dateAcquisition ?
          new Date(asset.dateAcquisition).toISOString().split('T')[0] : undefined
    };
    this.showAssetModal = true;
  }

  viewAsset(asset: Asset): void {
    // Implement asset detail view
    console.log('Viewing asset:', asset);
  }

  deleteAsset(asset: Asset): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'actif "${asset.nom }" ?`)) {
      this.assetService.deleteAsset(asset.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.assets = this.assets.filter(a => a.id !== asset.id);
              this.selectedAssets.delete(asset.id!);
              this.applyFilters();
              this.calculateStatistics();
              this.showSuccessMessage('Actif supprimé avec succès');
            },
            error: (error) => {
              console.error('Erreur lors de la suppression:', error);
              this.showErrorMessage('Erreur lors de la suppression de l\'actif');
            }
          });
    }
  }

  // Export functionality
  exportAssets(): void {
    this.assetService.exportAssets(this.filteredAssets)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `actifs_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          },
          error: (error) => {
            console.error('Erreur lors de l\'export:', error);
            this.showErrorMessage('Erreur lors de l\'export');
          }
        });
  }

  // Helper methods for template
  trackByAssetId(index: number, asset: Asset): number {
    return asset.id || index;
  }

  getCategoryLabel(category: AssetCategory): string {
    const labels = {
      [AssetCategory.TOPOGRAPHIQUE]: 'Matériel Topographique',
      [AssetCategory.INFORMATIQUE]: 'Matériel Informatique',
      [AssetCategory.VEHICULE]: 'Véhicules',
      [AssetCategory.MOBILIER]: 'Mobilier',
      [AssetCategory.AUTRE]: 'Autre'
    };
    return labels[category] || category;
  }

  getStatusLabel(status: AssetStatus): string {
    const labels = {
      [AssetStatus.EN_SERVICE]: 'En service',
      [AssetStatus.EN_PANNE]: 'En panne',
      [AssetStatus.EN_MAINTENANCE]: 'En maintenance',
      [AssetStatus.HORS_USAGE]: 'Hors d\'usage'
    };
    return labels[status] || status;
  }

  getAssetIcon(category: AssetCategory): string {
    const icons = {
      [AssetCategory.TOPOGRAPHIQUE]: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      [AssetCategory.INFORMATIQUE]: 'M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z',
      [AssetCategory.VEHICULE]: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
      [AssetCategory.MOBILIER]: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      [AssetCategory.AUTRE]: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z'
    };
    return icons[category] || icons[AssetCategory.AUTRE];
  }

  // Message handling
  private showSuccessMessage(message: string): void {
    // Implement toast/snackbar notification
    console.log('Success:', message);
  }

  private showErrorMessage(message: string): void {
    // Implement toast/snackbar notification
    console.error('Error:', message);
  }
}