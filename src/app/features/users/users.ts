import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { TableExportService } from '../../shared/services/table-export.service';
import { FloatLabel } from 'primeng/floatlabel';
import { FormValidationUtils } from '../../shared/validations/validations-message';
import { InputText } from 'primeng/inputtext';
import { forkJoin } from 'rxjs';
import { Subject, of, Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  finalize,
} from 'rxjs/operators';
import { RolesServices } from '../roles/services/roles';
import { ModuleService } from '../modules/services/module.service';
import { PermissionService } from '../permissions/services/permission.service';
import { CompaniesService } from '../companies/services/companies.service';
import { Permission } from '../permissions/interfaces/permission.interface';
import { Rol } from '../roles/interface/rol.interface';
import { Companies } from '../companies/interfaces/companies.interface';
import { AutoComplete } from 'primeng/autocomplete';
import { SessionStore } from '../../core/services/session.store';

interface UserRoute {
  _id?: string;
  name: string;
  path: string;
  initPath?: string;
  icon?: string;
  isActive?: boolean | null;
  children?: UserRoute[];
}

interface UserModule {
  _id?: string;
  name: string;
  description?: string;
  isActive?: boolean | null;
  isSystemModule?: boolean;
  routes?: UserRoute[];
  router?: UserRoute[];
}

interface ToggleChangeEvent {
  checked: boolean;
}

interface AvailabilityCheckResult {
  exists: boolean;
  checked: boolean;
}

import {
  Accordion,
  AccordionPanel,
  AccordionHeader,
  AccordionContent,
} from 'primeng/accordion';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Dialog } from 'primeng/dialog';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import FileSaver from 'file-saver';
import {
  AvailabilityStatus,
  BulkUserAction,
  MassivePreviewRow,
  MassiveReportMessage,
  MassiveUploadReport,
  SavedFilter,
  CustomFieldDefinition,
} from './interfaces/user.interface';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BASE_REQUIRED_EXCEL_HEADERS = [
  'Nombres',
  'Apellidos',
  'Correo Electrónico',
];

// Solo el SuperAdmin indica empresa/tenant en el archivo.
const SUPERADMIN_REQUIRED_EXCEL_HEADERS = ['TenantId', 'Empresa'];

const MAX_MASSIVE_USERS = 50;

