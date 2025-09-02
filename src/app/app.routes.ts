import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'pages',
    loadComponent: () => import('./pages/template/template.component').then((m) => m.TemplateComponent), canActivate: [authGuard],
    children: [
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles').then((m) => m.Roles),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./pages/permissions/permissions').then((m) => m.Permissions),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users').then((m) => m.Users),
      },
      {
        path: 'modules',
        loadComponent: () =>
          import('./pages/modules/modules').then((m) => m.Modules),
      },

    ]
  }
];
