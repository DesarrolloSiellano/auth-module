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
import {
  FormValidationUtils,
  getNoSpace,
} from '../../shared/validations/validations-message';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { forkJoin, last } from 'rxjs';
import { RolesServices } from '../roles/services/roles';
import { ModuleService } from '../modules/services/module.service';
import { PermissionService } from '../permissions/services/permission.service';
import { Permission } from '../permissions/interfaces/permission.interface';
import { CompaniesService } from '../companies/services/companies.service';
import { AutoComplete } from 'primeng/autocomplete';
import { MultiSelect } from 'primeng/multiselect';

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
    AutoComplete,
    MultiSelect,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  providers: [
    UserService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
    RolesServices,
    ModuleService,
    PermissionService,
  ],
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

  permissionsOptions: any[] = [];
  rolesOptions: any[] = [];
  modulesOptions: any[] = [];
  companiesOptions: any[] = [];

  override title = 'Usuarios';
  override subtitle = 'Usuario';

  itemsAutocomplete: any[] = [];

  constructor(
    protected override service: UserService,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private rolesService: RolesServices,
    private moduleService: ModuleService,
    private companiesService: CompaniesService
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      //username: ['', Validators.required],
      password: [''],
      isActived: [true],
      isAdmin: [false],
      isSuperAdmin: [false],
      company: [''],
      modules: [[], Validators.required],
      roles: [[], Validators.required],
      permissions: [[], Validators.required],
    });

    this.loadOptions();
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.userForm.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }

  private loadOptions(): void {
    forkJoin({
      permissionData: this.permissionService.findAll(),
      modulesData: this.moduleService.findAll(),
      rolesData: this.rolesService.findAll(),
      companyData: this.service.findAll(),
    }).subscribe(({ permissionData, modulesData, rolesData }) => {

      const peermissions =
        permissionData.data.filter((perm: any) => perm.isActive) || [];
      this.permissionsOptions = peermissions.map((item) => ({
        name: item.name,
        value: item,
      }));

      const modules = modulesData.data.filter((mod: any) => mod.isActive) || [];
      this.modulesOptions = modules.map((item) => ({
        name: item.name,
        value: item,
      }));

      const roles = rolesData.data.filter((rol: any) => rol.isActive) || [];
      this.rolesOptions = roles.map((item) => ({
        name: item.name,
        value: item,
      }));

      this.cdr.detectChanges();
    });
  }

  findByAutoComplete(event: any) {
    this.companiesService
      .findByAutoComplete(event.query)
      .subscribe((response: any) => {
        this.itemsAutocomplete = response.data;
      });
  }

  updateValidatorsBasedOnEditMode(): void {
    const companiesControl = this.userForm.get('company');
    const passwordControl = this.userForm.get('password');

    if (this.isEditForm) {
      companiesControl?.clearValidators();
      passwordControl?.clearValidators();
    } else {
      companiesControl?.setValidators(Validators.required);
      passwordControl?.setValidators(Validators.required);
    }
    companiesControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
  }

  override create(): void {
    this.titleForm = 'Creación de ' + this.subtitle;
    this.isFormVisible = true;
    this.isDisplayForm = true;
    this.isEditForm = false;
    this.updateValidatorsBasedOnEditMode();
    this.cdr.detectChanges();
  }

  override onSelectionChange(selectedItem: any) {
    console.log(selectedItem);

    this.isDisplayForm = true;
    this.isEditForm = true;
    this.titleForm = 'Edición de ' + this.subtitle;
    this.isFormVisible = true;
    this.updateValidatorsBasedOnEditMode();
    this.cdr.detectChanges();

    // Mapear permisos seleccionados con las opciones reales
    const mappedPermissions = (selectedItem.permissions || []).map(
      (perm: any) => {
        return (
          this.permissionsOptions.find((opt) => opt.name === perm.name)
            ?.value || perm
        );
      }
    );

    // Mapear roles seleccionados con las opciones reales
    const mappedRoles = (selectedItem.roles || []).map((rol: any) => {
      return (
        this.rolesOptions.find((opt) => opt.name === rol.name)?.value || rol
      );
    });

    // Mapear módulos seleccionados con las opciones reales
    const mappedModules = (selectedItem.modules || []).map((mod: any) => {
      return (
        this.modulesOptions.find((opt) => opt.name === mod.name)?.value || mod
      );
    });

    this.userForm.patchValue({
      name: selectedItem.name,
      lastName: selectedItem.lastName,
      phone: selectedItem.phone,
      email: selectedItem.email,
      isActived: selectedItem.isActived,
      isAdmin: selectedItem.isAdmin,
      isSuperAdmin: selectedItem.isSuperAdmin,
      permissions: mappedPermissions,
      roles: mappedRoles,
      modules: mappedModules,
    });

    this.initialData = {
      ...this.initialData,
      ...selectedItem,
    };
  }

  override getFormattedFormValues(): any {
    const values = { ...this.userForm?.value };
    return values;
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.save();
    }
  }
}
