export interface Module {
  _id?: string;
  name: string;
  description: string;
  created: Date;
  modified?: Date;
  dateCreated?: string;
  hourCreated?: string;
  dateModified?: string;
  hourModified?: string;
  idUserModified?: string;
  isActive: boolean;
  isSystemModule?: boolean;
  routes: Route[];
}

export interface Route {
  name: string;
  path: string;
  initPath: string;
  icon: string;
  isActive: boolean;
  children?: Route[]; // Opcional, arreglo de rutas hijas
}
