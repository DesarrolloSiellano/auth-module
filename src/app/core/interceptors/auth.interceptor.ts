import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionStore } from '../services/session.store';
import { TokenRefreshService } from '../services/token-refresh.service';

const REFRESH_ATTEMPTED = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const tokenRefresh = inject(TokenRefreshService);
  const router = inject(Router);

  const token = session.getAccessToken();

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
      const isAuthFlow =
        req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

      if (error.status !== 401 || isAuthFlow) {
        return throwError(() => error);
      }

      const refreshToken = session.getRefreshToken();

      if (!refreshToken || req.context.get(REFRESH_ATTEMPTED)) {
        session.clear();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return tokenRefresh.refresh().pipe(
        switchMap((newToken) =>
          next(
            req.clone({
              context: req.context.set(REFRESH_ATTEMPTED, true),
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            }),
          ),
        ),
        catchError(() => {
          // El refresh falló: sesión expirada. Reemitir el 401 original.
          session.clear();
          router.navigate(['/login']);
          return throwError(() => error);
        }),
      );
    }),
  );
};
