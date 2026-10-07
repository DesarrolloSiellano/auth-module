export type PolicyType = 'boolean' | 'number' | 'text' | 'select' | 'json';

export interface PolicyOption {
  label: string;
  value: unknown;
}

export interface PolicyDefinition {
  _id?: string;
  key: string;
  label: string;
  description?: string;
  group: string;
  type: PolicyType;
  defaultValue: unknown;
  options?: PolicyOption[];
  unit?: string;
  min?: number | null;
  max?: number | null;
  order?: number;
  isActive?: boolean;
  isSystem?: boolean;
}

export interface TenantConfig {
  _id?: string;
  tenantId: string;
  company: string;
  isActive: boolean;
  version: number;
  updatedAt?: string;
  values?: Record<string, unknown>;
  [key: string]: unknown;
}
