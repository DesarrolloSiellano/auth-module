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
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { SessionsService } from '../sessions/services/sessions.service';
import { SessionItem } from '../sessions/interfaces/session.interface';
import { AuditService } from '../reports/services/audit.service';
import { AuditItem } from '../reports/interfaces/report.interface';

const ACTION_LABELS: Record<string, string> = {
  'login.success': 'Inicio de sesión',
  'login.failed': 'Intento de acceso fallido',
  logout: 'Cierre de sesión',
  'refresh.failed': 'Renovación de token fallida',
  'security.auto_lock': 'Bloqueo automático por intentos',
  'session.revoked': 'Sesión revocada',
  'session.revoked.self': 'Sesión propia revocada',
  'session.revoked.self.all': 'Todas mis sesiones revocadas',
  'session.revoked.batch': 'Sesiones revocadas (lote)',
  'session.revoked.user': 'Sesiones de usuario revocadas',
  'session.revoked.all': 'Todas las sesiones revocadas',
  'user.blocked': 'Usuario bloqueado',
  'user.unblocked': 'Usuario desbloqueado',
  'user.tags.updated': 'Etiquetas/grupos actualizados',
  'user.soft_deleted': 'Usuario dado de baja',
  'user.hard_deleted': 'Usuario eliminado definitivamente',
  'user.invite.resent': 'Invitación reenviada',
  'user.welcome.resent': 'Bienvenida reenviada',
  'policy.created': 'Política creada',
  'policy.updated': 'Política actualizada',
  'policy.removed': 'Política eliminada',
  'config.updated': 'Configuración actualizada',
  'config.patched': 'Configuración actualizada',
  'customfield.created': 'Campo personalizado creado',
  'customfield.updated': 'Campo personalizado actualizado',
  'customfield.deleted': 'Campo personalizado eliminado',
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Autenticación',
  session: 'Sesiones',
  config: 'Configuración',
  policy: 'Políticas',
  user: 'Usuarios',
  security: 'Seguridad',
};

@Component({
  selector: 'app-my-sessions',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Tag,
    InputText,
    Select,
    DatePicker,
  ],
  templateUrl: './my-sessions.html',
  styleUrl: './my-sessions.scss',
})
export class MySessionsComponent implements OnInit {
  private readonly sessionsService = inject(SessionsService);
  private readonly auditService = inject(AuditService);
  private readonly confirmService = inject(ConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  sessions: SessionItem[] = [];
  loading = false;
  processing = false;

  audit: AuditItem[] = [];
  loadingAudit = false;
  totalAudit = 0;
  auditRows = 20;

  auditCategory = '';
  auditStatus = '';
  auditAction = '';
  auditFrom: Date | null = null;
  auditTo: Date | null = null;

  readonly categoryOptions = [
    { label: 'Todas', value: '' },
    { label: 'Autenticación', value: 'auth' },
    { label: 'Sesiones', value: 'session' },
    { label: 'Seguridad', value: 'security' },
    { label: 'Usuarios', value: 'user' },
    { label: 'Configuración', value: 'config' },
    { label: 'Políticas', value: 'policy' },
  ];

  readonly statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Exitoso', value: 'success' },
    { label: 'Fallido', value: 'failed' },
  ];

  ngOnInit(): void {
    this.loadSessions();
    // El historial se carga vía (onLazyLoad) de la tabla paginada.
  }

  loadSessions(): void {
    this.loading = true;
    this.sessionsService
      .findMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.sessions = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadAudit(event?: { first?: number; rows?: number }): void {
    const rows = event?.rows || this.auditRows;
    const first = event?.first ?? 0;
    this.auditRows = rows;
    const page = Math.floor(first / rows) + 1;

    this.loadingAudit = true;
    this.auditService
      .mine({
        page,
        limit: rows,
        category: this.auditCategory || undefined,
        status: this.auditStatus || undefined,
        action: this.auditAction || undefined,
        from: this.formatDate(this.auditFrom),
        to: this.formatDate(this.auditTo),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.audit = res.data || [];
          this.totalAudit = Number(res.meta?.['totalData']) || this.audit.length;
          this.loadingAudit = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingAudit = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyAuditFilters(): void {
    this.loadAudit({ first: 0, rows: this.auditRows });
  }

  clearAuditFilters(): void {
    this.auditCategory = '';
    this.auditStatus = '';
    this.auditAction = '';
    this.auditFrom = null;
    this.auditTo = null;
    this.applyAuditFilters();
  }

  private formatDate(date: Date | null): string | undefined {
    return date ? date.toISOString().slice(0, 10) : undefined;
  }

  deviceLabel(item: SessionItem): string {
    return [item.browser, item.os].filter(Boolean).join(' · ') || '—';
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] || action;
  }

  categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] || category;
  }

  async revoke(item: SessionItem): Promise<void> {
    const ok = await this.confirmService.confirm(
      item.browser || item.ip || '',
      'Cerrar sesión',
      '¿Cerrar esta sesión',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Cerrar',
      'secondary',
      'danger',
    );
    if (!ok) return;
    this.run(this.sessionsService.revokeMine(item._id), 'Sesión cerrada');
  }

  async revokeAll(): Promise<void> {
    const ok = await this.confirmService.confirm(
      '',
      'Cerrar todas mis sesiones',
      '¿Cerrar todas tus sesiones activas?',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Cerrar todas',
      'secondary',
      'danger',
    );
    if (!ok) return;
    this.run(
      this.sessionsService.revokeAllMine(),
      'Todas las sesiones cerradas',
    );
  }

  private run(request$: { subscribe: (o: any) => void }, detail: string): void {
    if (this.processing) return;
    this.processing = true;
    request$.subscribe({
      next: () => {
        this.processing = false;
        this.confirmService.showMessage('success', 'Mis sesiones', detail);
        this.loadSessions();
        this.loadAudit({ first: 0, rows: this.auditRows });
      },
      error: (err: any) => {
        this.processing = false;
        this.confirmService.showMessage(
          'error',
          'Mis sesiones',
          err?.error?.message || 'No se pudo cerrar la sesión',
        );
        this.cdr.detectChanges();
      },
    });
  }
}
