import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { getHttpErrorInfo } from '../helpers/http-error';
import { NotificationService } from '../services/notification.service';
import { SessionStore } from '../services/session.store';

const AUTH_PAGE_URLS = ['/auth/login', '/auth/recovery-password'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const session = inject(SessionStore);
  const router = inject(Router);

  const isAuthPageUrl = AUTH_PAGE_URLS.some((url) => req.url.includes(url));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const info = getHttpErrorInfo(error);

      // Las páginas de login/recovery muestran su propio mensaje inline.
      if (isAuthPageUrl) {
        return throwError(() => error);
      }

      if (info.status === 401) {
        session.clear();
        router.navigate(['/login']);
        notification.error(
          'Sesión expirada',
          'Tu sesión ha caducado. Inicia sesión nuevamente.',
        );
        return throwError(() => error);
      }

      switch (info.status) {
        case 400:
          notification.error('Datos inválidos', info.message);
          break;
        case 403:
          notification.error('Sin permisos', info.message);
          break;
        case 404:
          notification.error('No encontrado', info.message);
          break;
        case 429:
          notification.warn(
            'Límite de peticiones',
            'Has realizado demasiadas solicitudes. Espera un momento.',
            5000,
          );
          break;
        case 500:
          notification.error(
            'Error del servidor',
            'Ocurrió un error interno. Intenta de nuevo más tarde.',
          );
          break;
        case 0:
          notification.error('Sin conexión', 'No se pudo conectar con el servidor.');
          break;
        default:
          notification.error('Error', info.message);
      }

      return throwError(() => error);
    }),
  );
};
