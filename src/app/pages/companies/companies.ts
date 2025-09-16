import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { DialogModule } from 'primeng/dialog';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { PERMISSION_FORM } from '../../shared/forms/permission.form';
import { ButtonModule } from 'primeng/button';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { ToastModule } from 'primeng/toast';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { Companies } from './interfaces/companies.interface';
import { CompaniesService } from './services/companies.service';
import { COMPANIES_FORM } from '../../shared/forms/companies.form';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ListTemplateComponent,
    DialogModule,
    FormTemplateComponent,
    ButtonModule,
    ToastModule,
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
  @ViewChild(FormTemplateComponent) declare formComponent?: FormTemplateComponent;

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

  constructor(
    protected override service: CompaniesService,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }






}
