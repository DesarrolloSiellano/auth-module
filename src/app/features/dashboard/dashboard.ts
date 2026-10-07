import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProgressBar } from 'primeng/progressbar';

import { SessionStore } from '../../core/services/session.store';
import { TenantConfigService } from '../tenant-config/services/tenant-config.service';
import {
  PolicyDefinition,
  TenantConfig,
} from '../tenant-config/interfaces/tenant-config.interface';
import { PolicyItem, toQuotaItems } from '../tenant-config/helpers/usage.helper';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ProgressBar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly session = inject(SessionStore);
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  company = '';
  tenantId = '';

  catalog: PolicyDefinition[] = [];
  config: TenantConfig | null = null;
  configValues: Record<string, any> = {};

  ngOnInit(): void {
    const claims = this.session.getClaims();
    this.company = claims?.company ?? '';
    this.tenantId = claims?.tenantId ?? claims?.company ?? '';
    this.loadCatalog();
    this.loadConfig();
  }

  loadCatalog(): void {
    this.tenantConfigService
      .getCatalog(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.catalog = res.data || [];
          this.cdr.detectChanges();
        },
        error: () => this.cdr.detectChanges(),
      });
  }

  loadConfig(): void {
    this.tenantConfigService
      .getMyConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.config = res.data;
          // El backend devuelve la config ANIDADA (p.ej. channels.sms.monthlyLimit);
          // se aplana a las claves de política para que el dashboard sea dinámico.
          const values: Record<string, any> = {};
          this.catalog.forEach((def) => {
            values[def.key] = def.defaultValue;
          });
          Object.assign(values, this.flatten(res.data));
          this.configValues = values;
          this.cdr.detectChanges();
        },
        error: () => this.cdr.detectChanges(),
      });
  }

  /** Aplana un objeto anidado a claves con puntos (a.b.c). */
  private flatten(obj: any, prefix = ''): Record<string, any> {
    const out: Record<string, any> = {};
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(out, this.flatten(value, path));
        } else {
          out[path] = value;
        }
      }
    }
    return out;
  }

  /** Políticas (features) activas para la compañía del usuario. */
  get activeFeatures(): PolicyItem[] {
    return this.catalog
      .filter((def) => def.key.startsWith('features.'))
      .filter((def) => this.configValues[def.key] === true)
      .map((def) => ({
        key: def.key,
        label: def.label,
        value: this.configValues[def.key],
      }));
  }

  /** Canales habilitados. */
  get enabledChannels(): PolicyItem[] {
    return this.catalog
      .filter((def) => def.key.startsWith('channels.') && def.key.endsWith('.enabled'))
      .filter((def) => this.configValues[def.key] === true)
      .map((def) => ({
        key: def.key,
        label: def.label,
        value: this.configValues[def.key],
      }))
      .map((item) => ({
        ...item,
        label: item.label.replace(' habilitado', ''),
      }));
  }

  /** Límites y cuotas configurados (canales, mensajería y límites). */
  get quotas(): PolicyItem[] {
    return toQuotaItems(this.catalog, this.configValues);
  }

  /** Preferencias generales del tenant (zona horaria, idioma). */
  get generalInfo(): PolicyItem[] {
    return this.catalog
      .filter((def) => def.key.startsWith('general.'))
      .map((def) => ({
        key: def.key,
        label: def.label,
        value: this.configValues[def.key],
        unit: def.unit,
      }));
  }

  /** Resumen del catálogo por grupo. */
  get catalogSummary(): { group: string; count: number }[] {
    const map = new Map<string, number>();
    this.catalog.forEach((def) => {
      map.set(def.group, (map.get(def.group) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count);
  }

  isUnlimited(value: unknown): boolean {
    return Number(value) === 0;
  }

  // ---------------------------------------------------------------- Prueba

  get isTrialUser(): boolean {
    return this.session.getClaims()?.isTrial === true;
  }

  /** Días totales de prueba según la config del tenant (fallback 7). */
  get trialTotalDays(): number {
    const configured = Number(this.configValues?.['limits.trialDays']);
    if (Number.isFinite(configured) && configured > 0) return configured;
    const catalogDefault = Number(
      this.catalog.find((def) => def.key === 'limits.trialDays')?.defaultValue,
    );
    if (Number.isFinite(catalogDefault) && catalogDefault > 0) {
      return catalogDefault;
    }
    return 7;
  }

  get trialStartedAt(): Date | null {
    const raw = this.session.getClaims()?.trialStartedAt;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  get trialEndsAt(): Date | null {
    const raw = this.session.getClaims()?.trialEndsAt;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /** Días transcurridos de la prueba (se llena con el paso de los días). */
  get trialElapsedDays(): number {
    const start = this.trialStartedAt;
    const total = this.trialTotalDays;
    if (!start) return 0;
    const elapsed = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    return Math.min(Math.max(elapsed, 0), total);
  }

  get trialRemainingDays(): number {
    return Math.max(0, this.trialTotalDays - this.trialElapsedDays);
  }

  get trialPercent(): number {
    const total = this.trialTotalDays;
    if (total <= 0) return 100;
    return Math.min(100, Math.round((this.trialElapsedDays / total) * 100));
  }

  get trialExpired(): boolean {
    const end = this.trialEndsAt;
    return !!end && end.getTime() <= Date.now();
  }

  /** Color de la barra: cambia al 60% y al 80% del período. */
  get trialState(): 'ok' | 'warn' | 'danger' | 'expired' {
    if (this.trialExpired || this.trialPercent >= 100) return 'expired';
    if (this.trialPercent >= 80) return 'danger';
    if (this.trialPercent >= 60) return 'warn';
    return 'ok';
  }
}
