import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { DatePicker } from 'primeng/datepicker';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { SessionStore } from '../../core/services/session.store';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { Companies } from './interfaces/companies.interface';
import { CompaniesService } from './services/companies.service';
import { COMPANIES_FORM } from '../../shared/forms/companies.form';
import { TenantPoliciesDialogComponent } from '../tenant-config/tenant-policies-dialog';
import { finalize } from 'rxjs/operators';

interface RowAction {
  key: string;
  icon: string;
  tooltip?: string;
  severity?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-companies',
  imports: [
    CommonModule,
    FormsModule,
    ListTemplateComponent,
    Dialog,
    FormTemplateComponent,
    Button,
    Textarea,
    DatePicker,
    TenantPoliciesDialogComponent,
  ],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
  providers: [
    CompaniesService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
  ],
})
export class CompaniesComponent extends BaseCrud<Companies> {
  @ViewChild(FormTemplateComponent)
  declare formComponent?: FormTemplateComponent;

  private readonly session = inject(SessionStore);

  /** Solo el SuperAdmin puede bloquear/desbloquear compañías. */
  get isSuperAdminUser(): boolean {
    return this.session.getClaims()?.isSuperAdmin === true;
  }

  cols = [
    { field: 'name', header: 'Nombre' },
    { field: 'legalRepresentative', header: 'Representante Legal' },
    { field: 'id', header: 'RUT/NIT' },
    { field: 'isActive', header: 'Activo' },
    { field: 'phone', header: 'Teléfono' },
    { field: 'address', header: 'Dirección' },
    { field: 'email', header: 'Correo Electrónico' },
  ];

  override title = 'Compañias';
  override subtitle = 'Compañia';

  protected override form = COMPANIES_FORM;

  policiesDialogVisible = false;
  selectedCompanyForPolicies: Companies | null = null;

  blockDialogVisible = false;
  blockTarget: Companies | null = null;
  blockReason = '';
  blockUntil: Date | null = null;
  isBlocking = false;

  constructor() {
    super(
      inject(CompaniesService),
      inject(ChangeDetectorRef),
      inject(DataLoaderService),
      inject(ExcelExportService),
      inject(ConfirmService),
    );
  }

  /** Acciones por fila: políticas y bloquear/desbloquear. */
  actionsForCompany = (row: Companies): RowAction[] => {
    const actions: RowAction[] = [
      { key: 'policies', icon: 'pi pi-shield', tooltip: 'Políticas', severity: 'secondary' },
    ];

    // Bloquear/desbloquear compañías es exclusivo del SuperAdmin.
    if (this.isSuperAdminUser) {
      if (row?.isBlocked) {
        actions.push({
          key: 'unblock',
          icon: 'pi pi-lock-open',
          tooltip: 'Desbloquear compañía',
          severity: 'success',
        });
      } else {
        actions.push({
          key: 'block',
          icon: 'pi pi-lock',
          tooltip: 'Bloquear compañía',
          severity: 'danger',
        });
      }
    }

    return actions;
  };

  onExtraAction(event: { key: string; row: unknown }): void {
    const company = event.row as Companies;

    if (
      (event.key === 'block' || event.key === 'unblock') &&
      !this.isSuperAdminUser
    ) {
      this.confirmService.showMessage(
        'warn',
        'Acción no permitida',
        'Solo un SuperAdmin puede bloquear compañías',
      );
      return;
    }

    if (event.key === 'block') {
      this.openBlockDialog(company);
      return;
    }

    if (event.key === 'unblock') {
      void this.unblockCompany(company);
      return;
    }

    this.selectedCompanyForPolicies = company;
    this.policiesDialogVisible = true;
    this.cdr.detectChanges();
  }

  openBlockDialog(company: Companies): void {
    this.blockTarget = company;
    this.blockReason = '';
    this.blockUntil = null;
    this.blockDialogVisible = true;
    this.cdr.detectChanges();
  }

  cancelBlock(): void {
    this.blockDialogVisible = false;
    this.blockTarget = null;
  }

  confirmBlock(): void {
    const company = this.blockTarget;
    if (!company || this.isBlocking) return;

    this.isBlocking = true;
    const until = this.blockUntil ? this.blockUntil.toISOString() : undefined;

    (this.service as CompaniesService)
      .block(company._id, { reason: this.blockReason.trim() || 'manual', until })
      .pipe(
        finalize(() => {
          this.isBlocking = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.confirmService.showMessage(
            'success',
            'Bloqueo',
            'La compañía fue bloqueada correctamente',
          );
          this.blockDialogVisible = false;
          this.blockTarget = null;
          this.rechargeTable();
        },
        error: (err: unknown) => console.error(err),
      });
  }

  async unblockCompany(company: Companies): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      company.name,
      'Desbloqueo de compañía',
      '¿Estás seguro de desbloquear a',
      'pi pi-lock-open',
      'Cancelar',
      'Aceptar',
      'secondary',
      'success',
    );
    if (!confirmed) return;

    (this.service as CompaniesService).unblock(company._id).subscribe({
      next: () => {
        this.confirmService.showMessage(
          'success',
          'Desbloqueo',
          'La compañía fue desbloqueada correctamente',
        );
        this.rechargeTable();
      },
      error: (err: unknown) => console.error(err),
    });
  }
}
