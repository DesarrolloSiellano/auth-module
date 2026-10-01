import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

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
    path: 'set-password',
    loadComponent: () =>
      import('./features/auth/set-password/set-password').then(
        (m) => m.SetPasswordComponent,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then(
        (m) => m.VerifyEmailComponent,
      ),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password').then(
        (m) => m.ChangePasswordComponent,
      ),
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles').then((m) => m.RolesComponent),
        canActivate: [superAdminGuard],
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./features/permissions/permissions').then((m) => m.PermissionsComponent),
        canActivate: [superAdminGuard],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./features/sessions/sessions').then((m) => m.SessionsComponent),
      },
      {
        path: 'my-sessions',
        loadComponent: () =>
          import('./features/my-sessions/my-sessions').then(
            (m) => m.MySessionsComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports').then((m) => m.ReportsComponent),
      },
      {
        path: 'custom-fields',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/custom-fields/custom-fields').then(
            (m) => m.CustomFieldsComponent,
          ),
      },
      {
        path: 'modules',
        loadComponent: () =>
          import('./features/modules/modules').then((m) => m.ModulesComponent),
        canActivate: [superAdminGuard],
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/companies/companies').then((m) => m.CompaniesComponent),
        canActivate: [superAdminGuard],
      },
      {
        path: 'tenant-config',
        loadComponent: () =>
          import('./features/tenant-config/tenant-config').then(
            (m) => m.TenantConfigComponent,
          ),
        canActivate: [superAdminGuard],
      },
      {
        path: 'api-docs',
        loadComponent: () =>
          import('./features/api-docs/api-docs').then((m) => m.ApiDocsComponent),
        canActivate: [superAdminGuard],
      },

    ]
  },
  { path: '**', redirectTo: 'exception/404' }
];
