export interface ModuleConfig {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystemModule: boolean;
  routes: RoutesModuleConfig[]
}


export interface RoutesModuleConfig {
  _id: string;
  path: string;
  initPath: string;
  name: string;
  icon: string;
  isActive: boolean;
  children?: RoutesModuleConfig[]
}
