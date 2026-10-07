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
import { Select } from 'primeng/select';
import { ProgressBar } from 'primeng/progressbar';

import { SessionStore } from '../../core/services/session.store';
import { TenantConfigService } from '../tenant-config/services/tenant-config.service';
import {
  PolicyDefinition,
  TenantConfig,
  TenantUsage,
} from '../tenant-config/interfaces/tenant-config.interface';
import {
  buildQuotaBars,
  buildUsagePeriods,
  currentPeriod,
  flattenMetrics,
  toQuotaItems,
  PolicyItem,
  QuotaBar,
} from '../tenant-config/helpers/usage.helper';

interface UsageRow {
  period: string;
  metric: string;
  value: number;
}

interface MetricTotal {
  metric: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Select,
    ProgressBar,
  ],
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
  period = '';
  usagePeriods: string[] = [];
  loading = false;

  catalog: PolicyDefinition[] = [];
  config: TenantConfig | null = null;
  configValues: Record<string, any> = {};
  usage: TenantUsage[] = [];

  ngOnInit(): void {
    const claims = this.session.getClaims();
    this.company = claims?.company ?? '';
    this.tenantId = claims?.tenantId ?? claims?.company ?? '';
    this.loadAll();
  }

  loadAll(): void {
    this.loadCatalog();
    this.loadConfig();
    this.loadUsagePeriods();
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
          // El backend devuelve la config ANIDADA
          // (p.ej. channels.sms.monthlyLimit); se aplana a las claves de
          // política para que el dashboard sea dinámico.
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

  /** Períodos existentes con consumo; mes actual como fallback. */
  loadUsagePeriods(): void {
    if (!this.tenantId) return;
    this.tenantConfigService
      .listUsagePeriods(this.tenantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const existing = buildUsagePeriods(res.data || []);
          this.usagePeriods = existing.length ? existing : [currentPeriod()];
          if (!this.usagePeriods.includes(this.period)) {
            this.period = this.usagePeriods[0];
          }
          this.loadUsage();
        },
        error: () => this.loadUsage(),
      });
  }

  loadUsage(): void {
    if (!this.tenantId) return;
    this.loading = true;
    this.tenantConfigService
      .getUsage(this.tenantId, this.period || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.usage = res.data || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
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
      })).map((item) => ({
        ...item,
        label: item.label.replace(' habilitado', ''),
      }));
  }

  /** Límites y cuotas configurados (canales, mensajería y límites). */
  get quotas(): PolicyItem[] {
    return toQuotaItems(this.catalog, this.configValues);
  }

  get usedByMetric(): Map<string, number> {
    const map = new Map<string, number>();
    this.totalsByMetric.forEach((item) => map.set(item.metric, item.value));
    return map;
  }

  /** Cuotas numéricas con su barra de carga (uso vs límite). */
  get quotaBars(): QuotaBar[] {
    return buildQuotaBars(this.quotas, this.usedByMetric);
  }

  get rows(): UsageRow[] {
    return this.usage.flatMap((item) =>
      Object.entries(flattenMetrics(item.metrics)).map(([metric, value]) => ({
        period: item.period,
        metric,
        value,
      })),
    );
  }

  get totalsByMetric(): MetricTotal[] {
    const map = new Map<string, number>();
    this.rows.forEach((row) => {
      map.set(row.metric, (map.get(row.metric) || 0) + row.value);
    });
    return Array.from(map.entries())
      .map(([metric, value]) => ({ metric, value }))
      .sort((a, b) => b.value - a.value);
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

  get totalUsage(): number {
    return this.rows.reduce((sum, row) => sum + row.value, 0);
  }

  get activeMetrics(): number {
    return this.totalsByMetric.length;
  }

  get maxMetricTotal(): number {
    const totals = this.totalsByMetric;
    return totals.length > 0 ? totals[0].value : 0;
  }

  barWidth(value: number): string {
    const max = this.maxMetricTotal;
    if (!max) return '0%';
    return `${Math.max(6, Math.round((value / max) * 100))}%`;
  }

  isUnlimited(value: unknown): boolean {
    return Number(value) === 0;
  }
}
