import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import {Category} from "../../shared/models/Category";
import {CategoryService} from "../../core/services/CategoryService";

@Component({
  selector: 'app-category-management',
  templateUrl: './category-management.component.html',
  imports: [
    FormsModule,
    NgClass,
    DatePipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  paginatedCategories: Category[] = [];

  // Modal
  showCategoryModal = false;
  isEditMode = false;
  currentCategory: Partial<Category> = {};
  saving = false;

  // Filters
  selectedStatus = '';
  searchTerm = '';

  // Selection
  selectedCategories = new Set<number>();

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Statistics
  totalCategories = 0;
  activeCategories = 0;
  inactiveCategories = 0;
  categoriesWithAssets = 0;

  // Math reference for template
  Math = Math;

  // Available colors for categories
  availableColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Available icons for categories
  availableIcons = [
    { name: 'Topographique', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { name: 'Informatique', path: 'M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z' },
    { name: 'Véhicule', path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z' },
    { name: 'Mobilier', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { name: 'Défaut', path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' }
  ];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.loadCategories();
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
  private loadCategories(): void {
    this.categoryService.getAllCategories()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (categories) => {
            this.categories = categories;
            this.applyFilters();
            this.calculateStatistics();
          },
          error: (error) => {
            console.error('Erreur lors du chargement des catégories:', error);
            this.showErrorMessage('Erreur lors du chargement des catégories');
          }
        });
  }

  private loadStatistics(): void {
    this.categoryService.getCategoryStatistics()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => {
            this.totalCategories = stats.total;
            this.activeCategories = stats.active;
            this.inactiveCategories = stats.inactive;
            this.categoriesWithAssets = stats.withAssets;
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
    let filtered = [...this.categories];

    // Filter by status
    if (this.selectedStatus) {
      const isActive = this.selectedStatus === 'ACTIF';
      filtered = filtered.filter(category => category.actif === isActive);
    }

    // Filter by search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(category =>
          category.nom?.toLowerCase().includes(searchLower) ||
          category.code?.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower)
      );
    }

    this.filteredCategories = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.selectedStatus = '';
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

    this.filteredCategories.sort((a, b) => {
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

  private getFieldValue(category: Category, field: string): any {
    switch (field) {
      case 'nom':
        return category.nom?.toLowerCase() || '';
      case 'code':
        return category.code?.toLowerCase() || '';
      case 'dateCreation':
        return category.dateCreation ? new Date(category.dateCreation) : new Date(0);
      default:
        return '';
    }
  }

  // Selection
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedCategories.clear();
    } else {
      this.paginatedCategories.forEach(category => {
        if (category.id) {
          this.selectedCategories.add(category.id);
        }
      });
    }
  }

  toggleCategorySelection(categoryId: number): void {
    if (this.selectedCategories.has(categoryId)) {
      this.selectedCategories.delete(categoryId);
    } else {
      this.selectedCategories.add(categoryId);
    }
  }

  isAllSelected(): boolean {
    return this.paginatedCategories.length > 0 &&
        this.paginatedCategories.every(category => category.id && this.selectedCategories.has(category.id));
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCategories = this.filteredCategories.slice(startIndex, endIndex);
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
    this.totalCategories = this.categories.length;
    this.activeCategories = this.categories.filter(category => category.actif).length;
    this.inactiveCategories = this.categories.filter(category => !category.actif).length;
    this.categoriesWithAssets = this.categories.filter(category => (category.nombreActifs || 0) > 0).length;
  }

  // Modal Management
  openCategoryModal(): void {
    this.isEditMode = false;
    this.currentCategory = {
      actif: true,
      couleur: this.availableColors[0],
      icone: this.availableIcons[0].path
    };
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.currentCategory = {};
    this.saving = false;
  }

  // Category CRUD Operations
  saveCategory(): void {
    this.saving = true;

    if (this.isEditMode && this.currentCategory.id) {
      this.updateCategory();
    } else {
      this.createCategory();
    }
  }

  private async createCategory(): Promise<void> {
    // Check if code exists
    if (this.currentCategory.code) {
      try {
        const codeExists = await this.categoryService.checkCodeExists(this.currentCategory.code).toPromise();
        if (codeExists) {
          this.showErrorMessage('Ce code existe déjà');
          this.saving = false;
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du code:', error);
      }
    }

    const categoryData = {
      nom: this.currentCategory.nom!,
      description: this.currentCategory.description,
      code: this.currentCategory.code!,
      couleur: this.currentCategory.couleur,
      icone: this.currentCategory.icone,
      actif: this.currentCategory.actif!
    };

    this.categoryService.createCategory(categoryData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (category) => {
            this.categories.push(category);
            this.applyFilters();
            this.calculateStatistics();
            this.loadStatistics();
            this.closeCategoryModal();
            this.showSuccessMessage('Catégorie créée avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.showErrorMessage(error.message || 'Erreur lors de la création de la catégorie');
            this.saving = false;
          }
        });
  }

  private async updateCategory(): Promise<void> {
    // Check if code exists (excluding current category)
    if (this.currentCategory.code) {
      try {
        const codeExists = await this.categoryService.checkCodeExists(
            this.currentCategory.code,
            this.currentCategory.id
        ).toPromise();
        if (codeExists) {
          this.showErrorMessage('Ce code existe déjà');
          this.saving = false;
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du code:', error);
      }
    }

    const categoryData = {
      nom: this.currentCategory.nom,
      description: this.currentCategory.description,
      code: this.currentCategory.code,
      couleur: this.currentCategory.couleur,
      icone: this.currentCategory.icone,
      actif: this.currentCategory.actif
    };

    this.categoryService.updateCategory(this.currentCategory.id!, categoryData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (category) => {
            const index = this.categories.findIndex(c => c.id === category.id);
            if (index !== -1) {
              this.categories[index] = category;
            }
            this.applyFilters();
            this.calculateStatistics();
            this.loadStatistics();
            this.closeCategoryModal();
            this.showSuccessMessage('Catégorie modifiée avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.showErrorMessage(error.message || 'Erreur lors de la modification de la catégorie');
            this.saving = false;
          }
        });
  }

  editCategory(category: Category): void {
    this.isEditMode = true;
    this.currentCategory = { ...category };
    this.showCategoryModal = true;
  }

  viewCategory(category: Category): void {
    // Implement category detail view
    console.log('Viewing category:', category);
  }

  deleteCategory(category: Category): void {
    const hasAssets = (category.nombreActifs || 0) > 0;
    const confirmMessage = hasAssets
        ? `La catégorie "${category.nom}" contient ${category.nombreActifs} actif(s). Êtes-vous sûr de vouloir la supprimer ?`
        : `Êtes-vous sûr de vouloir supprimer la catégorie "${category.nom}" ?`;

    if (confirm(confirmMessage)) {
      this.categoryService.deleteCategory(category.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.categories = this.categories.filter(c => c.id !== category.id);
              this.selectedCategories.delete(category.id!);
              this.applyFilters();
              this.calculateStatistics();
              this.loadStatistics();
              this.showSuccessMessage('Catégorie supprimée avec succès');
            },
            error: (error) => {
              console.error('Erreur lors de la suppression:', error);
              this.showErrorMessage(error.message || 'Erreur lors de la suppression de la catégorie');
            }
          });
    }
  }

  toggleCategoryStatus(category: Category): void {
    this.categoryService.toggleCategoryStatus(category.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedCategory) => {
            const index = this.categories.findIndex(c => c.id === updatedCategory.id);
            if (index !== -1) {
              this.categories[index] = updatedCategory;
            }
            this.applyFilters();
            this.calculateStatistics();
            this.loadStatistics();
            const status = updatedCategory.actif ? 'activée' : 'désactivée';
            this.showSuccessMessage(`Catégorie ${status} avec succès`);
          },
          error: (error) => {
            console.error('Erreur lors du changement de statut:', error);
            this.showErrorMessage('Erreur lors du changement de statut');
          }
        });
  }

  // Export functionality
  exportCategories(): void {
    this.categoryService.exportCategories(this.filteredCategories)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `categories_${new Date().toISOString().split('T')[0]}.xlsx`;
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
  trackByCategoryId(index: number, category: Category): number {
    return category.id || index;
  }

  getStatusLabel(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  generateCode(): void {
    if (this.currentCategory.nom) {
      // Generate code from name (uppercase, replace spaces and accents)
      const code = this.currentCategory.nom
          .toUpperCase()
          .replace(/[ÀÁÂÃÄÅ]/g, 'A')
          .replace(/[ÈÉÊË]/g, 'E')
          .replace(/[ÌÍÎÏ]/g, 'I')
          .replace(/[ÒÓÔÕÖ]/g, 'O')
          .replace(/[ÙÚÛÜ]/g, 'U')
          .replace(/[ÇÑ]/g, 'C')
          .replace(/[^A-Z0-9]/g, '_')
          .substring(0, 10);

      this.currentCategory.code = code;
    }
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