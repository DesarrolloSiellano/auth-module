import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from '../services/session.store';

/**
 * Permite el acceso solo a usuarios con isSuperAdmin = true.
 * Si no lo es, redirige al dashboard.
 */
export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const session = inject(SessionStore);
  const claims = session.getClaims();

  if (claims?.isSuperAdmin === true) {
    return true;
  }

  router.navigate(['/pages/dashboard']);
  return false;
};
