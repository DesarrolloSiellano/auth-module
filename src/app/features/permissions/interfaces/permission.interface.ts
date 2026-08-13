import { Rol } from "../../roles/interface/rol.interface";

export interface Permission {
  _id: string;
  name: string;
  description: string;
  action: string; // `create`, `read`, `update`, `delete`, etc.
  resource: string; // `usuarios`, `posts`, `comentarios`, etc.
  resourceId?: string; // Opcional, si aplica al recurso específico
  type: string; // `global` o `role-based`
  rol?: Rol; // Opcional, si es `role-based`
  created: Date;
  modified: Date;
  dateCreated?: string;
  hourCreated?: string;
  dateModified?: string;
  hourModified?: string;
  idUserModified?: string;
  isActive: boolean;
}
