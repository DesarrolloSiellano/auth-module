import { Component, inject, OnInit } from '@angular/core';
import { RoutesModuleConfig } from '../../shared/interfaces/module-config.interface';
import { GetConfigAppService } from '../../shared/services/get-config.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ENVIROMENT } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [GetConfigAppService],
})
export class SidebarComponent implements OnInit {
  routes: RoutesModuleConfig[] = [];
  isChangeIcon: boolean = false;

  title = ENVIROMENT.title;

  private readonly getConfigApp = inject(GetConfigAppService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.routes = this.getConfigApp.getRoutes().map((route) => ({
      ...route,
      open: true, // agrega propiedad de visibilidad
    }));
  }

  toggleSubmenu(route: RoutesModuleConfig) {
    route.open = !route.open;
  }

  isRouteVisible(route: RoutesModuleConfig): boolean {
    return (
      route.isActive === true ||
      (route.children || []).some((child) => child.isActive === true)
    );
  }

  isSuperAdmin(): boolean {
    return localStorage.getItem('isSuperAdmin') === 'true';
  }

  isAdmin(): boolean {
    return localStorage.getItem('isAdmin') === 'true';
  }

  /** Oculta rutas solo-SuperAdmin al resto de usuarios. */
  canShowRoute(route: RoutesModuleConfig): boolean {
    if (this.isSuperAdmin()) return true;
    const name = (route.name || '').toLowerCase();
    const path = (route.path || '').toLowerCase();

    // Reportes: visible para admin de empresa (el backend acota a su company).
    const isReport = name.includes('reporte') || path.endsWith('/reports');
    if (isReport) return this.isAdmin();

    const adminOnly = [
      'companies',
      'compañias',
      'compañías',
      'políticas',
      'roles',
      'permissions',
      'permisos',
      'modules',
      'módulos',
      'custom-fields',
      'campos',
      'campos personalizados',
    ];
    return (
      !adminOnly.includes(name) &&
      !adminOnly.some((key) => path.endsWith(`/${key}`))
    );
  }

  /** Un nodo es padre si tiene hijos activos (admite dos niveles). */
  isParent(route: RoutesModuleConfig): boolean {
    return this.hasActiveChildren(route);
  }

  hasActiveChildren(route: RoutesModuleConfig): boolean {
    return (route.children || []).some((child) => child.isActive === true);
  }

  /** Resalta el padre cuando la ruta activa es uno de sus hijos. */
  isParentActive(route: RoutesModuleConfig): boolean {
    const url = this.router.url;
    return (route.children || []).some((child) => {
      if (!child.isActive) return false;
      const link = this.getChildLink(route, child);
      return link !== '' && (url === link || url.startsWith(link + '/'));
    });
  }

  getRouteLink(route: RoutesModuleConfig): string {
    if (route.initPath) {
      return route.initPath;
    }
    const firstActiveChild = (route.children || []).find(
      (child) => child.isActive === true,
    );
    return firstActiveChild ? this.getChildLink(route, firstActiveChild) : '';
  }

  getChildLink(
    route: RoutesModuleConfig,
    child: RoutesModuleConfig,
  ): string {
    const base = (route.path || '').replace(/\/+$/, '');
    const path = (child.path || '').replace(/^\/+/, '');
    return `${base}/${path}`;
  }
}