@Component({
  selector: 'app-users',
  imports: [
    ListTemplateComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Dialog,
    Button,
    Checkbox,
    Divider,
    FloatLabel,
    InputText,
    AutoComplete,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    ToggleSwitch,
    TableModule,
    Select,
    MultiSelect,
    DatePicker,
    Textarea,
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
    { field: 'company', header: 'Empresa' },
  ];

  userForm!: FormGroup;

  permissionsOptions: Permission[] = [];
  rolesOptions: Rol[] = [];
  modulesOptions: UserModule[] = [];

  override title = 'Usuarios';
  override subtitle = 'Usuario';

  itemsAutocomplete: Companies[] = [];

  // Carga masiva
  isMassiveUploadDialogVisible = false;
  isUploading = false;
  isPreviewing = false;
  previewData: MassivePreviewRow[] = [];
  previewErrors: string[] = [];
  selectedFile: File | null = null;
  uploadReport: MassiveUploadReport | null = null;
  reportMessages: MassiveReportMessage[] = [];

  // Disponibilidad de email/username
  emailStatus: AvailabilityStatus = 'idle';
  usernameStatus: AvailabilityStatus = 'idle';
  emailAvailabilityMessage = '';
  usernameAvailabilityMessage = '';

  // Búsqueda avanzada
  filtersPanelVisible = false;
  usingAdvancedFilters = false;
  activeFilters: Record<string, unknown> | null = null;
  advancedFilters: Record<string, any> = {
    company: '',
    rol: '',
    estado: '',
    isBlocked: '',
    email: '',
    username: '',
    phone: '',
    tags: '',
    groups: '',
    desde: null,
    hasta: null,
    global: '',
  };
  savedFilters: SavedFilter[] = [];
  saveFilterDialogVisible = false;
  savedFilterName = '';

  // Acciones masivas
  bulkSelection: User[] = [];
  isBulkProcessing = false;

  // Guardias anti doble envío
  actionBusy = false;
  exporting = false;

  // Alta con invitación
  inviteUser = false;

  // Bloqueo
  blockDialogVisible = false;
  blockTarget: User | null = null;
  blockReason = '';
  blockUntil: Date | null = null;

  // Asignación masiva de roles/módulos
  bulkAssignDialogVisible = false;
  bulkAssignType: 'assignRoles' | 'assignModules' | null = null;
  bulkAssignSelection: any[] = [];
  bulkAssignTargets: User[] = [];

  // Campos personalizados
  customFieldDefs: CustomFieldDefinition[] = [];

  private readonly emailInput$ = new Subject<string>();
  private readonly usernameInput$ = new Subject<string>();

  private readonly fb = inject(FormBuilder);
  private readonly permissionService = inject(PermissionService);
  private readonly rolesService = inject(RolesServices);
  private readonly moduleService = inject(ModuleService);
  private readonly companiesService = inject(CompaniesService);
  private readonly session = inject(SessionStore);
  private readonly userService = inject(UserService);
  private readonly exporter = inject(TableExportService);
  private readonly destroyRef = inject(DestroyRef);

  get isCheckingAvailability(): boolean {
    return this.emailStatus === 'checking' || this.usernameStatus === 'checking';
  }

  get hasAvailabilityConflict(): boolean {
    return this.emailStatus === 'taken' || this.usernameStatus === 'taken';
  }

  get isSaveDisabled(): boolean {
    return (
      this.userForm?.invalid ||
      this.disabledButton ||
      this.isCheckingAvailability ||
      this.hasAvailabilityConflict
    );
  }

  /** El SuperAdmin es el único que puede indicar Empresa/TenantId en el Excel. */
  get isSuperAdminUser(): boolean {
    return this.session.getClaims()?.isSuperAdmin === true;
  }

  /** Id del usuario autenticado (para impedir auto-bloqueo/auto-eliminación). */
  get currentUserId(): string {
    return this.session.getClaims()?._id ?? '';
  }

  get isAdminUser(): boolean {
    return localStorage.getItem('isAdmin') === 'true';
  }

  rowActionsFor = (
    row: User,
  ): {
    key: string;
    icon: string;
    tooltip: string;
    severity?: string;
    disabled?: boolean;
  }[] => {
    const actions: {
      key: string;
      icon: string;
      tooltip: string;
      severity?: string;
      disabled?: boolean;
    }[] = [];

    const isSelf = !!this.currentUserId && row._id === this.currentUserId;

    if (row.mustChangePassword || row.isNewUser) {
      actions.push({
        key: 'resendInvite',
        icon: 'pi pi-send',
        tooltip: 'Reenviar invitación o activación',
        severity: 'secondary',
      });
    }

    if (row.isBlocked) {
      actions.push({
        key: 'unblock',
        icon: 'pi pi-lock-open',
        tooltip: isSelf
          ? 'No puedes desbloquearte a ti mismo'
          : 'Desbloquear usuario',
        severity: 'success',
        disabled: isSelf,
      });
    } else {
      actions.push({
        key: 'block',
        icon: 'pi pi-lock',
        tooltip: isSelf
          ? 'No puedes bloquearte a ti mismo'
          : 'Bloquear usuario temporalmente',
        severity: 'warn',
        disabled: isSelf,
      });
    }

    actions.push({
      key: 'softDelete',
      icon: 'pi pi-eye-slash',
      tooltip: isSelf
        ? 'No puedes darte de baja a ti mismo'
        : 'Dar de baja (recuperable: oculta al usuario, no lo borra)',
      severity: 'warn',
      disabled: isSelf,
    });

    if (this.isSuperAdminUser) {
      actions.push({
        key: 'hardDelete',
        icon: 'pi pi-trash',
        tooltip: isSelf
          ? 'No puedes eliminarte a ti mismo'
          : 'Eliminar definitivamente (no recuperable)',
        severity: 'danger',
        disabled: isSelf,
      });
    }

    return actions;
  };

  /** El usuario logueado no puede seleccionarse para acciones masivas. */
  rowSelectableFor = (row: User): boolean =>
    !this.currentUserId || row._id !== this.currentUserId;

  get bulkActionsList(): {
    key: string;
    label: string;
    icon: string;
    severity?: string;
  }[] {
    const actions: {
      key: string;
      label: string;
      icon: string;
      severity?: string;
    }[] = [
      { key: 'activate', label: 'Activar', icon: 'pi pi-check-circle', severity: 'success' },
      { key: 'deactivate', label: 'Desactivar', icon: 'pi pi-ban', severity: 'warn' },
      { key: 'resetPassword', label: 'Resetear clave', icon: 'pi pi-key', severity: 'secondary' },
      { key: 'delete', label: 'Dar de baja', icon: 'pi pi-eye-slash', severity: 'warn' },
    ];
    if (this.isSuperAdminUser) {
      actions.push(
        { key: 'assignRoles', label: 'Asignar roles', icon: 'pi pi-shield', severity: 'secondary' },
        { key: 'assignModules', label: 'Asignar módulos', icon: 'pi pi-box', severity: 'secondary' },
        { key: 'revokeSessions', label: 'Revocar sesiones', icon: 'pi pi-desktop', severity: 'danger' },
        { key: 'deleteHard', label: 'Eliminar definitivo', icon: 'pi pi-trash', severity: 'danger' },
      );
    }
    return actions;
  }

  /** Empresa del usuario autenticado (aplicada a las cargas de admin no-Super). */
  get sessionCompany(): string {
    return this.session.getClaims()?.company ?? '';
  }

  /** TenantId del usuario autenticado (aplicado a las cargas de admin no-Super). */
  get sessionTenantId(): string {
    const claims = this.session.getClaims();
    return claims?.tenantId || claims?.company || '';
  }

  constructor() {
    super(
      inject(UserService),
      inject(ChangeDetectorRef),
      inject(DataLoaderService),
      inject(ExcelExportService),
      inject(ConfirmService),
    );
  }

  ngOnInit(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      username: [''],
      email: ['', [Validators.required, Validators.email]],
      //username: ['', Validators.required],
      isActived: [true],
      isAdmin: [false],
      isSuperAdmin: [false],
      isTrial: [false],
      company: [''],
      modules: [[]],
      roles: [[]],
      permissions: [[]],
      invite: [false],
      tags: [''],
      groups: [''],
      customFields: this.fb.group({}),
    });

    this.setupAvailabilityChecks();
    this.syncSuperAdminControl();
    this.loadOptions();
    this.loadSavedFilters();

    this.userForm
      .get('company')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((company) => this.loadCustomFieldDefs(company || undefined));
  }

  private loadCustomFieldDefs(
    company?: string,
    values?: Record<string, unknown>,
  ): void {
    this.userService.listCustomFields(company).subscribe({
      next: (res) => {
        this.customFieldDefs = res.data || [];
        const group = this.fb.group({});
        for (const def of this.customFieldDefs) {
          const current =
            values && values[def.key] !== undefined
              ? values[def.key]
              : this.defaultValueFor(def);
          group.addControl(def.key, this.fb.control(current));
        }
        this.userForm.setControl('customFields', group);
        this.cdr.detectChanges();
      },
      error: () => {
        this.customFieldDefs = [];
      },
    });
  }

  private defaultValueFor(def: CustomFieldDefinition): any {
    if (def.type === 'boolean') return false;
    return '';
  }

  private setupAvailabilityChecks(): void {
    this.emailInput$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value) => this.runAvailabilityCheck('email', value)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) =>
        this.applyAvailabilityResult('email', result.exists, result.checked),
      );

    this.usernameInput$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((value) => this.runAvailabilityCheck('username', value)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) =>
        this.applyAvailabilityResult('username', result.exists, result.checked),
      );
  }

  onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emailInput$.next(value);
  }

  onUsernameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.usernameInput$.next(value);
  }

  checkEmailNow(): void {
    const value = this.userForm?.get('email')?.value ?? '';
    this.runAvailabilityCheck('email', value).subscribe((result) =>
      this.applyAvailabilityResult('email', result.exists, result.checked),
    );
  }

  checkUsernameNow(): void {
    const value = this.userForm?.get('username')?.value ?? '';
    this.runAvailabilityCheck('username', value).subscribe((result) =>
      this.applyAvailabilityResult('username', result.exists, result.checked),
    );
  }

  private runAvailabilityCheck(
    field: 'email' | 'username',
    rawValue: string,
  ): Observable<AvailabilityCheckResult> {
    const value = String(rawValue ?? '').trim().toLowerCase();

    if (!value || (field === 'email' && !EMAIL_REGEX.test(value))) {
      this.applyAvailabilityResult(field, false, false);
      return of({ exists: false, checked: false });
    }

    this.setStatus(field, 'checking');
    this.cdr.detectChanges();

    const excludeId = this.isEditForm ? this.initialData?._id : undefined;
    const request =
      field === 'email'
        ? this.userService.checkAvailability({ email: value, excludeId })
        : this.userService.checkAvailability({ username: value, excludeId });

    return request.pipe(
      map((res) => ({
        exists:
          field === 'email'
            ? (res.data?.emailExists ?? false)
            : (res.data?.usernameExists ?? false),
        checked: true,
      })),
      catchError(() => of({ exists: false, checked: false })),
    );
  }

  private applyAvailabilityResult(
    field: 'email' | 'username',
    exists: boolean,
    checked = true,
  ): void {
    if (!checked) {
      this.setStatus(field, 'idle');
      return;
    }
    this.setStatus(field, exists ? 'taken' : 'available');
  }

  private setStatus(field: 'email' | 'username', status: AvailabilityStatus): void {
    if (field === 'email') {
      this.emailStatus = status;
      this.emailAvailabilityMessage =
        status === 'taken'
          ? 'El correo ya está registrado'
          : status === 'available'
            ? 'Correo disponible'
            : '';
    } else {
      this.usernameStatus = status;
      this.usernameAvailabilityMessage =
        status === 'taken'
          ? 'El usuario ya está registrado'
          : status === 'available'
            ? 'Usuario disponible'
            : '';
    }
    this.cdr.detectChanges();
  }

  private resetAvailabilityStatuses(): void {
    this.emailStatus = 'idle';
    this.usernameStatus = 'idle';
    this.emailAvailabilityMessage = '';
    this.usernameAvailabilityMessage = '';
  }

  /**
   * Solo un SuperAdmin puede asignar el rol SuperAdmin: habilita o deshabilita
   * el control según el usuario autenticado (los deshabilitados se omiten del
   * formulario y el backend también lo valida).
   */
  private syncSuperAdminControl(): void {
    const control = this.userForm?.get('isSuperAdmin');
    if (!control) return;
    if (this.isSuperAdminUser) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.userForm.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }

  private loadOptions(): void {
    if (this.permissionsOptions.length > 0 && this.modulesOptions.length > 0)
      return;
    forkJoin({
      permissionData: this.permissionService.findAll(),
      modulesData: this.moduleService.findAll(),
      rolesData: this.rolesService.findAll(),
    }).subscribe({
      next: ({ permissionData, modulesData, rolesData }) => {
        this.permissionsOptions = permissionData.data || [];
        this.modulesOptions = modulesData.data || [];
        this.rolesOptions = rolesData.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading options:', err),
    });
  }

  toggleAll(collection: string, state: boolean): void {
    if (collection === 'permissions') {
      this.userForm
        .get('permissions')
        ?.setValue(state ? [...this.permissionsOptions] : []);
    } else if (collection === 'roles') {
      this.userForm.get('roles')?.setValue(state ? [...this.rolesOptions] : []);
    }
  }

  toggleModule(module: UserModule, event: ToggleChangeEvent): void {
    module.isActive = event.checked;
    module.routes?.forEach((r) => {
      r.isActive = module.isActive;
      r.children?.forEach((child) => (child.isActive = module.isActive));
    });
  }

  toggleRoute(route: UserRoute, event: ToggleChangeEvent): void {
    route.isActive = event.checked;
    route.children?.forEach((child) => (child.isActive = event.checked));
  }

  toggleChild(
    route: UserRoute,
    child: UserRoute,
    event: ToggleChangeEvent,
  ): void {
    child.isActive = event.checked;
    const children = route.children || [];
    route.isActive = children.some((c) => c.isActive === true);
  }

  findByAutoComplete(event: { query: string }) {
    this.companiesService
      .findByAutoComplete(event.query)
      .subscribe((response) => {
        this.itemsAutocomplete = response.data;
      });
  }

  updateValidatorsBasedOnEditMode(): void {
    const companiesControl = this.userForm.get('company');

    if (this.isEditForm) {
      companiesControl?.clearValidators();
    } else {
      companiesControl?.setValidators(Validators.required);
    }
    companiesControl?.updateValueAndValidity();

    // La prueba se define al crear. En edición solo un SuperAdmin puede
    // modificarla; para el resto se deshabilita (un control deshabilitado se
    // omite de form.value y no altera la prueba).
    const trialControl = this.userForm.get('isTrial');
    if (this.isEditForm && !this.isSuperAdminUser) {
      trialControl?.disable({ emitEvent: false });
    } else {
      trialControl?.enable({ emitEvent: false });
    }
  }

  getRouteIcon(iconName: string): string {
    return iconName ? `pi pi-${iconName}` : 'pi pi-circle';
  }

  override create(): void {
    this.userForm.reset({
      isActived: true,
      isAdmin: false,
      isSuperAdmin: false,
      isTrial: false,
      username: '',
      permissions: [],
      roles: [],
      modules: (
        JSON.parse(JSON.stringify(this.modulesOptions)) as UserModule[]
      ).map((m) => {
        m.isActive = false;
        const routes = m.routes || m.router || [];
        routes.forEach((r) => {
          r.isActive = false;
          (r.children || []).forEach((c) => (c.isActive = false));
        });
        m.routes = routes; // Normalizar a 'routes' en el formulario
        return m;
      }),
    });
    this.resetAvailabilityStatuses();
    this.syncSuperAdminControl();
    this.userForm.setControl('customFields', this.fb.group({}));
    this.loadCustomFieldDefs(
      this.isSuperAdminUser ? undefined : this.sessionCompany,
    );
    this.titleForm = 'Creación de ' + this.subtitle;
    this.isFormVisible = true;
    this.isDisplayForm = true;
    this.isEditForm = false;
    this.updateValidatorsBasedOnEditMode();
    this.cdr.detectChanges();
  }

  override onSelectionChange(selectedItem: User) {
    this.isDisplayForm = true;
    this.isEditForm = true;
    this.titleForm = 'Edición de ' + this.subtitle;
    this.isFormVisible = true;
    this.updateValidatorsBasedOnEditMode();
    this.cdr.detectChanges();

    // Mapear permisos seleccionados con las opciones reales
    const mappedPermissions = (selectedItem.permissions || []).map((perm) => {
      return (
        this.permissionsOptions.find((opt) => opt.name === perm.name) || perm
      );
    });

    // Mapear roles seleccionados con las opciones reales
    const mappedRoles = (selectedItem.roles || []).map((rol) => {
      return this.rolesOptions.find((opt) => opt.name === rol.name) || rol;
    });

    // Normalizar la propiedad de rutas (puede venir como 'routes' o 'router')
    const getRoutes = (obj?: UserModule | null): UserRoute[] =>
      obj?.routes || obj?.router || [];

    // Coincidencia por nombre o path, para no depender de los _id ni del orden.
    const routeMatch = (a?: UserRoute | null, b?: UserRoute | null) =>
      a?.name === b?.name || a?.path === b?.path;

    const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

    // Construye una ruta con sus hijos. El padre es contenedor: se considera
    // activo si al menos un hijo lo está; si no tiene hijos, se respeta su isActive.
    // Funciona con la estructura del sistema y/o la del usuario (unión).
    const mapRoute = (
      systemRoute: UserRoute | null,
      userRoute: UserRoute | null,
    ): UserRoute => {
      const base: UserRoute = systemRoute ??
        userRoute ?? { name: '', path: '' };
      const baseChildren = base.children || [];
      const userChildren = userRoute?.children || [];

      const children: UserRoute[] = baseChildren.map((baseChild) => {
        const userChild = userChildren.find((c) => routeMatch(c, baseChild));
        return {
          ...clone(baseChild),
          isActive: userChild?.isActive === true,
        };
      });

      // Hijos que existen solo en el usuario (no en el catálogo) se conservan.
      userChildren.forEach((userChild) => {
        if (!baseChildren.some((c) => routeMatch(c, userChild))) {
          children.push(clone(userChild));
        }
      });

      const isActive = children.length
        ? children.some((c) => c.isActive === true)
        : userRoute?.isActive === true;

      return {
        ...clone(base),
        isActive,
        children,
      };
    };

    const userModules = (selectedItem.modules ??
      []) as unknown as UserModule[];

    // Unión de módulos del catálogo y del usuario: no se pierde ningún módulo.
    const mappedModules: UserModule[] = [];

    this.modulesOptions.forEach((systemMod) => {
      const userMod = userModules.find(
        (m) => m.name === systemMod.name || m._id === systemMod._id,
      );

      const systemRoutes = getRoutes(systemMod);
      const userRoutes = getRoutes(userMod);

      const routes: UserRoute[] = systemRoutes.map((systemRoute) =>
        mapRoute(
          systemRoute,
          userRoutes.find((userRoute) => routeMatch(userRoute, systemRoute)) ??
            null,
        ),
      );

      // Rutas que existen solo en el usuario se conservan.
      userRoutes.forEach((userRoute) => {
        if (!systemRoutes.some((r) => routeMatch(r, userRoute))) {
          routes.push(mapRoute(null, userRoute));
        }
      });

      mappedModules.push({
        ...clone(systemMod),
        isActive: userMod?.isActive === true,
        routes,
      });
    });

    // Módulos que el usuario tiene y no están en el catálogo se conservan.
    userModules.forEach((userMod) => {
      if (
        !this.modulesOptions.some(
          (m) => m.name === userMod.name || m._id === userMod._id,
        )
      ) {
        mappedModules.push({
          ...clone(userMod),
          isActive: userMod.isActive === true,
          routes: getRoutes(userMod).map((userRoute) =>
            mapRoute(null, userRoute),
          ),
        });
      }
    });

    this.userForm.patchValue({
      name: selectedItem.name,
      lastName: selectedItem.lastName,
      phone: selectedItem.phone,
      username: selectedItem.username,
      email: selectedItem.email,
      isActived: selectedItem.isActived,
      isAdmin: selectedItem.isAdmin,
      isTrial: selectedItem.isTrial === true,
      company: selectedItem.company,
      isSuperAdmin: selectedItem.isSuperAdmin,
      permissions: mappedPermissions,
      roles: mappedRoles,
      modules: mappedModules,
      tags: (selectedItem.tags || []).join(', '),
      groups: (selectedItem.groups || []).join(', '),
    });

    this.resetAvailabilityStatuses();
    this.syncSuperAdminControl();

    this.initialData = {
      ...this.initialData,
      ...selectedItem,
    };

    this.loadCustomFieldDefs(selectedItem.company, selectedItem.customFields);
  }

  private parseList(value: any): string[] | undefined {
    if (Array.isArray(value)) return value;
    const raw = String(value ?? '').trim();
    if (!raw) return undefined;
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  override getFormattedFormValues(): User {
    const values: any = { ...this.userForm?.value };
    if (values.email) {
      values.email = String(values.email).trim().toLowerCase();
    }
    if (values.username) {
      values.username = String(values.username).trim().toLowerCase();
    } else {
      delete values.username;
    }
    values.tags = this.parseList(values.tags);
    values.groups = this.parseList(values.groups);
    if (this.customFieldDefs.length === 0) {
      delete values.customFields;
    }
    if (this.isEditForm) {
      delete values.invite;
    } else {
      values.invite = values.invite === true;
    }
    // A2b: `permissions`/`modules` solo los gestiona un SuperAdmin.
    if (!this.isSuperAdminUser) {
      delete values.permissions;
      delete values.modules;
    }
    Object.keys(values).forEach((key) => {
      if (values[key] === undefined) delete values[key];
    });
    return values;
  }

  // --- Carga masiva de usuarios ---

  /**
   * Construye la plantilla de carga masiva según el rol:
   * - SuperAdmin: incluye TenantId y Empresa (obligatorios).
   * - Admin: no incluye TenantId ni Empresa (se toman de su usuario).
   */
  buildMassiveTemplateData(): {
    rows: Record<string, string>[];
    fileName: string;
  } {
    const isSuperAdmin = this.isSuperAdminUser;

    const makeRow = (
      data: Record<string, string> = {},
    ): Record<string, string> => {
      const row: Record<string, string> = {
        'Nombres': '',
        'Apellidos': '',
        'Correo Electrónico': '',
        'Teléfono': '',
        'Usuario': '',
      };
      if (isSuperAdmin) {
        row['TenantId'] = data['TenantId'] ?? this.sessionTenantId;
        row['Empresa'] = data['Empresa'] ?? this.sessionCompany;
      }
      row['Roles'] = '';
      if (isSuperAdmin) {
        row['Permisos'] = '';
        row['Módulos'] = '';
      }
      return { ...row, ...data };
    };

    const sampleSuper: Record<string, string> = isSuperAdmin
      ? { 'Permisos': 'Crear', 'Módulos': this.modulesOptions[0]?.name ?? 'adminUserModule' }
      : {};

    const rows = [
      makeRow({
        'Nombres': 'Juan',
        'Apellidos': 'Pérez',
        'Correo Electrónico': 'juan.perez@ejemplo.com',
        'Teléfono': '3001234567',
        'Usuario': 'juanperez',
        'Roles': 'USR',
        ...sampleSuper,
      }),
      makeRow({
        'Nombres': 'María',
        'Apellidos': 'López',
        'Correo Electrónico': 'maria.lopez@ejemplo.com',
        'Teléfono': '3107654321',
      }),
    ];

    const suffix = isSuperAdmin ? 'SuperAdmin' : 'Admin';
    return {
      rows,
      fileName: `Plantilla_Carga_Masiva_Usuarios_${suffix}.xlsx`,
    };
  }

  async downloadTemplate(): Promise<void> {
    const XLSX = await import('xlsx');
    const { rows, fileName } = this.buildMassiveTemplateData();

    const columnWidths: Record<string, number> = {
      'Nombres': 20,
      'Apellidos': 20,
      'Correo Electrónico': 32,
      'Teléfono': 15,
      'Usuario': 18,
      'TenantId': 12,
      'Empresa': 18,
      'Roles': 16,
      'Permisos': 22,
      'Módulos': 22,
    };

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = Object.keys(rows[0]).map((key) => ({
      wch: columnWidths[key] ?? 18,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

    XLSX.writeFile(workbook, fileName);
  }

  onMassiveFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.selectedFile = file;
    this.isMassiveUploadDialogVisible = true;
    this.isPreviewing = true;
    this.isUploading = false;
    this.uploadReport = null;
    this.previewErrors = [];
    this.previewData = [];
    this.reportMessages = [];
    this.cdr.detectChanges();

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      const errorMessage = 'El archivo debe ser un Excel (.xlsx o .xls).';
      this.previewErrors = [errorMessage];
      this.showValidationMessages([errorMessage]);
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const XLSX = await import('xlsx');
        const buffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames?.[0];
        const sheet = workbook.Sheets[sheetName];

        const headerRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        });
        const headerRow = (headerRows[0] ?? []).map((h) => String(h).trim());
        const jsonDataRaw: Record<string, unknown>[] =
          XLSX.utils.sheet_to_json(sheet, { defval: '' });
        // Ignora filas totalmente vacías (o con solo espacios) que Excel
        // conserva por formato y que inflarían el conteo/validación.
        const jsonData = jsonDataRaw.filter((row) =>
          Object.values(row).some(
            (value) => String(value ?? '').trim() !== '',
          ),
        );

        this.buildPreview(headerRow, jsonData);
      } catch {
        const errorMessage =
          'No se pudo leer el archivo. Asegúrate de usar la plantilla correcta.';
        this.previewData = [];
        this.previewErrors = [errorMessage];
        this.showValidationMessages([errorMessage]);
      } finally {
        this.cdr.detectChanges();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private showValidationMessages(
    fileErrors: string[],
    rowErrorCount = 0,
  ): void {
    fileErrors.forEach((error) =>
      this.confirmService.showMessage(
        'error',
        'Validación de Excel',
        error,
        6000,
      ),
    );
    if (rowErrorCount > 0) {
      this.confirmService.showMessage(
        'error',
        'Validación de Excel',
        `${rowErrorCount} fila(s) con errores. Revisa la previsualización.`,
        6000,
      );
    }
  }

  private buildPreview(
    headerRow: string[],
    jsonData: Record<string, unknown>[],
  ): void {
    const isSuperAdmin = this.isSuperAdminUser;
    const errors: string[] = [];

    // Ignora filas totalmente vacías (o con solo espacios).
    const data = jsonData.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').trim() !== ''),
    );

    const requiredHeaders = isSuperAdmin
      ? [...BASE_REQUIRED_EXCEL_HEADERS, ...SUPERADMIN_REQUIRED_EXCEL_HEADERS]
      : BASE_REQUIRED_EXCEL_HEADERS;

    const missingHeaders = requiredHeaders.filter(
      (h) => !headerRow.includes(h),
    );
    if (missingHeaders.length > 0) {
      errors.push(`Faltan columnas obligatorias: ${missingHeaders.join(', ')}.`);
    }

    if (data.length === 0) {
      errors.push('El archivo Excel está vacío.');
    }

    if (data.length > MAX_MASSIVE_USERS) {
      errors.push(
        `El archivo tiene ${data.length} usuarios. El límite máximo es de ${MAX_MASSIVE_USERS} usuarios por archivo.`,
      );
    }

    const fileErrors = [...errors];

    const seenEmails = new Set<string>();
    const seenUsernames = new Set<string>();

    const preview: MassivePreviewRow[] = data.map((row, index) => {
      const nombres = this.cleanCell(row['Nombres']);
      const apellidos = this.cleanCell(row['Apellidos']);
      const email = this.cleanCell(row['Correo Electrónico']).toLowerCase();
      const telefono = this.cleanCell(row['Teléfono']);
      const usuario = this.cleanCell(row['Usuario']);

      // Empresa/TenantId efectivos: el SuperAdmin los toma del Excel; el resto
      // de usuarios hereda los de su propia cuenta.
      const excelEmpresa = this.cleanCell(row['Empresa']);
      const excelTenantId = this.cleanCell(row['TenantId']);
      const empresa = isSuperAdmin ? excelEmpresa : this.sessionCompany;
      const tenantId = isSuperAdmin ? excelTenantId : this.sessionTenantId;

      const rowErrors: string[] = [];
      if (!nombres) rowErrors.push('Falta Nombres');
      if (!apellidos) rowErrors.push('Falta Apellidos');
      if (!email) rowErrors.push('Falta Correo Electrónico');
      else if (!EMAIL_REGEX.test(email)) rowErrors.push('Correo inválido');

      if (isSuperAdmin) {
        if (!excelEmpresa) rowErrors.push('Falta Empresa');
        if (!excelTenantId) rowErrors.push('Falta TenantId');
      } else {
        if (!empresa) rowErrors.push('No se pudo determinar la empresa del usuario');
        if (!tenantId) rowErrors.push('No se pudo determinar el TenantId del usuario');
      }

      if (email) {
        if (seenEmails.has(email)) rowErrors.push('Correo duplicado');
        else seenEmails.add(email);
      }

      if (usuario) {
        if (seenUsernames.has(usuario)) rowErrors.push('Usuario duplicado');
        else seenUsernames.add(usuario);
      }

      if (rowErrors.length > 0 && missingHeaders.length === 0) {
        errors.push(`Fila ${index + 2}: ${rowErrors.join(', ')}`);
      }

      return {
        row: index + 2,
        nombres: nombres || '---',
        apellidos: apellidos || '---',
        email: email || '---',
        telefono: telefono || '---',
        usuario: usuario || '---',
        empresa: empresa || '---',
        tenantId: tenantId || '---',
        status: rowErrors.length === 0 ? 'OK' : 'ERROR',
        errors: rowErrors.join(', '),
      };
    });

    this.previewData = preview;
    this.previewErrors = errors;
    this.showValidationMessages(
      fileErrors,
      jsonData.length > MAX_MASSIVE_USERS || missingHeaders.length > 0
        ? 0
        : preview.filter((item) => item.status === 'ERROR').length,
    );
  }

  private cleanCell(value: unknown): string {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  confirmMassiveUpload(): void {
    const file = this.selectedFile;
    if (!file || this.isUploading) return;

    this.isPreviewing = false;
    this.isUploading = true;
    this.reportMessages = [];
    this.cdr.detectChanges();

    (this.service as UserService).uploadMassive(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.uploadReport = res.data;
        const failed = res.data?.failed ?? 0;
        const existing = res.data?.existing ?? 0;
        this.reportMessages =
          failed === 0
            ? [
                {
                  severity: 'success',
                  detail:
                    'Todos los usuarios fueron procesados correctamente.',
                },
                ...(existing > 0
                  ? [
                      {
                        severity: 'info' as const,
                        detail: `${existing} usuario(s) ya existían y no se modificaron.`,
                      },
                    ]
                  : []),
              ]
            : [
                {
                  severity: 'warn',
                  detail:
                    'La carga finalizó con novedades. Revisa el reporte de resultados.',
                },
              ];
        this.rechargeTable();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isUploading = false;
        this.uploadReport = null;
        this.reportMessages = [
          {
            severity: 'error',
            detail: err?.error?.message || 'Error al procesar el archivo.',
          },
        ];
        this.cdr.detectChanges();
      },
    });
  }

  closeMassiveDialog(): void {
    if (this.isUploading) return;
    this.isMassiveUploadDialogVisible = false;
    this.selectedFile = null;
  }

  cancelMassiveUpload(): void {
    if (this.isUploading) return;
    this.isMassiveUploadDialogVisible = false;
    this.selectedFile = null;
    this.uploadReport = null;
    this.previewErrors = [];
    this.previewData = [];
  }

  async downloadMassiveReport(): Promise<void> {
    const report = this.uploadReport;
    if (!report) return;

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte de Carga');

    sheet.columns = [
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Fila', key: 'row', width: 8 },
      { header: 'Nombres', key: 'name', width: 30 },
      { header: 'Correo', key: 'email', width: 35 },
      { header: 'Detalle', key: 'detail', width: 50 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    headerRow.alignment = { horizontal: 'center' };

    const statusLabel: Record<string, string> = {
      created: 'CREADO',
      existing: 'EXISTENTE',
      failed: 'FALLIDO',
    };
    const statusColor: Record<string, string> = {
      created: 'FF16A34A',
      existing: 'FFD97706',
      failed: 'FFDC2626',
    };

    report.results.forEach((item) => {
      const newRow = sheet.addRow({
        status: statusLabel[item.status] ?? item.status,
        row: item.row,
        name: item.name,
        email: item.email,
        detail: item.message,
      });
      newRow.getCell('status').font = {
        color: { argb: statusColor[item.status] ?? 'FF000000' },
        bold: true,
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(
      blob,
      `Reporte_Carga_Masiva_${new Date().getTime()}.xlsx`,
    );
  }

  // --- Búsqueda avanzada / guardadas ---

  toggleFiltersPanel(): void {
    this.filtersPanelVisible = !this.filtersPanelVisible;
  }

  private buildFilterParams(): Record<string, unknown> {
    const f = this.advancedFilters;
    const out: Record<string, unknown> = {};
    const keys = [
      'company',
      'rol',
      'estado',
      'isBlocked',
      'email',
      'username',
      'phone',
      'tags',
      'groups',
      'global',
    ];
    for (const key of keys) {
      if (f[key] !== '' && f[key] !== null && f[key] !== undefined) {
        out[key] = f[key];
      }
    }
    if (f['desde'] instanceof Date) {
      out['desde'] = f['desde'].toISOString().slice(0, 10);
    }
    if (f['hasta'] instanceof Date) {
      out['hasta'] = f['hasta'].toISOString().slice(0, 10);
    }
    return out;
  }

  applyAdvancedFilters(): void {
    if (this.loading) return;
    this.activeFilters = this.buildFilterParams();
    this.usingAdvancedFilters = true;
    this.load({ first: 0, rows: 100 } as TableLazyLoadEvent);
  }

  override load(event?: TableLazyLoadEvent): void {
    if (this.usingAdvancedFilters) {
      this.loading = true;
      const from = event?.first ?? 0;
      const rows = event?.rows ?? 100;
      const global =
        typeof event?.globalFilter === 'string' ? event.globalFilter : '';
      // Se reutilizan los filtros APLICADOS para que la paginación conserve
      // exactamente la misma consulta.
      const filters = this.activeFilters ?? this.buildFilterParams();
      this.userService
        .findByPage(from, rows, global, JSON.stringify(filters))
        .subscribe({
          next: (res: any) => {
            this.data = res.data || [];
            this.totalRecords = res.meta?.totalData ?? this.data.length;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
      return;
    }
    super.load(event);
  }

  override rechargeTable(): void {
    if (this.usingAdvancedFilters) {
      const first = 0;
      this.load({ first, rows: 100 } as TableLazyLoadEvent);
      return;
    }
    super.rechargeTable();
  }

  clearAdvancedFilters(): void {
    this.advancedFilters = {
      company: '',
      rol: '',
      estado: '',
      isBlocked: '',
      email: '',
      username: '',
      phone: '',
      tags: '',
      groups: '',
      desde: null,
      hasta: null,
      global: '',
    };
    this.usingAdvancedFilters = false;
    this.activeFilters = null;
    this.rechargeTable();
  }

  exportFiltered(format: 'xlsx' | 'csv' | 'pdf'): void {
    if (this.exporting) return;
    this.exporting = true;
    const filters = this.activeFilters ?? this.buildFilterParams();

    if (format === 'pdf') {
      this.userService
        .exportData(filters)
        .pipe(finalize(() => (this.exporting = false)))
        .subscribe({
          next: async (res) => {
            const d = res.data;
            if (d.truncated) {
              this.confirmService.showMessage(
                'warn',
                'Reportes',
                `El PDF incluirá las primeras ${d.rows.length} de ${d.total} filas. Para el total usa Excel/CSV.`,
              );
            }
            await this.exporter.printPdf({
              title: 'Usuarios',
              meta: `Generado: ${new Date().toLocaleString('es-CO')}`,
              columns: d.columns,
              rows: d.rows,
            });
          },
          error: () =>
            this.confirmService.showMessage(
              'error',
              'Exportar',
              'No se pudo generar el PDF',
            ),
        });
      return;
    }

    this.userService
      .exportUsers(filters, format)
      .pipe(finalize(() => (this.exporting = false)))
      .subscribe({
        next: (file) => FileSaver.saveAs(file.blob, file.filename),
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Exportar',
            'No se pudo exportar la lista',
          ),
      });
  }

  loadSavedFilters(): void {
    this.userService.listSavedFilters().subscribe({
      next: (res) => {
        this.savedFilters = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => undefined,
    });
  }

  openSaveFilter(): void {
    this.savedFilterName = '';
    this.saveFilterDialogVisible = true;
  }

  saveCurrentFilter(): void {
    const name = this.savedFilterName.trim();
    if (!name || this.actionBusy) return;
    this.actionBusy = true;
    this.userService
      .createSavedFilter({ name, filters: this.buildFilterParams() })
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () => {
          this.saveFilterDialogVisible = false;
          this.confirmService.showMessage(
            'success',
            'Búsqueda',
            'Búsqueda guardada',
          );
          this.loadSavedFilters();
        },
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Búsqueda',
            'No se pudo guardar la búsqueda',
          ),
      });
  }

  applySavedFilter(filter: SavedFilter): void {
    this.advancedFilters = {
      ...this.advancedFilters,
      ...(filter.filters || {}),
    };
    this.filtersPanelVisible = true;
    this.applyAdvancedFilters();
  }

  deleteSavedFilter(filter: SavedFilter): void {
    if (this.actionBusy) return;
    this.actionBusy = true;
    this.userService
      .deleteSavedFilter(filter._id)
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () => this.loadSavedFilters(),
        error: () => undefined,
      });
  }

  // --- Acciones masivas ---

  onBulkSelection(rows: User[]): void {
    this.bulkSelection = rows || [];
  }

  async onBulkAction(event: { key: string; rows: User[] }): Promise<void> {
    const all = event.rows || [];
    // El usuario logueado nunca entra en acciones masivas.
    const rows = all.filter((user) => this.rowSelectableFor(user));
    if (all.length > 0 && rows.length === 0) {
      this.confirmService.showMessage(
        'warn',
        'Acción no permitida',
        'No puedes aplicar acciones masivas sobre tu propio usuario',
      );
      return;
    }
    if (rows.length === 0 || this.isBulkProcessing) return;
    if (event.key === 'assignRoles' || event.key === 'assignModules') {
      this.bulkAssignType = event.key;
      this.bulkAssignTargets = rows;
      this.bulkAssignSelection = [];
      this.bulkAssignDialogVisible = true;
      return;
    }
    const isHardDelete = event.key === 'deleteHard';
    const action = (
      isHardDelete ? 'delete' : event.key
    ) as BulkUserAction;
    const labels: Record<string, string> = {
      activate: 'activar',
      deactivate: 'desactivar',
      resetPassword: 'resetear la contraseña de',
      assignRoles: 'asignar roles a',
      assignModules: 'asignar módulos a',
      revokeSessions: 'revocar las sesiones de',
      delete: 'dar de baja (recuperable) a',
      deleteHard: 'eliminar definitivamente (no recuperable) a',
    };
    const ok = await this.confirmService.confirm(
      `${rows.length}`,
      isHardDelete ? 'Eliminación definitiva' : 'Acción masiva',
      `¿Deseas ${labels[event.key] || event.key}`,
      'pi pi-exclamation-triangle',
      'Cancelar',
      isHardDelete ? 'Eliminar' : 'Aplicar',
      'secondary',
      isHardDelete ? 'danger' : 'primary',
    );
    if (!ok) return;
    const successMsg: Record<string, string> = {
      activate: 'Usuarios activados',
      deactivate: 'Usuarios desactivados',
      resetPassword:
        'Se envió una contraseña temporal por correo a los usuarios seleccionados',
      revokeSessions: 'Sesiones revocadas',
      assignRoles: 'Roles asignados',
      assignModules: 'Módulos asignados',
      delete: 'Usuarios dados de baja (recuperable)',
      deleteHard: 'Usuarios eliminados definitivamente',
    };
    this.isBulkProcessing = true;
    const ids = rows.map((r) => r._id);
    this.userService
      .bulk(action, ids, isHardDelete ? { hard: true } : {})
      .pipe(finalize(() => (this.isBulkProcessing = false)))
      .subscribe({
        next: () => {
          this.confirmService.showMessage(
            'success',
            'Acciones masivas',
            successMsg[event.key] || 'Acción aplicada',
          );
          this.bulkSelection = [];
          this.rechargeTable();
        },
        error: (err: any) => {
          this.confirmService.showMessage(
            'error',
            'Acciones masivas',
            err?.error?.message || 'No se pudo aplicar la acción',
          );
          this.cdr.detectChanges();
        },
      });
  }

  get bulkAssignOptions(): any[] {
    return this.bulkAssignType === 'assignRoles'
      ? this.rolesOptions
      : this.modulesOptions;
  }

  get bulkAssignOptionLabel(): string {
    return 'name';
  }

  get bulkAssignOptionValue(): string {
    return this.bulkAssignType === 'assignRoles' ? 'codeRol' : 'name';
  }

  get bulkAssignTitle(): string {
    return this.bulkAssignType === 'assignRoles'
      ? 'Asignar roles'
      : 'Asignar módulos';
  }

  confirmBulkAssign(): void {
    if (!this.bulkAssignType || this.bulkAssignTargets.length === 0) return;
    if (this.isBulkProcessing) return;
    const selection = this.bulkAssignSelection || [];
    if (selection.length === 0) return;

    const payload =
      this.bulkAssignType === 'assignRoles'
        ? { roles: selection.map((code) => ({ codeRol: code, name: code })) }
        : { modules: selection.map((name) => ({ name })) };

    this.isBulkProcessing = true;
    const ids = this.bulkAssignTargets.map((u) => u._id);
    this.userService
      .bulk(this.bulkAssignType, ids, payload)
      .pipe(finalize(() => (this.isBulkProcessing = false)))
      .subscribe({
        next: () => {
          this.bulkAssignDialogVisible = false;
          this.confirmService.showMessage(
            'success',
            'Acciones masivas',
            'Asignación aplicada',
          );
          this.bulkAssignTargets = [];
          this.bulkSelection = [];
          this.rechargeTable();
        },
        error: (err: any) =>
          this.confirmService.showMessage(
            'error',
            'Acciones masivas',
            err?.error?.message || 'No se pudo asignar',
          ),
      });
  }

  // --- Acciones de fila ---

  async onExtraAction(event: { key: string; row: User }): Promise<void> {
    const row = event.row;
    const isSelf = !!this.currentUserId && row._id === this.currentUserId;

    if (
      isSelf &&
      ['block', 'unblock', 'softDelete', 'hardDelete'].includes(event.key)
    ) {
      this.confirmService.showMessage(
        'warn',
        'Acción no permitida',
        'No puedes bloquear ni eliminar tu propio usuario',
      );
      return;
    }

    switch (event.key) {
      case 'resendInvite':
        await this.resendInvite(row);
        break;
      case 'block':
        this.openBlockDialog(row);
        break;
      case 'unblock':
        await this.unblockUser(row);
        break;
      case 'softDelete':
        await this.softDelete(row);
        break;
      case 'hardDelete':
        await this.hardDelete(row);
        break;
    }
  }

  async softDelete(row: User): Promise<void> {
    if (this.actionBusy) return;
    this.actionBusy = true;
    const ok = await this.confirmService.confirm(
      row.email,
      'Dar de baja',
      '¿Dar de baja (recuperable) a',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Dar de baja',
      'secondary',
      'warn',
    );
    if (!ok) {
      this.actionBusy = false;
      return;
    }
    this.userService
      .delete(row._id)
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () => {
          this.confirmService.showMessage(
            'success',
            'Baja de usuario',
            'Usuario dado de baja (puede recuperarse)',
          );
          this.rechargeTable();
        },
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Baja de usuario',
            'No se pudo dar de baja al usuario',
          ),
      });
  }

  async resendInvite(row: User): Promise<void> {
    if (this.actionBusy) return;
    this.actionBusy = true;
    const ok = await this.confirmService.confirm(
      row.email,
      'Reenviar',
      '¿Reenviar invitación/activación a',
      'pi pi-send',
      'Cancelar',
      'Reenviar',
      'secondary',
      'primary',
    );
    if (!ok) {
      this.actionBusy = false;
      return;
    }
    this.userService
      .resendInvite(row._id)
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () =>
          this.confirmService.showMessage(
            'success',
            'Reenviar',
            'Correo reenviado',
          ),
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Reenviar',
            'No se pudo reenviar el correo',
          ),
      });
  }

  openBlockDialog(row: User): void {
    this.blockTarget = row;
    this.blockReason = '';
    this.blockUntil = null;
    this.blockDialogVisible = true;
  }

  saveBlock(): void {
    if (!this.blockTarget || this.actionBusy) return;
    this.actionBusy = true;
    const body: { reason?: string; until?: string } = {};
    if (this.blockReason) body.reason = this.blockReason;
    if (this.blockUntil) body.until = this.blockUntil.toISOString();
    this.userService
      .block(this.blockTarget._id, body)
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () => {
          this.blockDialogVisible = false;
          this.confirmService.showMessage(
            'success',
            'Bloqueo',
            'Usuario bloqueado',
          );
          this.rechargeTable();
        },
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Bloqueo',
            'No se pudo bloquear el usuario',
          ),
      });
  }

  async unblockUser(row: User): Promise<void> {
    if (this.actionBusy) return;
    this.actionBusy = true;
    const ok = await this.confirmService.confirm(
      row.email,
      'Desbloquear',
      '¿Desbloquear a',
      'pi pi-lock-open',
      'Cancelar',
      'Desbloquear',
      'secondary',
      'success',
    );
    if (!ok) {
      this.actionBusy = false;
      return;
    }
    this.userService
      .unblock(row._id)
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () => {
          this.confirmService.showMessage(
            'success',
            'Bloqueo',
            'Usuario desbloqueado',
          );
          this.rechargeTable();
        },
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Bloqueo',
            'No se pudo desbloquear el usuario',
          ),
      });
  }

  async hardDelete(row: User): Promise<void> {
    if (this.actionBusy) return;
    this.actionBusy = true;
    const ok = await this.confirmService.confirm(
      row.email,
      'Eliminar definitivamente',
      '¿Eliminar permanentemente a',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Eliminar',
      'secondary',
      'danger',
    );
    if (!ok) {
      this.actionBusy = false;
      return;
    }
    this.userService
      .hardDelete(row._id)
      .pipe(finalize(() => (this.actionBusy = false)))
      .subscribe({
        next: () => {
          this.confirmService.showMessage(
            'success',
            'Eliminación',
            'Usuario eliminado definitivamente',
          );
          this.rechargeTable();
        },
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Eliminación',
            'No se pudo eliminar el usuario',
          ),
      });
  }

  onSubmit() {
    if (this.isCheckingAvailability) {
      return;
    }
    if (this.hasAvailabilityConflict) {
      this.confirmService.showMessage(
        'error',
        'Datos no disponibles',
        'El correo electrónico o el nombre de usuario ya está registrado.',
      );
      return;
    }
    if (this.userForm.valid) {
      this.save();
    }
  }
}
