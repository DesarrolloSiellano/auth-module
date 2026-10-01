import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';

import { Auth } from '../service/auth';

@Component({
  selector: 'app-set-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    Card,
    Button,
    InputText,
    FloatLabel,
  ],
  template: `
    <div class="sp-wrapper">
      <p-card header="Establecer contraseña">
        @if (!token()) {
          <p class="sp-error">El enlace no es válido o expiró.</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="sp-field">
              <p-floatLabel variant="on">
                <input pInputText type="password" id="password" class="w-full"
                  formControlName="password" />
                <label for="password">Nueva contraseña</label>
              </p-floatLabel>
            </div>
            @if (error()) {
              <p class="sp-error">{{ error() }}</p>
            }
            @if (done()) {
              <p class="sp-ok">Contraseña establecida. Ya puedes iniciar sesión.</p>
            }
            <div class="sp-actions">
              <p-button type="submit" label="Establecer" icon="pi pi-check"
                [loading]="loading()" [disabled]="form.invalid || loading()" />
              <a routerLink="/login">Ir al inicio de sesión</a>
            </div>
          </form>
        }
      </p-card>
    </div>
  `,
  styles: [
    `
      .sp-wrapper {
        max-width: 440px;
        margin: 4rem auto;
        padding: 1rem;
      }
      .sp-field {
        margin-bottom: 1.1rem;
      }
      .sp-actions {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      @media (max-width: 480px) {
        .sp-actions {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }
      }
      .sp-error {
        color: #dc2626;
        font-size: 0.85rem;
      }
      .sp-ok {
        color: #16a34a;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class SetPasswordComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  readonly loading = signal(false);
  readonly error = signal('');
  readonly done = signal(false);
  readonly token = signal('');

  form = this.fb.group({
    password: ['', Validators.required],
  });

  constructor() {
    this.token.set(this.route.snapshot.queryParamMap.get('token') || '');
  }

  submit(): void {
    if (!this.token() || this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth
      .setPasswordWithToken(this.token(), this.form.value.password ?? '')
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.done.set(true);
          this.timers.push(
            setTimeout(() => this.router.navigate(['/login']), 1200),
          );
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || 'Token inválido o expirado');
        },
      });
  }
}
