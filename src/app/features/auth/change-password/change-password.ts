import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';

import { Auth } from '../service/auth';
import { SessionStore } from '../../../core/services/session.store';

@Component({
  selector: 'app-change-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    Button,
    InputText,
    FloatLabel,
  ],
  template: `
    <div class="cp-wrapper">
      <p-card header="Cambiar contraseña">
        @if (mustChange()) {
          <p class="cp-note">
            Por seguridad debes cambiar tu contraseña antes de continuar.
          </p>
        }
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="cp-field">
            <p-floatLabel variant="on">
              <input pInputText type="password" id="currentPassword"
                class="w-full" formControlName="currentPassword" />
              <label for="currentPassword">Contraseña actual</label>
            </p-floatLabel>
          </div>
          <div class="cp-field">
            <p-floatLabel variant="on">
              <input pInputText type="password" id="newPassword"
                class="w-full" formControlName="newPassword" />
              <label for="newPassword">Nueva contraseña</label>
            </p-floatLabel>
          </div>
          @if (error()) {
            <p class="cp-error">{{ error() }}</p>
          }
          <div class="cp-actions">
            <p-button type="submit" label="Guardar" icon="pi pi-save"
              [loading]="loading()" [disabled]="form.invalid || loading()" />
          </div>
        </form>
      </p-card>
    </div>
  `,
  styles: [
    `
      .cp-wrapper {
        max-width: 440px;
        margin: 4rem auto;
        padding: 1rem;
      }
      .cp-field {
        margin-bottom: 1.1rem;
      }
      .cp-actions {
        margin-top: 1rem;
        text-align: right;
      }
      @media (max-width: 480px) {
        .cp-actions p-button {
          width: 100%;
        }
      }
      .cp-note {
        margin: 0 0 1rem;
        color: #b45309;
        font-size: 0.9rem;
      }
      .cp-error {
        color: #dc2626;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class ChangePasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly mustChange = signal(
    localStorage.getItem('mustChangePassword') === 'true',
  );

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', Validators.required],
  });

  ngOnInit(): void {
    if (!this.session.getAccessToken()) {
      this.router.navigate(['/login']);
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    const claims = this.session.getClaims();
    this.auth
      .changePassword({
        id: claims?._id ?? '',
        currentPassword: this.form.value.currentPassword ?? '',
        newPassword: this.form.value.newPassword ?? '',
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          localStorage.setItem('mustChangePassword', 'false');
          localStorage.setItem('isNewUser', 'false');
          this.router.navigate(['/pages/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(
            err?.error?.message || 'No se pudo cambiar la contraseña',
          );
        },
      });
  }
}
