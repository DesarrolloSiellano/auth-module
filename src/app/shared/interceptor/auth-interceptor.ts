import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('⚠️ El servidor devolvió 401 - No autorizado');

        localStorage.removeItem('token');
        router.navigate(['/exception/401']);
      }

      return throwError(() => error);
    })
  );
};
