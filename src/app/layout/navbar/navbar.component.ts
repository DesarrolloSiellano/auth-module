import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarService } from '../services/sidebar.service';
import { ModuleConfig } from '../../shared/interfaces/module-config.interface';
import { GetConfigAppService } from '../../shared/services/get-config.service';

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
    private el: ElementRef
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
  }

  toggleInput() {
    this.inputVisible = !this.inputVisible;
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar(); // Cambia el estado

    const navbar = document.querySelector('.navbar');
    const sidebar = document.querySelector('.sidebar');

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
  }
}
