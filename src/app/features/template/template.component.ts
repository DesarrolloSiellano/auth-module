import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';

import { ToastModule } from 'primeng/toast';
@Component({
  selector: 'app-template',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, FooterComponent, CommonModule, RouterOutlet, ToastModule],
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent {

}
