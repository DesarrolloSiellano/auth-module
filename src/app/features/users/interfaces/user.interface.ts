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
  company: string;
  tenantId: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  modules: Module[];
  roles: Rol[];
  permissions: Permission[];
}
