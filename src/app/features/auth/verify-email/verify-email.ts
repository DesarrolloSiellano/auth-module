import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Card } from 'primeng/card';

import { Auth } from '../service/auth';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, RouterModule, Card],
  template: `
    <div class="ve-wrapper">
      <p-card header="Verificación de correo">
        @if (loading()) {
          <p class="ve-muted">Verificando tu correo…</p>
        } @else if (done()) {
          <p class="ve-ok">{{ message() }}</p>
          <p class="ve-muted">Redirigiendo al inicio de sesión…</p>
        } @else {
          <p class="ve-error">{{ message() }}</p>
          <a routerLink="/login">Ir al inicio de sesión</a>
        }
      </p-card>
    </div>
  `,
  styles: [
    `
      .ve-wrapper {
        max-width: 440px;
        margin: 4rem auto;
        padding: 1rem;
      }
      .ve-error {
        color: #dc2626;
        font-size: 0.9rem;
      }
      .ve-ok {
        color: #16a34a;
        font-size: 0.9rem;
      }
      .ve-muted {
        color: var(--p-surface-500);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private timer?: ReturnType<typeof setTimeout>;

  readonly loading = signal(false);
  readonly done = signal(false);
  readonly message = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) {
      this.message.set('El enlace no es válido o expiró.');
      return;
    }
    this.loading.set(true);
    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.done.set(true);
        this.message.set(res.message || 'Correo verificado exitosamente');
        this.timer = setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.message.set(err?.error?.message || 'El enlace no es válido o expiró.');
      },
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
