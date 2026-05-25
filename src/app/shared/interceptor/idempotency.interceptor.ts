import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interceptor para gestionar la idempotencia en peticiones POST y PATCH.
 * Envía un header 'x-idempotency-key' con un UUID único para evitar duplicados en el backend.
 */
export const idempotencyInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // Solo aplicamos a métodos que mutan datos
  if (req.method === 'POST' || req.method === 'PATCH') {
    // Generamos una llave única para esta petición específica
    const idempotencyKey = uuidv4();

    const clonedRequest = req.clone({
      setHeaders: {
        'x-idempotency-key': idempotencyKey,
      },
    });

    return next(clonedRequest);
  }

  return next(req);
};
