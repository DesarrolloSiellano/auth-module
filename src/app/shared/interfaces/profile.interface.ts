import { ModuleConfig } from './module-config.interface';
import { Permission } from '../../features/permissions/interfaces/permission.interface';
import { Rol } from '../../features/roles/interface/rol.interface';

export interface ProfileUser {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  company: string;
  tenantId: string;
  isActived: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isNewUser: boolean;
}

export interface ProfileData {
  user: ProfileUser;
  modules: ModuleConfig[];
  roles: Rol[];
  permissions: Permission[];
}

export interface ProfileResponse {
  statusCode: number;
  message: string;
  status?: string;
  data: ProfileData;
  meta: {
    totalData: number;
    id: string;
  };
}
