
export interface User {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    RESPONSABLE = 'RESPONSABLE',
    TECHNICIEN = 'TECHNICIEN'
}

export interface UserPermissions {
    canManageUsers: boolean;
    canManageAssets: boolean;
    canManageDirections: boolean;
    canViewReports: boolean;
    canEditSettings: boolean;
}
