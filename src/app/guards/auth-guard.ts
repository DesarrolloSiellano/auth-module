import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../shared/interfaces/jwt-payload.interface';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(currentTime);

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);

    console.log(decoded);


    if (!decoded.isActived) {
      router.navigate(['/login']);
      return false;
    }

    if (decoded.exp && decoded.exp < currentTime) {
      router.navigate(['/login']);
      return false;
    }

    if (!decoded.isAdmin) {
      router.navigate(['/login']);
      return false;
    }

    const hasAdminModule = decoded.modules?.some(
      (module) => module.name === 'adminUserModule' && module.isActive === true
    );

    if (!hasAdminModule) {
      // No tiene el módulo activo requerido, redirigir o bloquear
      router.navigate(['/login']); // Ruta para acceso denegado, si tienes
      return false;
    }

    console.log(route, state);

    // Validar rol con codeRol 'ADM' y activo
    const hasAdminRole = decoded.roles?.some(
      (role) => role.codeRol === 'ADM' && role.isActive === true,
    );

    if (!hasAdminRole) {
      router.navigate(['/forbidden']); // Ruta acceso denegado
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    // Token inválido o error al decodificar
    router.navigate(['/login']);
    return false;
  }
};
