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
  FormsModule,
  Validators,
} from '@angular/forms';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import {
  FormValidationUtils,
} from '../../shared/validations/validations-message';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { forkJoin } from 'rxjs';
import { RolesServices } from '../roles/services/roles';
import { ModuleService } from '../modules/services/module.service';
import { PermissionService } from '../permissions/services/permission.service';
import { CompaniesService } from '../companies/services/companies.service';
import { AutoComplete } from 'primeng/autocomplete';

import { AccordionModule, Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { TabsModule, Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ToggleSwitchModule, ToggleSwitch } from 'primeng/toggleswitch';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import { Button, ButtonModule } from 'primeng/button';
import { Divider, DividerModule } from 'primeng/divider';
import { Toast, ToastModule } from 'primeng/toast';
import { Dialog, DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ListTemplateComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    Dialog,
    ToastModule,
    Toast,
    ButtonModule,
    Button,
    CheckboxModule,
    Checkbox,
    DividerModule,
    Divider,
    FloatLabelModule,
    InputTextModule,
    TextareaModule,
    AutoComplete,
    AccordionModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    TabsModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    ToggleSwitchModule,
    ToggleSwitch,
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
      modules: [[]],
      roles: [[]],
      permissions: [[]],
    });

    this.loadOptions();
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.userForm.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }

  private loadOptions(): void {
    if (this.permissionsOptions.length > 0 && this.modulesOptions.length > 0) return;
    forkJoin({
      permissionData: this.permissionService.findAll(),
      modulesData: this.moduleService.findAll(),
      rolesData: this.rolesService.findAll(),
      companyData: this.companiesService.findAll(),
    }).subscribe({
      next: ({ permissionData, modulesData, rolesData }) => {
        this.permissionsOptions = permissionData.data || [];
        this.modulesOptions = modulesData.data || [];
        this.rolesOptions = rolesData.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading options:', err)
    });
  }

  toggleAll(collection: string, state: boolean): void {
    if (collection === 'permissions') {
      this.userForm.get('permissions')?.setValue(state ? [...this.permissionsOptions] : []);
    } else if (collection === 'roles') {
      this.userForm.get('roles')?.setValue(state ? [...this.rolesOptions] : []);
    }
  }

  toggleModule(module: any, event: any): void {
    module.isActive = event.checked;
    // Si se apaga el módulo, podríamos querer apagar todas sus rutas también? 
    // El usuario pidió edición total, así que lo dejamos a su criterio.
    if (!module.isActive) {
      module.routes?.forEach((r: any) => {
        r.isActive = false;
        r.children?.forEach((child: any) => child.isActive = false);
      });
    } else {
      // Si se activa el módulo, por defecto activamos las rutas?
      module.routes?.forEach((r: any) => r.isActive = true);
    }
  }

  toggleRoute(route: any, event: any): void {
    route.isActive = event.checked;
    if (route.children) {
      route.children.forEach((child: any) => child.isActive = event.checked);
    }
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

  getRouteIcon(iconName: string): string {
    return iconName ? `pi pi-${iconName}` : 'pi pi-circle';
  }

  override create(): void {
    this.userForm.reset({
      isActived: true,
      isAdmin: false,
      isSuperAdmin: false,
      permissions: [],
      roles: [],
      modules: JSON.parse(JSON.stringify(this.modulesOptions)).map((m: any) => {
        m.isActive = false;
        const routes = m.routes || m.router || [];
        routes.forEach((r: any) => {
          r.isActive = false;
          (r.children || []).forEach((c: any) => (c.isActive = false));
        });
        m.routes = routes; // Normalizar a 'routes' en el formulario
        return m;
      })
    });
    this.titleForm = 'Creación de ' + this.subtitle;
    this.isFormVisible = true;
    this.isDisplayForm = true;
    this.isEditForm = false;
    this.updateValidatorsBasedOnEditMode();
    this.cdr.detectChanges();
  }

  override onSelectionChange(selectedItem: any) {


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
          this.permissionsOptions.find((opt: any) => opt.name === perm.name) || perm
        );
      }
    );

    // Mapear roles seleccionados con las opciones reales
    const mappedRoles = (selectedItem.roles || []).map((rol: any) => {
      return (
        this.rolesOptions.find((opt: any) => opt.name === rol.name) || rol
      );
    });

    // Mapear módulos: Mostrar todos los del sistema, pero con el estado del usuario si ya los tiene
    const mappedModules = this.modulesOptions.map((systemMod: any) => {
      // Intentar encontrar el módulo en el usuario por nombre o ID
      const userMod = (selectedItem.modules || []).find(
        (m: any) => m.name === systemMod.name || m._id === systemMod._id
      );

      // Normalizar la propiedad de rutas (puede venir como 'routes' o 'router')
      const getRoutes = (obj: any) => obj?.routes || obj?.router || [];
      const systemRoutes = getRoutes(systemMod);
      const userRoutes = getRoutes(userMod);

      if (userMod) {
        return {
          ...JSON.parse(JSON.stringify(systemMod)),
          isActive: userMod.isActive,
          routes: systemRoutes.map((systemRoute: any) => {
            const userRoute = userRoutes.find(
              (r: any) => r.name === systemRoute.name || r.path === systemRoute.path
            );

            if (userRoute) {
              const systemChildren = systemRoute.children || [];
              const userChildren = userRoute.children || [];

              return {
                ...JSON.parse(JSON.stringify(systemRoute)),
                isActive: userRoute.isActive,
                children: systemChildren.map((systemChild: any) => {
                  const userChild = userChildren.find(
                    (c: any) => c.name === systemChild.name || c.path === systemChild.path
                  );
                  return {
                    ...JSON.parse(JSON.stringify(systemChild)),
                    isActive: userChild ? userChild.isActive : false,
                  };
                }),
              };
            }
            // Si el usuario no tiene la ruta registrada, se muestra inactiva
            return {
              ...JSON.parse(JSON.stringify(systemRoute)),
              isActive: false,
              children: (systemRoute.children || []).map((c: any) => ({
                ...c,
                isActive: false,
              })),
            };
          }),
        };
      }

      // Si el usuario no tiene el módulo, lo mostramos como inactivo pero con toda su estructura disponible
      const newMod = JSON.parse(JSON.stringify(systemMod));
      newMod.isActive = false;
      newMod.routes = systemRoutes.map((r: any) => {
        const routeCopy = { ...r, isActive: false };
        if (routeCopy.children) {
          routeCopy.children = routeCopy.children.map((c: any) => ({
            ...c,
            isActive: false,
          }));
        }
        return routeCopy;
      });
      return newMod;
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
