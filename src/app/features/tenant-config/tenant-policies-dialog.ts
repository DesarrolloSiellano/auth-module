import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ProgressBar } from 'primeng/progressbar';

import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { Companies } from '../companies/interfaces/companies.interface';
import { TenantConfigService } from './services/tenant-config.service';
import {
  PolicyDefinition,
  TenantConfig,
  TenantUsage,
} from './interfaces/tenant-config.interface';
import {
  buildQuotaBars,
  buildUsagePeriods,
  currentPeriod,
  flattenMetrics,
  toQuotaItems,
  QuotaBar,
} from './helpers/usage.helper';

interface PolicyGroup {
  group: string;
  items: PolicyDefinition[];
}

/**
 * Políticas de bolsas de mensajes de WhatsApp. Aplican a las conexiones por
 * API (BYO) con credenciales propias del tenant.
 */
const WHATSAPP_MESSAGE_POLICY_KEYS = [
  'messages.bolsa.utilidad',
  'messages.bolsa.marketingComercial',
  'messages.bolsa.autenticacion',
  'messages.bolsa.servicio',
];

const WHATSAPP_GLOBAL_BAG_KEY = 'channels.whatsapp.monthlyLimit';
const WHATSAPP_BALANCE_KEY = 'messages.bolsa.utilidad';

