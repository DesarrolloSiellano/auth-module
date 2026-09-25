import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, defer, map } from 'rxjs';
import { JwtPayload } from '../../../shared/interfaces/jwt-payload.interface';
import { ProfileData } from '../../../shared/interfaces/profile.interface';
import { ModuleConfig } from '../../../shared/interfaces/module-config.interface';
import { SessionStore } from '../../../core/services/session.store';
import { NotificationService } from '../../../core/services/notification.service';
import { Auth } from './auth';
import { ENVIROMENT } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProcessAuthData {
  private readonly auth = inject(Auth);
  private readonly session = inject(SessionStore);
  private readonly notification = inject(NotificationService);

  proccesAuthData(token: string, refreshToken?: string): Observable<void> {
    // `defer` garantiza que la suscripción interna (HTTP getProfile) se
    // cancele si el consumidor se desuscribe, evitando fugas.
    return defer(() => {
      const decoded = jwtDecode<JwtPayload>(token);
      this.session.setTokens(token, refreshToken);
      this.saveIdentity(decoded);

      return this.auth.getProfile().pipe(
        map((profile) => {
          this.saveProfile(profile.data);
          if (!this.hasModuleAccess(profile.data.modules)) {
            this.notification.error(
              'Sin permisos',
              'No tienes permisos para acceder a este módulo',
            );
            throw new Error('No tienes permisos para acceder a este módulo');
          }
          return undefined;
        }),
      );
    });
  }

  private saveIdentity(decoded: JwtPayload): void {
    localStorage.setItem('company', decoded.company);
    localStorage.setItem('exp', String(decoded.exp));
    localStorage.setItem('iat', String(decoded.iat));
    localStorage.setItem('tenantId', String(decoded.tenantId));
    localStorage.setItem('isActive', String(decoded.isActived));
    localStorage.setItem('isSuperAdmin', String(decoded.isSuperAdmin));
    localStorage.setItem('userName', decoded.name + ' ' + decoded.lastName);
    localStorage.setItem('email', decoded.email);
    localStorage.setItem('_id', decoded._id);
  }

  private saveProfile(profile: ProfileData): void {
    const user = profile.user;

    localStorage.setItem('isAdmin', String(user.isAdmin));
    localStorage.setItem('isNewUser', String(user.isNewUser));
    localStorage.setItem('userName', user.name + ' ' + user.lastName);

    this.saveModulesToLocalStorage(profile.modules);
    localStorage.setItem('roles', JSON.stringify(profile.roles));
    localStorage.setItem('permissions', JSON.stringify(profile.permissions));
  }

  saveModulesToLocalStorage(modules: ModuleConfig[]): void {
    const module = modules.find((mod) => mod.name === ENVIROMENT.storageKey);
    if (module) {
      localStorage.setItem(module.name, JSON.stringify(module));
    }
  }

  hasModuleAccess(
    modules: Pick<ModuleConfig, 'name' | 'isActive'>[],
  ): boolean {
    return modules.some(
      (mod) => mod.name === ENVIROMENT.storageKey && mod.isActive === true,
    );
  }
}
