import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarService } from '../services/sidebar.service';
import { ModuleConfig } from '../../shared/interfaces/module-config.interface';
import { GetConfigAppService } from '../../shared/services/get-config.service';
import { Router } from '@angular/router';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { IconDropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { DialogModule } from 'primeng/dialog';
import { CHANGE_PASSWORD_FORM } from '../../shared/forms/change-password.form';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { ButtonModule } from 'primeng/button';
import { Auth, ChangePassword } from '../../auth/service/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    IconDropdownComponent,
    DialogModule,
    FormTemplateComponent,
    ButtonModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  providers: [SidebarService], // Proporciona el servicio de sidebar
})
export class NavbarComponent implements OnInit {
  @ViewChild('dropdown') dropdown!: IconDropdownComponent;

  @ViewChild(FormTemplateComponent)
  declare formComponent?: FormTemplateComponent;
  inputVisible: boolean = false;
  isSidebarOpen: boolean = false;
  moduleConfig: ModuleConfig = {} as ModuleConfig;
  username: string = '';
  private scrollListener!: () => void;

  cogOptions = [
    {
      label: 'Cambiar contraseña',
      action: () => this.changePassword(),
    },
  ];

  isDisplayChangePassword: boolean = false;
  changePasswordForm = CHANGE_PASSWORD_FORM;

  constructor(
    private sidebarService: SidebarService,
    private getConfigApp: GetConfigAppService,
    private renderer: Renderer2,
    private el: ElementRef,
    private router: Router,
    private confirmService: ConfirmService,
    private authService: Auth
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

    if(localStorage.getItem('isNewUser') === 'true') {
      this.isDisplayChangePassword = true;
    }
  }

  toggleDropdown(trigger: HTMLElement) {
    this.dropdown.open(trigger);
  }

  handleResize(): void {
    const sidebar = document.querySelector('.sidebar');
    const navbar = document.querySelector('.navbar');

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
    console.log('logout');

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

  changePassword() {
    this.isDisplayChangePassword = true;
  }

  closeDialog() {
    this.isDisplayChangePassword = false;
  }

  save() {
    const changePassword: ChangePassword = {
      id: localStorage.getItem('_id') as string,
      currentPassword: this.formComponent?.formGroup?.get('currentPassword')?.value,
      newPassword: this.formComponent?.formGroup?.get('newPassword')?.value,
    };

    this.authService.changePassword(changePassword).subscribe({
      next: (res) => {
        console.log(res);
        if(res.statusCode === 400 || res.statusCode === 404) {
          this.confirmService.showMessage(
            'error',
            'Error',
            res.message
          );
        }

        if(res.statusCode === 200 || res.statusCode === 201) {
          this.confirmService.showMessage(
            'info',
            'Exito',
            res.message
          );
          localStorage.setItem('isNewUser', 'false');
        }

      },
      error: (err) => {
        console.error(err.error.message);
        this.confirmService.showMessage(
          'error',
          'Error',
          err.error.message
        );
      },
      complete: () => {
        this.isDisplayChangePassword = false;
        this.formComponent?.formGroup?.reset();
      }
    })
  }
}
