import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarService } from '../services/sidebar.service';
import { ModuleConfig } from '../../shared/interfaces/module-config.interface';
import { GetConfigAppService } from '../../shared/services/get-config.service';
import { Router } from '@angular/router';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AvatarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  providers: [SidebarService], // Proporciona el servicio de sidebar
})
export class NavbarComponent implements OnInit {
  inputVisible: boolean = false;
  isSidebarOpen: boolean = false;
  moduleConfig: ModuleConfig = {} as ModuleConfig;
  username: string = '';
  private scrollListener!: () => void;

  constructor(
    private sidebarService: SidebarService,
    private getConfigApp: GetConfigAppService,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.moduleConfig = this.getConfigApp.getModule();
    this.username = this.getConfigApp.getUserName();
    this.sidebarService.sidebarState.subscribe((isOpen) => {
      this.isSidebarOpen = isOpen;
    });

    this.scrollListener = this.renderer.listen('window', 'scroll', () => {
      const navbarElement = this.el.nativeElement.querySelector('.navbar');
      if (window.scrollY > 50) {
        this.renderer.addClass(navbarElement, 'scrolled');
      } else {
        this.renderer.removeClass(navbarElement, 'scrolled');
      }
    });

    // Manejo resize y llamado inicial
    this.handleResize(); // Para el estado inicial
    this.renderer.listen('window', 'resize', () => {
      this.handleResize();
    });

    this.renderer.listen('document', 'click', (event) => {
      const content = document.querySelector(
        '.dashboard-content.dashboard-overlay'
      );
      if (content && content.contains(event.target)) {
        this.toggleSidebar();
      }
    });
  }

  handleResize(): void {
    const sidebar = document.querySelector('.sidebar');
    const navbar = document.querySelector('.navbar');
    const content = document.querySelector('.dashboard-content');

    if (window.innerWidth <= 1024) {
      if (sidebar && !sidebar.classList.contains('collapsed')) {
        sidebar.classList.add('collapsed');
      }
      if (navbar) {
        navbar.classList.remove('sidebar-expanded');
        navbar.classList.add('sidebar-collapsed');
      }
    } else {
      // Solo expandir si estaba colapsado previamente
      if (sidebar && sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
      }
      if (navbar) {
        navbar.classList.remove('sidebar-collapsed');
        navbar.classList.add('sidebar-expanded');
      }
    }
  }

  toggleInput() {
    this.inputVisible = !this.inputVisible;
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar(); // Cambia el estado

    const navbar = document.querySelector('.navbar');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.dashboard-content');

    const isCollapsed = sidebar?.classList.toggle('collapsed'); // agrega o quita clase collapsed

    if (navbar) {
      if (isCollapsed) {
        navbar.classList.remove('sidebar-expanded');
        navbar.classList.add('sidebar-collapsed');
      } else {
        navbar.classList.remove('sidebar-collapsed');
        navbar.classList.add('sidebar-expanded');
      }
    }

    if (
      window.innerWidth <= 1024 &&
      sidebar &&
      !sidebar.classList.contains('collapsed')
    ) {
      content?.classList.add('dashboard-overlay');
    } else {
      content?.classList.remove('dashboard-overlay');
    }
  }

  async logout() {
    try {
      const isConfirm = await this.confirmService.confirm(
        '',
        `Salir del ${this.moduleConfig.description}`,
        '¿Desea cerrar la sesión?',
        'pi pi-exclamation-triangle',
        'Cancelar',
        'Aceptar',
        'secondary'
      );

      if (isConfirm) {
        localStorage.clear();
        sessionStorage.clear();
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
