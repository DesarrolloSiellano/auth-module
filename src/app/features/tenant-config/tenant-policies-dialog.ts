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
import { PolicyDefinition, TenantConfig } from './interfaces/tenant-config.interface';

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
  @Output() visibleChange = new EventEmitter<boolean>();

  catalog: PolicyDefinition[] = [];
  catalogGroups: PolicyGroup[] = [];
  configValues: Record<string, unknown> = {};
  isSavingConfig = false;

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
}
