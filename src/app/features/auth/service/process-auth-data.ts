import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';
import { JwtPayload } from '../../../shared/interfaces/jwt-payload.interface';
import { ProfileData } from '../../../shared/interfaces/profile.interface';
import { SessionStore } from '../../../core/services/session.store';
import { NotificationService } from '../../../core/services/notification.service';
import { Auth } from './auth';
import { ENVIROMENT } from '../../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class ProcessAuthData {
  constructor(
    private auth: Auth,
    private session: SessionStore,
    private notification: NotificationService,
  ) {}

  proccesAuthData(token: string, refreshToken?: string): Observable<void> {
    const decoded = jwtDecode<JwtPayload>(token);

    this.session.setTokens(token, refreshToken);
    this.saveIdentity(decoded);

    return new Observable<void>((subscriber) => {
      this.auth.getProfile().subscribe({
        next: (profile) => {
          try {
            this.saveProfile(profile.data);

            if (!this.hasModuleAccess(profile.data.modules)) {
              this.notification.error(
                'Sin permisos',
                'No tienes permisos para acceder a este módulo',
              );
              subscriber.error(
                new Error('No tienes permisos para acceder a este módulo'),
              );
              return;
            }

            subscriber.next();
            subscriber.complete();
          } catch (error) {
            console.error(error);
            subscriber.error(error);
          }
        },
        error: (err) => {
          console.error(err);
          subscriber.error(err);
        },
      });
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

  saveModulesToLocalStorage(modules: any[]): void {
    const module = modules.find((mod) => mod.name === ENVIROMENT.storageKey);
    if (module) {
      localStorage.setItem(module.name, JSON.stringify(module));
    }
  }

  hasModuleAccess(modules: any[]): boolean {
    return modules.some(
      (mod) => mod.name === ENVIROMENT.storageKey && mod.isActive === true,
    );
  }
}
