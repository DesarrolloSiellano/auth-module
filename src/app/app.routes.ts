import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'recovery',
    loadComponent: () =>
      import('./features/auth/recovery/recovery').then((m) => m.RecoveryComponent),
  },

  {
    path: 'exception/:code',
    loadComponent: () =>
      import('./shared/components/exception/exception.component').then((m) => m.ExceptionComponent),
  },

  {
    path: 'pages',
    loadComponent: () => import('./features/template/template.component').then((m) => m.TemplateComponent), canActivate: [authGuard],
    children: [
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./features/permissions/permissions').then((m) => m.PermissionsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'modules',
        loadComponent: () =>
          import('./features/modules/modules').then((m) => m.ModulesComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/companies').then((m) => m.CompaniesComponent),
      },

    ]
  },
  { path: '**', redirectTo: 'exception/404' }
];
