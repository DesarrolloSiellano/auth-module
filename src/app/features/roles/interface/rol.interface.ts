import { Permission } from "../../permissions/interfaces/permission.interface";

export interface Rol {
  _id: string;
  name: string;
  codeRol: string;
  description: string;
  created: Date;
  modiefied: Date;
  isActive: boolean;
  dateCreated?: string;
  hourCreated?: string;
  dateModified?: string;
  hourModified?: string;
  idUserModified?: string;
  isInheritPermissions: boolean;
  permissions: Permission[]
}
