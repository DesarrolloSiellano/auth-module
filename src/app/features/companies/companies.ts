import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { Dialog } from 'primeng/dialog';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { PERMISSION_FORM } from '../../shared/forms/permission.form';
import { Button } from 'primeng/button';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { Companies } from './interfaces/companies.interface';
import { CompaniesService } from './services/companies.service';
import { COMPANIES_FORM } from '../../shared/forms/companies.form';
import { TenantPoliciesDialogComponent } from '../tenant-config/tenant-policies-dialog';

@Component({
  selector: 'app-companies',
  imports: [
    CommonModule,
    ListTemplateComponent,
    Dialog,
    FormTemplateComponent,
    Button,
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

  extraActions = [
    { key: 'policies', icon: 'pi pi-shield', tooltip: 'Políticas', severity: 'secondary' },
    { key: 'usage', icon: 'pi pi-chart-bar', tooltip: 'Uso', severity: 'secondary' },
  ];

  policiesDialogVisible = false;
  policiesDialogTab: 'policies' | 'usage' = 'policies';
  selectedCompanyForPolicies: Companies | null = null;

  constructor() {
    super(
      inject(CompaniesService),
      inject(ChangeDetectorRef),
      inject(DataLoaderService),
      inject(ExcelExportService),
      inject(ConfirmService),
    );
  }

  onExtraAction(event: { key: string; row: unknown }): void {
    const company = event.row as Companies;
    this.selectedCompanyForPolicies = company;
    this.policiesDialogTab = event.key === 'usage' ? 'usage' : 'policies';
    this.policiesDialogVisible = true;
    this.cdr.detectChanges();
  }
}
