import { Permission } from '../../pages/permissions/interfaces/permission.interface';
import { Rol } from '../../pages/roles/interface/rol.interface';

export interface JwtPayload {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  username: string;
  date_joined: string;
  isActived: boolean;
  isAdmin: boolean;
  company: string;
  modules: any[];
  roles: Rol[];
  permissions: Permission[];
  iat: number;
  exp: number;
}
