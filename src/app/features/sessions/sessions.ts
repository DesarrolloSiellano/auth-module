import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

import { SessionStore } from '../../core/services/session.store';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { SessionsService } from './services/sessions.service';
import { SessionItem } from './interfaces/session.interface';

@Component({
  selector: 'app-sessions',
  imports: [CommonModule, FormsModule, TableModule, Button, InputText],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
})
export class SessionsComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly session = inject(SessionStore);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  sessions: SessionItem[] = [];
  selected: SessionItem[] = [];
  loading = false;
  emailFilter = '';
  isSuperAdmin = false;
  processing = false;

  ngOnInit(): void {
    this.isSuperAdmin = this.session.getClaims()?.isSuperAdmin === true;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.sessionsService
      .findAll({ email: this.emailFilter || undefined, limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.sessions = res.data || [];
          this.selected = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  clearFilters(): void {
    this.emailFilter = '';
    this.load();
  }

  deviceLabel(item: SessionItem): string {
    return [item.browser, item.os].filter(Boolean).join(' · ') || '—';
  }

  async revoke(item: SessionItem): Promise<void> {
    const ok = await this.confirmService.confirm(
      item.email,
      'Revocar sesión',
      '¿Revocar esta sesión de',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Revocar',
      'secondary',
      'danger',
    );
    if (!ok) return;
    this.run(this.sessionsService.revoke(item._id), 'Sesión revocada');
  }

  async revokeUser(item: SessionItem): Promise<void> {
    const ok = await this.confirmService.confirm(
      item.email,
      'Revocar todas las sesiones',
      '¿Revocar todas las sesiones de este usuario',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Revocar',
      'secondary',
      'danger',
    );
    if (!ok) return;
    this.run(
      this.sessionsService.revokeByUser(item.user),
      'Sesiones del usuario revocadas',
    );
  }

  async revokeSelected(): Promise<void> {
    if (this.selected.length === 0) return;
    const ok = await this.confirmService.confirm(
      `${this.selected.length}`,
      'Revocar seleccionadas',
      '¿Revocar las sesiones seleccionadas',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Revocar',
      'secondary',
      'danger',
    );
    if (!ok) return;
    const ids = this.selected.map((s) => s._id);
    this.run(this.sessionsService.revokeMany(ids), 'Sesiones revocadas');
  }

  async revokeAll(): Promise<void> {
    const scope = this.isSuperAdmin ? 'todas las sesiones (global)' : 'todas las sesiones de tu empresa';
    const ok = await this.confirmService.confirm(
      '',
      'Revocar todas',
      `¿Revocar ${scope}?`,
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Revocar',
      'secondary',
      'danger',
    );
    if (!ok) return;
    this.run(this.sessionsService.revokeAll(), 'Sesiones revocadas');
  }

  private run(request$: { subscribe: (o: any) => void }, detail: string): void {
    if (this.processing) return;
    this.processing = true;
    request$.subscribe({
      next: () => {
        this.processing = false;
        this.confirmService.showMessage('success', 'Sesiones', detail);
        this.load();
      },
      error: (err: any) => {
        this.processing = false;
        this.confirmService.showMessage(
          'error',
          'Sesiones',
          err?.error?.message || 'No se pudieron revocar las sesiones',
        );
        this.cdr.detectChanges();
      },
    });
  }
}
