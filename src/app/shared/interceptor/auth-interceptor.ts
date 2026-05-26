import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
} from 'rxjs';
import { Auth } from '../../auth/service/auth';
import { ProcessAuthData } from '../../auth/service/process-auth-data';
import { ConfirmService } from '../services/confirm-dialog.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<
  string | null
>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(Auth);
  const processAuthData = inject(ProcessAuthData);
  const confirmService = inject(ConfirmService);

  const token = localStorage.getItem('token');

  // Inyectar el token dinámicamente a las cabeceras de la petición si existe.
  // Esto previene que se manden tokens viejos cacheados por los constructores de BaseService.
  let authReq = req;
  if (
    token &&
    !req.url.includes('/auth/login') &&
    !req.url.includes('/auth/refresh')
  ) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Validar si el error es 429 (Too Many Requests)
      if (error.status === 429) {
        confirmService.showMessage(
          'warn',
          'Límite de peticiones excedido',
          'Has realizado demasiadas solicitudes en poco tiempo. Por favor, espera un momento.',
          5000,
        );
        return throwError(() => error);
      }

      // Validar si el error es 401 y no proviene de login ni de refresh para evitar bucles.
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        console.warn(
          '⚠️ El servidor devolvió 401 - Iniciando refresco de token...',
        );
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.error(
            '❌ No se encontró un refresh token. Redirigiendo a login.',
          );
          clearSessionAndRedirect(router);
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken(refreshToken).pipe(
            switchMap((res) => {
              isRefreshing = false;
              console.info('✅ Token refrescado exitosamente.');
              const newToken = res.accessToken;
              processAuthData.proccesAuthData(newToken, refreshToken);
              refreshTokenSubject.next(newToken);

              // Reintentar la petición original con el nuevo access token
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                }),
              );
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              console.error(
                '❌ Falló el refresco del token. Redirigiendo a login.',
                refreshError,
              );
              clearSessionAndRedirect(router);
              return throwError(() => refreshError);
            }),
          );
        } else {
          // Si ya se está refrescando, encolar esta petición hasta tener el nuevo token
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((newToken) => {
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                }),
              );
            }),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};

function clearSessionAndRedirect(router: Router) {
  localStorage.clear();
  sessionStorage.clear();
  router.navigate(['/login']);
}
