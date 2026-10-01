import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { SessionStore } from '../../core/services/session.store';
import { NotificationService } from '../../core/services/notification.service';
import { Auth } from '../auth/service/auth';

@Component({
  selector: 'app-template',
  imports: [NavbarComponent, SidebarComponent, FooterComponent, CommonModule, RouterOutlet],
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent {
  private readonly session = inject(SessionStore);
  private readonly auth = inject(Auth);
  private readonly notification = inject(NotificationService);

  sending = false;

  get showVerifyBanner(): boolean {
    const claims = this.session.getClaims();
    return !!claims && claims.emailVerified === false;
  }

  resendVerification(): void {
    if (this.sending) return;
    this.sending = true;
    this.auth.resendVerification().subscribe({
      next: (res) => {
        this.sending = false;
        this.notification.success(
          'Verificación',
          res.message || 'Correo de verificación reenviado',
        );
      },
      error: (err) => {
        this.sending = false;
        this.notification.error(
          'Verificación',
          err?.error?.message || 'No se pudo reenviar el correo',
        );
      },
    });
  }
}
