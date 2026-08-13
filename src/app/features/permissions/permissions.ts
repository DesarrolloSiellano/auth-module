import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { DialogModule } from 'primeng/dialog';
import { PermissionService } from './services/permission.service';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { PERMISSION_FORM } from '../../shared/forms/permission.form';
import { ButtonModule } from 'primeng/button';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { ToastModule } from 'primeng/toast';
import { Permission } from './interfaces/permission.interface';
import { BaseCrud } from '../../shared/helpers/base-crud';

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
  templateUrl: './permissions.html',
  styleUrl: './permissions.scss',
  providers: [
    PermissionService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
  ],
})
export class PermissionsComponent extends BaseCrud<Permission> {
  @ViewChild(FormTemplateComponent) declare formComponent?: FormTemplateComponent;

  cols = [
    { field: 'name', header: 'Nombre' },
    { field: 'action', header: 'Acción' },
    { field: 'isActive', header: 'Activo' },
    { field: 'resource', header: 'Recurso' },
    { field: 'description', header: 'Descripción' },
  ];

  override title = 'Permisos';
  override subtitle = 'Permiso';

  protected override form = PERMISSION_FORM;

  constructor(
    protected override service: PermissionService,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }






}
