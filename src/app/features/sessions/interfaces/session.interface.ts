export interface SessionItem {
  _id: string;
  user: string;
  idUser?: string;
  email: string;
  company: string;
  tenantId?: string;
  ip?: string;
  os?: string;
  os_version?: string;
  browser?: string;
  browser_version?: string;
  isActive: boolean;
  created?: string;
  lastActivityAt?: string;
}
