import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { RolesServices } from './services/roles';
import { Rol } from './interface/rol.interface';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';

import { BaseCrud } from '../../shared/helpers/base-crud'; // Ajusta la ruta
import { ROLES_FORM } from '../../shared/forms/roles.form';
import { FormFieldConfig } from '../../shared/forms/form-field.model';
import { PermissionService } from '../permissions/services/permission.service';
import { Permission } from '../permissions/interfaces/permission.interface';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    ListTemplateComponent,
    FormTemplateComponent,
    Dialog,
    Button,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
  providers: [
    RolesServices,
    PermissionService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
  ],
})
export class RolesComponent extends BaseCrud<Rol> implements OnInit {
  @ViewChild(FormTemplateComponent) declare formComponent:
    | FormTemplateComponent
    | undefined;
  updatedFormFields: FormFieldConfig[] = [];

  cols = [
    { field: 'name', header: 'Nombre' },
    { field: 'codeRol', header: 'Código' },
    { field: 'isActive', header: 'Activo' },
    { field: 'description', header: 'Descripción' },
  ];

  override title = 'Roles';
  override subtitle = 'Rol';

  protected override form = ROLES_FORM;


  private readonly permissionService = inject(PermissionService);

  constructor() {
    super(
      inject(RolesServices),
      inject(ChangeDetectorRef),
      inject(DataLoaderService),
      inject(ExcelExportService),
      inject(ConfirmService),
    );
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    forkJoin({
      permissionData: this.permissionService.findAll(),
    }).subscribe(({ permissionData }) => {
      const types = (permissionData.data || []).filter((perm) => perm.isActive);
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

  override onSelectionChange(selectedItem: Rol | undefined) {
    if (selectedItem) {
      // Buscar el campo permissions en this.form para obtener options
      const permissionsField = this.form.find(
        (field) => field.name === 'permissions'
      );
      const options = (permissionsField?.options ?? []) as {
        name: string;
        value: Permission;
      }[];

      // Mapear los permisos seleccionados para reemplazarlos por referencias de options
      const selectedPermissions = (selectedItem.permissions || []).map(
        (perm) => {
          return options.find((opt) => opt.name === perm.name) || perm;
        }
      );

      // Asignar initialData con permisos corregidos para mantener referencias
      this.initialData = {
        ...this.initialData,
        ...selectedItem,
        permissions: selectedPermissions,
      } as Rol;

      this.isEditForm = true;
      this.titleForm = 'Edición de ' + this.title;
      this.isFormVisible = true;
      this.isDisplayForm = true;
    }
  }
}
