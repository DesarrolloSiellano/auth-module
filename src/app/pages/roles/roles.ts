import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RolesServices } from './services/roles';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Rol } from './interface/rol.interface';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';

import { BaseCrud } from '../../shared/helpers/base-crud'; // Ajusta la ruta
import { ROLES_FORM } from '../../shared/forms/roles.form';
import { PermissionService } from '../permissions/services/permission.service';
import { forkJoin } from 'rxjs';

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
    PermissionService,
    MessageService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
  ],
})
export class RolesComponent extends BaseCrud<Rol> implements OnInit {
  @ViewChild(FormTemplateComponent) declare formComponent:
    | FormTemplateComponent
    | undefined;
  updatedFormFields: any[] = [];

  cols = [
    { field: 'name', header: 'Nombre' },
    { field: 'codeRol', header: 'Código' },
    { field: 'isActive', header: 'Activo' },
    { field: 'description', header: 'Descripción' },
  ];

  override title = 'Roles';

  protected override form = ROLES_FORM;


  constructor(
    protected override service: RolesServices,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService,
    private permissionService: PermissionService
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    forkJoin({
      permissionData: this.permissionService.findAll(),
    }).subscribe(({ permissionData }) => {
      const types =
        permissionData.data.filter((perm: any) => perm.isActive) || [];
      const typeOptions = types.map((item) => ({
        name: item.name,
        value: item,
      }));

      // Actualizar el form con las opciones dinámicas para el campo 'permissions'
      this.updatedFormFields = this.form.map((field) => {
        if (field.name === 'permissions') {
          return { ...field, options: typeOptions };
        }
        return field;
      });

      this.form = this.updatedFormFields;
      this.cdr.detectChanges();
    });
  }

  override onSelectionChange(selectedItem: any) {
    if (selectedItem) {
      // Buscar el campo permissions en this.form para obtener options
      const permissionsField = this.form.find(
        (field: any) => field.name === 'permissions'
      );
      const options = permissionsField ? permissionsField.options : [];

      // Mapear los permisos seleccionados para reemplazarlos por referencias de options
      const selectedPermissions = (selectedItem.permissions || []).map(
        (perm: any) => {
          return options?.find((opt: any) => opt.name === perm.name) || perm;
        }
      );

      // Asignar initialData con permisos corregidos para mantener referencias
      this.initialData = {
        ...this.initialData,
        ...selectedItem,
        permissions: selectedPermissions,
      };

      this.isEditForm = true;
      this.titleForm = 'Edición de ' + this.title;
      this.isFormVisible = true;
      this.isDisplayForm = true;
    }
  }
}
