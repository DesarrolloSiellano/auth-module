import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  ViewChild,
} from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { Dialog } from 'primeng/dialog';
import { PermissionService } from './services/permission.service';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { PERMISSION_FORM } from '../../shared/forms/permission.form';
import { Button } from 'primeng/button';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { Permission } from './interfaces/permission.interface';
import { BaseCrud } from '../../shared/helpers/base-crud';

@Component({
  selector: 'app-permissions',
  imports: [
    CommonModule,
    ListTemplateComponent,
    Dialog,
    FormTemplateComponent,
    Button,
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

  constructor() {
    super(
      inject(PermissionService),
      inject(ChangeDetectorRef),
      inject(DataLoaderService),
      inject(ExcelExportService),
      inject(ConfirmService),
    );
  }






}
