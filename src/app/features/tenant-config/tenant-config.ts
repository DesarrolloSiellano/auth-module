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
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Select } from 'primeng/select';

import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { TenantConfigService } from './services/tenant-config.service';
import { PolicyDefinition } from './interfaces/tenant-config.interface';

@Component({
  selector: 'app-tenant-config',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Dialog,
    Button,
    InputText,
    InputNumber,
    ToggleSwitch,
    Select,
  ],
  templateUrl: './tenant-config.html',
  styleUrl: './tenant-config.scss',
  providers: [TenantConfigService],
})
export class TenantConfigComponent implements OnInit {
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly confirmService = inject(ConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  catalog: PolicyDefinition[] = [];
  saving = false;
  processing = false;

  definitionDialogVisible = false;
  isEditingDefinition = false;
  definitionForm: any = this.emptyDefinition();
  definitionTypes = [
    { label: 'Booleano', value: 'boolean' },
    { label: 'Número', value: 'number' },
    { label: 'Texto', value: 'text' },
    { label: 'Selección', value: 'select' },
    { label: 'JSON', value: 'json' },
  ];

  ngOnInit(): void {
    this.loadCatalog();
  }

  private emptyDefinition(): any {
    return {
      key: '',
      label: '',
      description: '',
      group: 'general',
      type: 'boolean',
      defaultValue: '',
      unit: '',
      order: 0,
      isActive: true,
    };
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

  openCreateDefinition(): void {
    this.isEditingDefinition = false;
    this.definitionForm = this.emptyDefinition();
    this.definitionDialogVisible = true;
  }

  openEditDefinition(def: PolicyDefinition): void {
    this.isEditingDefinition = true;
    this.definitionForm = {
      ...def,
      defaultValue:
        typeof def.defaultValue === 'object'
          ? JSON.stringify(def.defaultValue)
          : def.defaultValue,
    };
    this.definitionDialogVisible = true;
  }

  saveDefinition(): void {
    if (this.saving) return;
    this.saving = true;
    const dto: any = { ...this.definitionForm };
    dto.defaultValue = this.parseByType(dto.type, dto.defaultValue);
    dto.order = Number(dto.order) || 0;

    const request$ = this.isEditingDefinition
      ? this.tenantConfigService.updateDefinition(dto.key, dto)
      : this.tenantConfigService.createDefinition(dto);

    request$
      .pipe(
        finalize(() => (this.saving = false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
      next: () => {
        this.definitionDialogVisible = false;
        this.confirmService.showMessage(
          'success',
          'Política',
          'Definición guardada correctamente',
        );
        this.loadCatalog();
      },
      error: (err: any) => {
        this.confirmService.showMessage(
          'error',
          'Política',
          err?.error?.message || 'No se pudo guardar la definición',
        );
        this.cdr.detectChanges();
      },
    });
  }

  private parseByType(type: string, value: any): any {
    switch (type) {
      case 'boolean':
        return value === true || value === 'true';
      case 'number':
        return value === '' || value === null ? 0 : Number(value);
      case 'json':
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  async deleteDefinition(def: PolicyDefinition): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    const confirmed = await this.confirmService.confirm(
      def.label,
      'Eliminar política',
      '¿Seguro que deseas eliminar la definición',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Eliminar',
      'secondary',
      'danger',
    );
    if (!confirmed) {
      this.processing = false;
      return;
    }

    this.tenantConfigService
      .deleteDefinition(def.key)
      .pipe(
        finalize(() => (this.processing = false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmService.showMessage(
            'success',
            'Política',
            'Definición eliminada',
          );
          this.loadCatalog();
        },
        error: (err: any) => {
          this.confirmService.showMessage(
            'error',
            'Política',
            err?.error?.message || 'No se pudo eliminar la definición',
          );
          this.cdr.detectChanges();
        },
      });
  }
}
