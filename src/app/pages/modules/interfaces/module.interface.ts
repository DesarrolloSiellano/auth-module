export interface Module {
  name: string;
  description: string;
  created: Date;
  modified?: Date;
  dateCreated?: String;
  hourCreated?: String;
  dateModified?: String;
  hourModified?: String;
  idUserModified?: String;
  isActive: boolean;
  isSystemModule: boolean;
  router: Route[];
}

export interface Route {
  name: string;
  path: string;
  icon: string;
  isActive: boolean;
  children?: Route[]; // Opcional, arreglo de rutas hijas
}
