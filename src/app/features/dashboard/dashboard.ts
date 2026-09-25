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
import { ProgressBar } from 'primeng/progressbar';

import { SessionStore } from '../../core/services/session.store';
import { TenantConfigService } from '../tenant-config/services/tenant-config.service';
import {
  PolicyDefinition,
  TenantConfig,
  TenantUsage,
} from '../tenant-config/interfaces/tenant-config.interface';

interface UsageRow {
  period: string;
  metric: string;
  value: number;
}

interface MetricTotal {
  metric: string;
  value: number;
}

interface PolicyItem {
  key: string;
  label: string;
  value: unknown;
  unit?: string;
}

type QuotaState = 'ok' | 'warn' | 'danger' | 'unlimited';

interface QuotaBar {
  key: string;
  label: string;
  limit: number;
  used: number;
  unit?: string;
  metric: string;
  unlimited: boolean;
  exceeded: boolean;
  percent: number;
  state: QuotaState;
}

/**
 * Mapea cada política de cuota con la métrica de uso reportada que la
 * consume (mismo criterio que el reporte "Uso vs cuotas").
 */
const QUOTA_USAGE_MAP: Record<string, string> = {
  'channels.sms.monthlyLimit': 'sms.sent',
  'channels.audio.monthlyLimit': 'audio.sent',
  'channels.email.monthlyLimit': 'email.sent',
  'channels.whatsapp.monthlyLimit': 'whatsapp.sent',
  'messages.texto.limit': 'sms.sent',
  'messages.audio.limit': 'audio.sent',
  'messages.bolsa.utilidad': 'whatsapp.utilidad',
  'messages.bolsa.marketingComercial': 'whatsapp.marketingComercial',
  'messages.bolsa.autenticacion': 'whatsapp.autenticacion',
  'messages.bolsa.servicio': 'whatsapp.servicio',
};

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    InputText,
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
  loading = false;

  catalog: PolicyDefinition[] = [];
  config: TenantConfig | null = null;
  configValues: Record<string, any> = {};
  usage: TenantUsage[] = [];

  ngOnInit(): void {
    const claims = this.session.getClaims();
    this.company = claims?.company ?? '';
    this.tenantId = claims?.tenantId ?? claims?.company ?? '';
    this.period = new Date().toISOString().slice(0, 7);
    this.loadAll();
  }

  loadAll(): void {
    this.loadCatalog();
    this.loadConfig();
    this.loadUsage();
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
    return this.catalog
      .filter(
        (def) =>
          (def.key.startsWith('channels.') &&
            def.key.endsWith('.monthlyLimit')) ||
          def.key.startsWith('messages.') ||
          def.key.startsWith('limits.'),
      )
      .map((def) => ({
        key: def.key,
        label: def.label,
        value: this.configValues[def.key],
        unit: def.unit,
      }));
  }

  get usedByMetric(): Map<string, number> {
    const map = new Map<string, number>();
    this.totalsByMetric.forEach((item) => map.set(item.metric, item.value));
    return map;
  }

  /** Cuotas numéricas con su barra de carga (uso vs límite). */
  get quotaBars(): QuotaBar[] {
    const used = this.usedByMetric;
    return this.quotas.map((quota) => {
      const limit = Number(quota.value) || 0;
      const unlimited = limit <= 0;
      const metric = QUOTA_USAGE_MAP[quota.key] || '';
      const usedValue = metric ? used.get(metric) || 0 : 0;
      const percent = unlimited
        ? 100
        : Math.min(100, Math.round((usedValue / limit) * 100));
      const exceeded = !unlimited && usedValue > limit;
      const state: QuotaState = unlimited
        ? 'unlimited'
        : exceeded || percent >= 90
          ? 'danger'
          : percent >= 80
            ? 'warn'
            : 'ok';
      return {
        key: quota.key,
        label: quota.label,
        limit,
        used: usedValue,
        unit: quota.unit,
        metric,
        unlimited,
        exceeded,
        percent,
        state,
      };
    });
  }

  get rows(): UsageRow[] {
    return this.usage.flatMap((item) =>
      Object.entries(item.metrics || {}).map(([metric, value]) => ({
        period: item.period,
        metric,
        value: Number(value) || 0,
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
