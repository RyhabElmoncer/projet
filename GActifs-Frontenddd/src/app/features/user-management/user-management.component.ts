import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule} from '@angular/forms';
import {CreateUserRequest, UpdateUserRequest, User, UserRole} from "../../shared/models/User";
import {UserService} from "../../core/services/UserService";
import {AuthService} from "../../core/services/auth.service";
import {Observable} from "rxjs";


@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-management.component.html',



  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  stats: any = null;
  loading = false;
  submitting = false;

  // Modals
  showModal = false;
  showDeleteModal = false;
  isEditMode = false;

  // Forms
  userForm: FormGroup;
  currentUser: User | null = null;
  userToDelete: User | null = null;

  // Filters
  searchTerm = '';
  selectedRole = '';
  statusFilter = '';

  // Permissions
  canManageUsers = false;
  currentUserId: string | null = null;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType = 'success';
  toastIcon = 'bi-check-circle';

  constructor(
      private userService: UserService,
      private authService: AuthService,
      private fb: FormBuilder
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.loadUsers();
    this.loadStats();
  }

  private createUserForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['', [Validators.required]]
    });
  }

  private checkPermissions(): void {
    this.canManageUsers = this.userService.hasPermission('canManageUsers');
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;
  }

  private loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.showToastMessage('Erreur lors du chargement des utilisateurs', 'error');
        this.loading = false;
      }
    });
  }

  private loadStats(): void {
    this.userService.getUserStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  // Filtres et recherche
  onSearch(): void {
    this.applyFilters();
  }

  onRoleFilter(): void {
    this.applyFilters();
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.users];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
          user.firstName.toLowerCase().includes(term) ||
          user.lastName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Filtre par rôle
    if (this.selectedRole) {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    // Filtre par statut
    if (this.statusFilter) {
      const isActive = this.statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    this.filteredUsers = filtered;
  }

  // Gestion des modals
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentUser = null;
    this.userForm = this.createUserForm();
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.currentUser = user;
    this.userForm = this.createUserForm();

    // Pré-remplir le formulaire
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });

    // Supprimer la validation du mot de passe en mode édition
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.currentUser = null;
    this.userForm.reset();
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  // Actions CRUD
  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.submitting = true;

    if (this.isEditMode && this.currentUser) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    const userData: CreateUserRequest = this.userForm.value;

    this.userService.createUser(userData).subscribe({
      next: (user) => {
        this.users.push(user);
        this.applyFilters();
        this.loadStats();
        this.closeModal();
        this.showToastMessage('Utilisateur créé avec succès', 'success');
        this.submitting = false;
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        this.showToastMessage('Erreur lors de la création de l\'utilisateur', 'error');
        this.submitting = false;
      }
    });
  }

  private updateUser(): void {
    if (!this.currentUser) return;

    const userData: UpdateUserRequest = {
      firstName: this.userForm.get('firstName')?.value,
      lastName: this.userForm.get('lastName')?.value,
      email: this.userForm.get('email')?.value,
      role: this.userForm.get('role')?.value
    };

    this.userService.updateUser(this.currentUser.id!, userData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.applyFilters();
        }
        this.closeModal();
        this.showToastMessage('Utilisateur modifié avec succès', 'success');
        this.submitting = false;
      },
      error: (error) => {
        console.error('Erreur lors de la modification:', error);
        this.showToastMessage('Erreur lors de la modification de l\'utilisateur', 'error');
        this.submitting = false;
      }
    });
  }

  deleteUser(): void {
    if (!this.userToDelete) return;

    this.submitting = true;

    this.userService.deleteUser(this.userToDelete.id!).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.applyFilters();
        this.loadStats();
        this.closeDeleteModal();
        this.showToastMessage('Utilisateur supprimé avec succès', 'success');
        this.submitting = false;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.showToastMessage('Erreur lors de la suppression de l\'utilisateur', 'error');
        this.submitting = false;
      }
    });
  }

  toggleUserStatus(user: User): void {
    if (!user.id) return; // Sécurité si id est undefined

    const request$: Observable<User> = user.isActive
        ? this.userService.deactivateUser(user.id)
        : this.userService.activateUser(user.id);

    request$.subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.applyFilters();
        }
        const status = updatedUser.isActive ? 'activé' : 'désactivé';
        this.showToastMessage(`Utilisateur ${status} avec succès`, 'success');
      },
      error: (error) => {
        console.error('Erreur lors du changement de statut:', error);
        this.showToastMessage('Erreur lors du changement de statut', 'error');
      }
    });
  }

  resetUserPassword(user: User): void {
    if (!confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    this.userService.resetPassword(user.id!).subscribe({
      next: (response) => {
        this.showToastMessage(`Mot de passe réinitialisé. Nouveau mot de passe temporaire : ${response.temporaryPassword}`, 'info');
      },
      error: (error) => {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        this.showToastMessage('Erreur lors de la réinitialisation du mot de passe', 'error');
      }
    });
  }

  // Utilitaires
  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'role-admin';
      case UserRole.RESPONSABLE:
        return 'role-responsable';
      case UserRole.TECHNICIEN:
        return 'role-technicien';
      default:
        return '';
    }
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.RESPONSABLE:
        return 'Responsable';
      case UserRole.TECHNICIEN:
        return 'Technicien';
      default:
        return role;
    }
  }

  getSelectedRolePermissions(): string[] {
    const role = this.userForm.get('role')?.value as UserRole;
    if (!role) return [];

    const permissions = this.userService.getUserPermissions(role);
    const permissionLabels: string[] = [];

    if (permissions.canManageUsers) permissionLabels.push('Gestion des utilisateurs');
    if (permissions.canManageAssets) permissionLabels.push('Gestion des actifs');
    if (permissions.canManageDirections) permissionLabels.push('Gestion des directions');
    if (permissions.canViewReports) permissionLabels.push('Consultation des rapports');
    if (permissions.canEditSettings) permissionLabels.push('Modification des paramètres');

    return permissionLabels.length > 0 ? permissionLabels : ['Aucune permission spéciale'];
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;

    switch (type) {
      case 'success':
        this.toastIcon = 'bi-check-circle';
        break;
      case 'error':
        this.toastIcon = 'bi-exclamation-circle';
        break;
      case 'info':
        this.toastIcon = 'bi-info-circle';
        break;
    }

    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}