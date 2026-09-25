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

import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { Companies } from '../companies/interfaces/companies.interface';
import { TenantConfigService } from './services/tenant-config.service';
import {
  PolicyDefinition,
  TenantConfig,
  TenantUsage,
} from './interfaces/tenant-config.interface';

interface PolicyGroup {
  group: string;
  items: PolicyDefinition[];
}

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

  usageRows(usage: TenantUsage): { metric: string; value: number }[] {
    return Object.keys(usage.metrics || {}).map((metric) => ({
      metric,
      value: usage.metrics[metric],
    }));
  }
}
