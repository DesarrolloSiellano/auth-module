import { Injectable } from '@angular/core';
import { ModuleConfig, RoutesModuleConfig } from '../interfaces/module-config.interface';
import { ENVIROMENT } from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class GetConfigAppService {
  private readonly storageKey = ENVIROMENT.storageKey;

  getModule(): ModuleConfig  {
    const moduleJson = localStorage.getItem(this.storageKey);
    if (!moduleJson) return {} as ModuleConfig;
    try {
      return JSON.parse(moduleJson) as ModuleConfig;
    } catch (e) {
      console.error('Error parsing module JSON from localStorage', e);
      return {} as ModuleConfig;
    }
  }

  getRoutes(): RoutesModuleConfig[] {
    const module = this.getModule();
    if (module && module.routes) {
      return module.routes;
    }
    return [];
  }

  getUserName(): string {
    return localStorage.getItem('userName') || '';
  }
}