@Component({
  selector: 'app-tenant-policies-dialog',
  imports: [
    CommonModule,
    FormsModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    Dialog,
    Button,
    InputText,
    InputNumber,
    ToggleSwitch,
    Select,
    Textarea,
    ProgressBar,
  ],
  templateUrl: './tenant-policies-dialog.html',
  styleUrl: './tenant-policies-dialog.scss',
  providers: [TenantConfigService],
})
export class TenantPoliciesDialogComponent implements OnChanges {
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly confirmService = inject(ConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input() visible = false;
  @Input() company: Companies | null = null;
  @Input() initialTab: 'policies' | 'usage' = 'policies';
  @Output() visibleChange = new EventEmitter<boolean>();

  activeTab: 'policies' | 'usage' = 'policies';

  catalog: PolicyDefinition[] = [];
  catalogGroups: PolicyGroup[] = [];
  configValues: Record<string, unknown> = {};
  isSavingConfig = false;

  usage: TenantUsage[] = [];
  usagePeriod = '';
  usagePeriods: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.onOpen();
    }
  }

  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  private onOpen(): void {
    this.activeTab = this.initialTab;
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
        this.catalogGroups = this.groupCatalog(this.catalog);
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private groupCatalog(items: PolicyDefinition[]): PolicyGroup[] {
    const map = new Map<string, PolicyDefinition[]>();
    items.forEach((item) => {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries()).map(([group, grouped]) => ({
      group,
      items: grouped,
    }));
  }

  loadConfig(): void {
    if (!this.company) return;
    this.tenantConfigService
      .getConfigByTenant(this.company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        const config: TenantConfig = res.data;
        const values: Record<string, unknown> = {};
        this.catalog.forEach((def) => {
          values[def.key] = def.defaultValue;
        });
        Object.assign(values, (config?.values as Record<string, unknown>) || {});
        this.configValues = values;
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  /** Períodos existentes con consumo; mes actual como fallback. */
  loadUsagePeriods(): void {
    if (!this.company) return;
    this.tenantConfigService
      .listUsagePeriods(this.company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const existing = buildUsagePeriods(res.data || []);
          this.usagePeriods = existing.length ? existing : [currentPeriod()];
          if (!this.usagePeriods.includes(this.usagePeriod)) {
            this.usagePeriod = this.usagePeriods[0];
          }
          this.loadUsage();
        },
        error: () => this.cdr.detectChanges(),
      });
  }

  loadUsage(): void {
    if (!this.company) return;
    this.tenantConfigService
      .getUsage(this.company.id, this.usagePeriod || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.usage = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  saveConfig(): void {
    if (!this.company || this.isSavingConfig) return;
    this.isSavingConfig = true;
    this.tenantConfigService
      .upsertConfig(this.company.id, {
        company: this.company.name,
        values: this.configValues,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSavingConfig = false;
          this.confirmService.showMessage(
            'success',
            'Políticas',
            'Políticas guardadas correctamente',
          );
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.isSavingConfig = false;
          this.confirmService.showMessage(
            'error',
            'Políticas',
            err?.error?.message || 'No se pudieron guardar las políticas',
          );
          this.cdr.detectChanges();
        },
      });
  }

  get globalBagValue(): number {
    const value = Number(this.configValues[WHATSAPP_GLOBAL_BAG_KEY] ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  get bagsSum(): number {
    return WHATSAPP_MESSAGE_POLICY_KEYS.reduce(
      (sum, key) => sum + (Number(this.configValues[key]) || 0),
      0,
    );
  }

  /**
   * Mantiene coherencia entre la bolsa global y las bolsas por categoría:
   * al cambiar la global se reparte igual (resto a utilidad); al cambiar una
   * categoría se ajusta `utilidad` para que la suma siga cuadrando.
   */
  onPolicyValueChange(key: string, value: unknown): void {
    this.configValues[key] = value;

    if (key === WHATSAPP_GLOBAL_BAG_KEY) {
      this.distributeBags(Number(value) || 0);
      return;
    }
    if (WHATSAPP_MESSAGE_POLICY_KEYS.includes(key) && this.globalBagValue > 0) {
      this.balanceBags(key);
    }
  }

  private distributeBags(global: number): void {
    if (!(global > 0)) return;
    const count = WHATSAPP_MESSAGE_POLICY_KEYS.length;
    const base = Math.floor(global / count);
    const remainder = global % count;
    WHATSAPP_MESSAGE_POLICY_KEYS.forEach((key, index) => {
      this.configValues[key] = base + (index === 0 ? remainder : 0);
    });
  }

  private balanceBags(changedKey: string): void {
    if (changedKey === WHATSAPP_BALANCE_KEY) return;
    const others = WHATSAPP_MESSAGE_POLICY_KEYS.filter((k) => k !== WHATSAPP_BALANCE_KEY).reduce(
      (sum, key) => sum + (Number(this.configValues[key]) || 0),
      0,
    );
    this.configValues[WHATSAPP_BALANCE_KEY] = Math.max(this.globalBagValue - others, 0);
  }

  usageRows(usage: TenantUsage): { metric: string; value: number }[] {
    return Object.entries(flattenMetrics(usage.metrics)).map(
      ([metric, value]) => ({ metric, value }),
    );
  }

  /** Filas de consumo del período consultado (métricas ya aplanadas). */
  get usageDetail(): { period: string; metric: string; value: number }[] {
    return this.usage.flatMap((item) =>
      this.usageRows(item).map((row) => ({ period: item.period, ...row })),
    );
  }

  get usedByMetric(): Map<string, number> {
    const map = new Map<string, number>();
    this.usageDetail.forEach((row) =>
      map.set(row.metric, (map.get(row.metric) || 0) + row.value),
    );
    return map;
  }

  /** Totales por métrica ordenados de mayor a menor. */
  get usageTotals(): { metric: string; value: number }[] {
    return Array.from(this.usedByMetric.entries())
      .map(([metric, value]) => ({ metric, value }))
      .sort((a, b) => b.value - a.value);
  }

  get totalUsage(): number {
    return this.usageDetail.reduce((sum, row) => sum + row.value, 0);
  }

  get activeMetrics(): number {
    return this.usageTotals.length;
  }

  get maxMetricTotal(): number {
    return this.usageTotals.length > 0 ? this.usageTotals[0].value : 0;
  }

  metricBarWidth(value: number): string {
    const max = this.maxMetricTotal;
    if (!max) return '0%';
    return `${Math.max(6, Math.round((value / max) * 100))}%`;
  }

  /** Consumo vs límites configurados en el catálogo del tenant. */
  get quotaBars(): QuotaBar[] {
    return buildQuotaBars(
      toQuotaItems(this.catalog, this.configValues),
      this.usedByMetric,
    );
  }
}
