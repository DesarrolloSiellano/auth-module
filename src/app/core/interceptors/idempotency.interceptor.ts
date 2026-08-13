import {
  HttpContextToken,
  HttpInterceptorFn,
} from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';

const IDEMPOTENCY_KEY = new HttpContextToken<string>(() => '');

/**
 * Interceptor de idempotencia para POST/PATCH.
 * Genera una clave estable por petición lógica (guardada en el HttpContext) y
 * la reutiliza si la misma petición se reintenta (p. ej. tras un refresh 401),
 * permitiendo al backend deduplicar operaciones.
 */
export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return next(req);
  }

  let key = req.context.get(IDEMPOTENCY_KEY);
  if (!key) {
    key = uuidv4();
    req.context.set(IDEMPOTENCY_KEY, key);
  }

  const cloned = req.clone({
    setHeaders: {
      'x-idempotency-key': key,
    },
  });

  return next(cloned);
};
