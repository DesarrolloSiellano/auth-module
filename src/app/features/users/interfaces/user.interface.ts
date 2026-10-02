import { Module } from "../../modules/interfaces/module.interface";
import { Permission } from "../../permissions/interfaces/permission.interface";
import { Rol } from "../../roles/interface/rol.interface";

export interface User {
  _id: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  created: Date;
  modified: Date;
  isActived: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isNewUser: boolean;
  mustChangePassword?: boolean;
  isTrial?: boolean;
  trialStartedAt?: Date;
  trialEndsAt?: Date | null;
  isBlocked?: boolean;
  blockReason?: string;
  blockedUntil?: Date;
  failedLoginAttempts?: number;
  deletedAt?: Date;
  invitedAt?: Date;
  tags?: string[];
  groups?: string[];
  customFields?: Record<string, unknown>;
  company: string;
  tenantId: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  modules: Module[];
  roles: Rol[];
  permissions: Permission[];
}

export type BulkUserAction =
  | 'activate'
  | 'deactivate'
  | 'resetPassword'
  | 'assignRoles'
  | 'assignModules'
  | 'revokeSessions'
  | 'delete';

export interface SavedFilter {
  _id: string;
  name: string;
  module: string;
  filters: Record<string, unknown>;
  isShared: boolean;
}

export interface CustomFieldDefinition {
  _id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: { label: string; value: unknown }[];
  order: number;
  isActive: boolean;
}

export type MassiveUserStatus = 'created' | 'existing' | 'failed';

export interface MassiveUserResult {
  row: number;
  name: string;
  email: string;
  status: MassiveUserStatus;
  message: string;
}

export interface MassiveUploadReport {
  total: number;
  processed: number;
  created: number;
  existing: number;
  failed: number;
  results: MassiveUserResult[];
}

export interface MassivePreviewRow {
  row: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  usuario: string;
  empresa: string;
  tenantId: string;
  status: 'OK' | 'ERROR';
  errors: string;
}

export interface MassiveReportMessage {
  severity: 'success' | 'warn' | 'error' | 'info';
  detail: string;
}

export interface AvailabilityResult {
  emailExists: boolean;
  usernameExists: boolean;
}

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken';
