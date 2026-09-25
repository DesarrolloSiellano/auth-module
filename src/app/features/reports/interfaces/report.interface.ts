export type ReportFilterType = 'text' | 'date' | 'select' | 'boolean' | 'number';

export interface ReportFilterOption {
  label: string;
  value: unknown;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: ReportFilterType;
  options?: ReportFilterOption[];
  placeholder?: string;
}

export interface ReportCatalogItem {
  id: string;
  nombre: string;
  descripcion: string;
  category: string;
  filters: ReportFilter[];
  formats: string[];
}

export interface ReportColumn {
  key: string;
  label: string;
  type?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportChart {
  type: string;
  labels: string[];
  datasets: Array<Record<string, unknown>>;
}

export interface ReportPreview {
  id: string;
  nombre: string;
  descripcion: string;
  category: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary: ReportSummaryItem[];
  chart?: ReportChart | null;
  total: number;
  generatedBy: string;
  generatedAt: string;
}

export interface ReportData {
  id: string;
  nombre: string;
  descripcion: string;
  category: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary: ReportSummaryItem[];
  chart?: ReportChart | null;
  total: number;
  truncated: boolean;
  generatedBy: string;
  generatedAt: string;
}

export interface ApiResponse<T> {
  message: string;
  statusCode?: number;
  status?: string;
  data: T;
  meta: Record<string, unknown>;
}

export interface ReportDownload {
  blob: Blob;
  filename: string;
}

export interface AuditItem {
  _id: string;
  action: string;
  category: string;
  status: string;
  email?: string;
  userId?: string;
  company?: string;
  ip?: string;
  browser?: string;
  os?: string;
  device?: string;
  createdAt: string;
}
