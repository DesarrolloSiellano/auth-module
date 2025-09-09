import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RolesServices } from './services/roles';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { Rol } from './interface/rol.interface';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';

import { BaseCrud } from '../../shared/helpers/base-crud'; // Ajusta la ruta
import { PERMISSION_FORM } from '../../shared/forms/permission.form';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ListTemplateComponent,
    FormTemplateComponent,
    DialogModule,
    ButtonModule,
    ToastModule,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
  providers: [
    RolesServices,
    ConfirmationService,
    MessageService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
  ]
})
export class RolesComponent extends BaseCrud<Rol> {

  @ViewChild(FormTemplateComponent)declare formComponent: FormTemplateComponent | undefined;

  cols = [
    { field: 'name', header: 'Nombre' },
    { field: 'codeRol', header: 'Código' },
    { field: 'isActive', header: 'Activo' },
    { field: 'description', header: 'Descripción' },
  ];

  protected override form = PERMISSION_FORM;

  // Asumiendo que aquí iría el form específico para roles, si lo tienes
  // form = ROL_FORM; // importarlo y definirlo si aplica

  constructor(
    protected override service: RolesServices,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService


  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }


}
