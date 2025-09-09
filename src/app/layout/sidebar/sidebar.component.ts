import { Component, OnInit } from '@angular/core';
import { RoutesModuleConfig } from '../../shared/interfaces/module-config.interface';
import { GetConfigAppService } from '../../shared/services/get-config.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ENVIROMENT } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [GetConfigAppService]
})
export class SidebarComponent implements OnInit {
  routes: RoutesModuleConfig[] = [];
  isChangeIcon: boolean = false

  title = ENVIROMENT.title

  constructor(private getConfigApp: GetConfigAppService) { }

  ngOnInit(): void {
    this.routes = this.getConfigApp.getRoutes();
  }

  toggleSubmenu() {
    this.isChangeIcon = !this.isChangeIcon;
    const submenu = document.querySelector('.submenu');
    submenu?.classList.toggle('hidden-submenu');
  }

}
