import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { User } from './interfaces/user.interface';
import { UserService } from './services/user';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormValidationUtils } from '../../shared/validations/validations-message';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { forkJoin } from 'rxjs';
import { RolesServices } from '../roles/services/roles';
import { ModuleService } from '../modules/services/module.service';
import { PermissionService } from '../permissions/services/permission.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ListTemplateComponent,
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ToastModule,
    ButtonModule,
    CheckboxModule,
    DividerModule,
    FloatLabelModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  providers: [UserService, DataLoaderService, ExcelExportService, ConfirmService, RolesServices, ModuleService, PermissionService],
})
export class Users extends BaseCrud<User> implements OnInit {
  cols = [
    { field: 'name', header: 'Nombres' },
    { field: 'lastName', header: 'Apellidos' },
    { field: 'email', header: 'Correo Electronico' },
    { field: 'username', header: 'Usuario' },
    { field: 'phone', header: 'Teléfono' },
    { field: 'company', header: 'Empresa' },
  ];

  userForm!: FormGroup;

  override title = 'Módulos';
  override subtitle = 'Módulo';

  constructor(
    protected override service: UserService,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private rolesService: RolesServices,
    private moduleService: ModuleService
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      isActived: [true],
      isAdmin: [false],
      isNewUser: [true],
      company: [''],
      modules: this.fb.control([]),
      roles: this.fb.control([]),
      permissions: this.fb.control([]),
    });
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.userForm.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
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
       /*  this.updatedFormFields = this.form.map((field) => {
          if (field.name === 'permissions') {
            return { ...field, options: typeOptions };
          }
          return field;
        }); */

        //this.form = this.updatedFormFields;
        this.cdr.detectChanges();
      });
    }

  onSubmit() {}
}
