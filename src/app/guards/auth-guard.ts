import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../shared/interfaces/jwt-payload.interface';
import { ConfirmService } from '../shared/services/confirm-dialog.service';
import { Auth } from '../auth/service/auth';
import { ProcessAuthData } from '../auth/service/process-auth-data';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const confirmService = inject(ConfirmService);
  const authService = inject(Auth);
  const processAuthData = inject(ProcessAuthData);

  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const currentTime = Math.floor(Date.now() / 1000);

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.isActived) {
      router.navigate(['/login']);
      return false;
    }

    // Si el access token ha expirado, intentar refrescarlo proactivamente antes de denegar el acceso
    if (decoded.exp && decoded.exp < currentTime) {
      if (refreshToken) {
        console.warn('🔑 El token ha expirado. Intentando refrescarlo de manera asíncrona en la guardia...');
        return authService.refreshToken(refreshToken).pipe(
          map((res) => {
            const newToken = res.accessToken;
            processAuthData.proccesAuthData(newToken, refreshToken);
            console.log('✅ Token refrescado exitosamente en la guardia.');
            
            // Re-evaluar los permisos con el nuevo token obtenido
            const newDecoded = jwtDecode<JwtPayload>(newToken);
            return checkPermissions(newDecoded, router, confirmService);
          }),
          catchError((err) => {
            console.error('❌ Falló el refresco del token en la guardia.', err);
            localStorage.clear();
            sessionStorage.clear();
            router.navigate(['/login']);
            return of(false);
          })
        );
      } else {
        router.navigate(['/login']);
        return false;
      }
    }

    return checkPermissions(decoded, router, confirmService);
  } catch (error) {
    console.error('❌ Error de decodificación o validación del token en la guardia:', error);
    router.navigate(['/login']);
    return false;
  }
};

function checkPermissions(
  decoded: JwtPayload,
  router: Router,
  confirmService: ConfirmService
): boolean {
  if (!decoded.isAdmin) {
    router.navigate(['/login']);
    return false;
  }

  const hasAdminModule = decoded.modules?.some(
    (module) => module.name === 'adminUserModule' && module.isActive === true
  );

  if (!hasAdminModule) {
    confirmService.showMessage(
      'error',
      `No tienes permisos para acceder a esta módulo`,
      'Contacta al administrador del sistema'
    );
    router.navigate(['/login']);
    return false;
  }

  // Validar rol con codeRol 'ADM' y activo
  const hasAdminRole = decoded.roles?.some(
    (role) => role.codeRol === 'ADM' && role.isActive === true
  );

  if (!hasAdminRole) {
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
}
