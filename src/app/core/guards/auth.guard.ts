import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { Observable } from 'rxjs';
import { ModuleConfig } from '../../shared/interfaces/module-config.interface';
import { Rol } from '../../features/roles/interface/rol.interface';
import { Auth } from '../../features/auth/service/auth';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';
import { SessionStore } from '../services/session.store';
import { ENVIROMENT } from '../../../enviroments/enviroment';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(Auth);
  const processAuthData = inject(ProcessAuthData);
  const session = inject(SessionStore);

  const token = session.getAccessToken();
  const refreshToken = session.getRefreshToken();
  const currentTime = Math.floor(Date.now() / 1000);

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded = session.getClaims();
    if (!decoded) {
      session.clear();
      router.navigate(['/login']);
      return false;
    }

    if (!decoded.isActived) {
      router.navigate(['/login']);
      return false;
    }

    // Si el access token ha expirado, intentar refrescarlo proactivamente
    if (decoded.exp && decoded.exp < currentTime) {
      if (refreshToken) {
        console.warn(
          '🔑 El token ha expirado. Intentando refrescarlo de manera asíncrona en la guardia...',
        );
        return authService.refreshToken(refreshToken).pipe(
          switchMap((res) => {
            const newToken = res.accessToken;
            console.info('✅ Token refrescado exitosamente en la guardia.');
            return processAuthData.proccesAuthData(newToken, refreshToken).pipe(
              map(() => true),
              catchError(() => {
                session.clear();
                router.navigate(['/login']);
                return of(false);
              }),
            );
          }),
          catchError((err) => {
            console.error('❌ Falló el refresco del token en la guardia.', err);
            session.clear();
            router.navigate(['/login']);
            return of(false);
          }),
        );
      } else {
        router.navigate(['/login']);
        return false;
      }
    }

    return checkAuthorization(router, processAuthData, session);
  } catch (error) {
    console.error(
      '❌ Error de decodificación o validación del token en la guardia:',
      error,
    );
    session.clear();
    router.navigate(['/login']);
    return false;
  }
};

function checkAuthorization(
  router: Router,
  processAuthData: ProcessAuthData,
  session: SessionStore,
): boolean | Observable<boolean> {
  if (hasAuthorization()) {
    return true;
  }

  // Si aún no hay perfil/autorización en localStorage, cargarla desde el backend
  return processAuthData
    .proccesAuthData(session.getAccessToken()!, session.getRefreshToken() || undefined)
    .pipe(
      map(() => {
        if (hasAuthorization()) {
          return true;
        }
        router.navigate(['/login']);
        return false;
      }),
      catchError(() => {
        session.clear();
        router.navigate(['/login']);
        return of(false);
      }),
    );
}

function hasAuthorization(): boolean {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!isAdmin) {
    return false;
  }

  const moduleJson = localStorage.getItem(ENVIROMENT.storageKey);
  if (!moduleJson) {
    return false;
  }

  try {
    const module = JSON.parse(moduleJson) as ModuleConfig;
    if (module.isActive !== true) {
      return false;
    }
  } catch (e) {
    return false;
  }

  const rolesJson = localStorage.getItem('roles');
  if (!rolesJson) {
    return false;
  }

  try {
    const roles = JSON.parse(rolesJson) as Rol[];
    const hasAdminRole = roles.some(
      (role) => role.codeRol === 'ADM' && role.isActive === true,
    );
    if (!hasAdminRole) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}
