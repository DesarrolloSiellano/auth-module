import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { Users } from './users';
import { UserService } from './services/user';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { RolesServices } from '../roles/services/roles';
import { ModuleService } from '../modules/services/module.service';
import { PermissionService } from '../permissions/services/permission.service';
import { CompaniesService } from '../companies/services/companies.service';
import { Permission } from '../permissions/interfaces/permission.interface';
import { Rol } from '../roles/interface/rol.interface';
import { Module } from '../modules/interfaces/module.interface';
import { User } from './interfaces/user.interface';
import { Companies } from '../companies/interfaces/companies.interface';
import { ENVIROMENT } from '../../../environments/environment';
import { SessionStore } from '../../core/services/session.store';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;

  let userServiceMock: jasmine.SpyObj<UserService>;
  let permissionServiceMock: jasmine.SpyObj<PermissionService>;
  let moduleServiceMock: jasmine.SpyObj<ModuleService>;
  let rolesServiceMock: jasmine.SpyObj<RolesServices>;
  let companiesServiceMock: jasmine.SpyObj<CompaniesService>;
  let dataLoaderMock: jasmine.SpyObj<DataLoaderService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;
  let sessionStoreMock: { getClaims: jasmine.Spy };

  const permission: Permission = {
    _id: 'p1',
    name: 'Crear',
    description: 'Permite crear',
    action: 'create',
    resource: 'users',
    type: 'global',
    created: new Date(),
    modified: new Date(),
    isActive: true,
  };
  const role: Rol = {
    _id: 'r1',
    name: 'Admin',
    codeRol: 'ADM',
    description: 'Administrador',
    created: new Date(),
    modiefied: new Date(),
    isActive: true,
    isInheritPermissions: false,
    permissions: [],
  };
  const moduleItem: Module = {
    _id: 'm1',
    name: ENVIROMENT.storageKey,
    description: 'Admin module',
    created: new Date(),
    isActive: true,
    routes: [
      {
        name: 'Pages',
        path: '/pages',
        initPath: '/pages/users',
        icon: 'layout',
        isActive: true,
        children: [],
      },
    ],
  };

  const selectUser = (user: Record<string, unknown>) =>
    component.onSelectionChange(user as unknown as User);

  beforeEach(async () => {
    userServiceMock = jasmine.createSpyObj('UserService', [
      'findAll', 'findByPage', 'findById', 'create', 'update', 'delete',
      'uploadMassive', 'checkAvailability', 'search', 'exportUsers', 'bulk',
      'resendInvite', 'block', 'unblock', 'setTagsGroups', 'hardDelete',
      'listSavedFilters', 'createSavedFilter', 'deleteSavedFilter',
      'listCustomFields', 'createCustomField', 'updateCustomField',
      'deleteCustomField',
    ]);
    userServiceMock.findByPage.and.returnValue(
      of({ data: [], meta: { totalData: 0 } } as any),
    );
    userServiceMock.checkAvailability.and.returnValue(
      of({ data: { emailExists: false, usernameExists: false }, meta: {} } as any),
    );
    userServiceMock.listSavedFilters.and.returnValue(
      of({ data: [], meta: { totalData: 0 } } as any),
    );
    userServiceMock.listCustomFields.and.returnValue(
      of({ data: [], meta: { totalData: 0 } } as any),
    );

    permissionServiceMock = jasmine.createSpyObj('PermissionService', ['findAll']);
    permissionServiceMock.findAll.and.returnValue(
      of({ data: [permission], meta: {} } as any),
    );

    moduleServiceMock = jasmine.createSpyObj('ModuleService', ['findAll']);
    moduleServiceMock.findAll.and.returnValue(
      of({ data: [moduleItem], meta: {} } as any),
    );

    rolesServiceMock = jasmine.createSpyObj('RolesServices', ['findAll']);
    rolesServiceMock.findAll.and.returnValue(
      of({ data: [role], meta: {} } as any),
    );

    companiesServiceMock = jasmine.createSpyObj('CompaniesService', [
      'findAll', 'findByAutoComplete',
    ]);
    companiesServiceMock.findByAutoComplete.and.returnValue(
      of({ data: [{ _id: 'c1', name: 'BPO' }], meta: {} } as any),
    );

    dataLoaderMock = jasmine.createSpyObj('DataLoaderService', [
      'loadData', 'handleResponse',
    ]);
    dataLoaderMock.loadData.and.callFake((fn: any) => fn(0, 100, '', '{}'));
    dataLoaderMock.handleResponse.and.callFake((res: any) => ({
      ok: true,
      totalResults: res?.meta?.totalData ?? 0,
      data: res?.data ?? [],
    }));

    confirmServiceMock = jasmine.createSpyObj('ConfirmService', [
      'showMessage', 'confirm',
    ]);
    confirmServiceMock.confirm.and.returnValue(Promise.resolve(true));

    sessionStoreMock = {
      getClaims: jasmine.createSpy('getClaims').and.returnValue({
        isSuperAdmin: true,
        company: 'BPONET',
        tenantId: '000000',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
        { provide: CompaniesService, useValue: companiesServiceMock },
        { provide: SessionStore, useValue: sessionStoreMock },
      ],
    })
      .overrideComponent(Users, {
        remove: {
          providers: [
            UserService, DataLoaderService, ExcelExportService, ConfirmService,
            RolesServices, ModuleService, PermissionService,
          ],
        },
        add: {
          providers: [
            { provide: UserService, useValue: userServiceMock },
            { provide: DataLoaderService, useValue: dataLoaderMock },
            { provide: ExcelExportService, useValue: {} },
            { provide: ConfirmService, useValue: confirmServiceMock },
            { provide: RolesServices, useValue: rolesServiceMock },
            { provide: ModuleService, useValue: moduleServiceMock },
            { provide: PermissionService, useValue: permissionServiceMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mantiene los filtros avanzados al cambiar de página', () => {
    component.advancedFilters['estado'] = 'true';
    component.applyAdvancedFilters();
    expect(userServiceMock.findByPage).toHaveBeenCalledWith(
      0,
      100,
      '',
      JSON.stringify({ estado: 'true' }),
    );

    userServiceMock.findByPage.calls.reset();
    component.load({ first: 100, rows: 100 } as any);
    expect(userServiceMock.findByPage).toHaveBeenCalledWith(
      100,
      100,
      '',
      JSON.stringify({ estado: 'true' }),
    );
  });

  it('should load options on init', () => {
    expect(component.permissionsOptions).toEqual([permission]);
    expect(component.modulesOptions).toEqual([moduleItem]);
    expect(component.rolesOptions).toEqual([role]);
  });

  it('should report required field errors', () => {
    const message = component.getErrorMessage('name');
    expect(message).toContain('obligatorio');
  });

  it('should set a valid form to submit', () => {
    component.userForm.patchValue({
      name: 'John',
      lastName: 'Doe',
      email: 'j@d.com',
    });
    const saveSpy = spyOn(component, 'save');
    component.onSubmit();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should toggle all permissions', () => {
    component.toggleAll('permissions', true);
    expect(component.userForm.get('permissions')?.value).toEqual([
      permission,
    ]);
  });

  it('should toggle all roles', () => {
    component.toggleAll('roles', true);
    expect(component.userForm.get('roles')?.value).toEqual([role]);
  });

  it('should build create form data with inactive modules', () => {
    component.create();

    expect(component.isEditForm).toBe(false);
    const modules = component.userForm.get('modules')?.value;
    expect(modules.length).toBe(1);
    expect(modules[0].isActive).toBe(false);
    expect(modules[0].routes[0].isActive).toBe(false);
  });

  it('should load company autocomplete options', () => {
    component.findByAutoComplete({ query: 'bpo' });
    expect(companiesServiceMock.findByAutoComplete).toHaveBeenCalledWith('bpo');
    expect(component.itemsAutocomplete).toEqual([
      { _id: 'c1', name: 'BPO' },
    ] as unknown as Companies[]);
  });

  it('should map selection data when editing', () => {
    component.create();
    const selected = {
      _id: 'u1',
      name: 'John',
      lastName: 'Doe',
      phone: '123',
      email: 'j@d.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      permissions: [permission],
      roles: [role],
      modules: [{ name: moduleItem.name, isActive: true, routes: [] }],
    };

    component.onSelectionChange(selected as unknown as User);

    expect(component.isEditForm).toBe(true);
    expect(component.userForm.get('name')?.value).toBe('John');
    expect(component.userForm.get('permissions')?.value).toEqual([permission]);
  });

  it('should require company on create mode', () => {
    component.create();
    expect(component.userForm.get('company')?.hasError('required')).toBe(true);
  });

  it('should enable isTrial on create and keep it editable for SuperAdmin', () => {
    component.create();
    const trial = component.userForm.get('isTrial');
    expect(trial?.enabled).toBe(true);
    expect(trial?.value).toBe(false);

    // SuperAdmin puede modificar la prueba en edición.
    component.isEditForm = true;
    component.updateValidatorsBasedOnEditMode();
    expect(trial?.enabled).toBe(true);

    // Un administrador normal no puede modificarla (se omite del formulario).
    sessionStoreMock.getClaims.and.returnValue({ isSuperAdmin: false });
    component.updateValidatorsBasedOnEditMode();
    expect(trial?.disabled).toBe(true);
    expect(component.getFormattedFormValues().isTrial).toBeUndefined();
  });

  it('should not allow selecting/blocking/deleting the logged-in user', () => {
    sessionStoreMock.getClaims.and.returnValue({
      _id: 'me',
      isSuperAdmin: true,
      company: 'BPONET',
      tenantId: '000000',
    });

    expect(component.rowSelectableFor({ _id: 'me' } as User)).toBe(false);
    expect(component.rowSelectableFor({ _id: 'other' } as User)).toBe(true);

    const selfActions = component.rowActionsFor({
      _id: 'me',
      isBlocked: false,
    } as User);
    expect(selfActions.find((a) => a.key === 'block')?.disabled).toBe(true);
    expect(selfActions.find((a) => a.key === 'softDelete')?.disabled).toBe(true);
    expect(selfActions.find((a) => a.key === 'hardDelete')?.disabled).toBe(true);

    const otherActions = component.rowActionsFor({
      _id: 'other',
      isBlocked: false,
    } as User);
    expect(otherActions.find((a) => a.key === 'block')?.disabled).toBeFalsy();
  });

  it('should toggle module routes', () => {
    const mod = JSON.parse(JSON.stringify(moduleItem));
    component.toggleModule(mod, { checked: false });
    expect(mod.isActive).toBe(false);
    expect(mod.routes[0].isActive).toBe(false);
  });

  it('should toggle route children', () => {
    const route = {
      name: 'Pages',
      path: '/pages',
      isActive: false,
      children: [{ name: 'Users', path: '/users', isActive: false }],
    };
    component.toggleRoute(route, { checked: true });
    expect(route.isActive).toBe(true);
    expect(route.children[0].isActive).toBe(true);
  });

  it('should expose the module route icon', () => {
    expect(component.getRouteIcon('home')).toBe('pi pi-home');
    expect(component.getRouteIcon('')).toBe('pi pi-circle');
  });

  it('should clear selections when toggled off', () => {
    component.userForm.get('permissions')?.setValue([permission]);
    component.userForm.get('roles')?.setValue([role]);

    component.toggleAll('permissions', false);
    component.toggleAll('roles', false);

    expect(component.userForm.get('permissions')?.value).toEqual([]);
    expect(component.userForm.get('roles')?.value).toEqual([]);
  });

  it('should not require company when editing', () => {
    component.create();
    component.updateValidatorsBasedOnEditMode();
    expect(component.userForm.get('company')?.hasError('required')).toBe(true);

    component.isEditForm = true;
    component.updateValidatorsBasedOnEditMode();
    expect(component.userForm.get('company')?.hasError('required')).toBe(false);
  });

  it('should return the raw form values', () => {
    component.userForm.patchValue({ name: 'John', email: 'j@d.com' });
    const values = component.getFormattedFormValues();
    expect(values.name).toBe('John');
    expect(values.email).toBe('j@d.com');
  });

  it('should show modules as inactive when the user has none', () => {
    component.create();
    selectUser({
      _id: 'u2',
      name: 'Jane',
      lastName: 'Doe',
      email: 'ja@d.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      permissions: [],
      roles: [],
      modules: [],
    });

    const modules = component.userForm.get('modules')?.value;
    expect(modules.length).toBe(1);
    expect(modules[0].isActive).toBe(false);
  });

  it('should not submit an invalid form', () => {
    const saveSpy = spyOn(component, 'save');
    component.userForm.reset();
    component.onSubmit();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should render the creation dialog', () => {
    component.create();
    fixture.detectChanges();

    expect(component.isFormVisible).toBe(true);
    expect(component.isDisplayForm).toBe(true);
    expect(component.isEditForm).toBe(false);
  });

  it('should render the edit dialog with populated data', () => {
    component.create();
    selectUser({
      _id: 'u1',
      name: 'John',
      lastName: 'Doe',
      phone: '123',
      email: 'j@d.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      permissions: [permission],
      roles: [role],
      modules: [
        {
          ...moduleItem,
          isActive: true,
          routes: [
            { name: 'Pages', path: '/pages', icon: 'layout', isActive: true, children: [] },
          ],
        },
      ],
    });
    fixture.detectChanges();

    expect(component.isEditForm).toBe(true);
    expect(component.titleForm).toBe('Edición de Usuario');
    expect(component.userForm.get('modules')?.value.length).toBe(1);
    expect(component.userForm.get('modules')?.value[0].isActive).toBe(true);
  });

  it('should skip reloading options when already loaded', () => {
    permissionServiceMock.findAll.calls.reset();
    component.ngOnInit();
    expect(permissionServiceMock.findAll).not.toHaveBeenCalled();
  });

  it('should render validation messages for touched invalid fields', () => {
    component.create();
    component.userForm.get('name')?.markAsTouched();
    component.userForm.get('lastName')?.markAsTouched();
    component.userForm.get('email')?.markAsTouched();
    fixture.detectChanges();

    expect(component.userForm.get('name')?.invalid).toBe(true);
  });

  it('should render modules with and without routes', () => {
    component.create();
    component.userForm.get('modules')?.setValue([
      { name: 'withRoutes', isActive: true, routes: [{ name: 'R', path: '/r' }] },
      { name: 'noRoutes', isActive: true, routes: [] },
    ]);
    fixture.detectChanges();

    expect(component.userForm.get('modules')?.value.length).toBe(2);
  });

  it('should return null for an unknown control', () => {
    expect(component.getErrorMessage('nope')).toBeNull();
  });

  it('should handle empty option responses', () => {
    permissionServiceMock.findAll.and.returnValue(of({} as any));
    moduleServiceMock.findAll.and.returnValue(of({} as any));
    rolesServiceMock.findAll.and.returnValue(of({} as any));
    component.permissionsOptions = [];
    component.modulesOptions = [];
    component.rolesOptions = [];

    component.ngOnInit();

    expect(component.permissionsOptions).toEqual([]);
    expect(component.modulesOptions).toEqual([]);
    expect(component.rolesOptions).toEqual([]);
  });

  it('should build the create form from a module with router alias', () => {
    component.modulesOptions = [{ name: 'x', router: [{ name: 'R', path: '/r' }] }];
    component.create();

    const modules = component.userForm.get('modules')?.value;
    expect(modules.length).toBe(1);
    expect(modules[0].routes[0].isActive).toBe(false);
  });

  it('should map selection with undefined arrays and foreign items', () => {
    component.create();
    selectUser({
      _id: 'u3',
      name: 'A',
      lastName: 'B',
      email: 'a@b.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      permissions: [{ _id: 'f1', name: 'Foreign' }],
      roles: [{ _id: 'r9', name: 'RolX', codeRol: 'X', isActive: true }],
      modules: undefined,
    } as any);

    expect(component.userForm.get('name')?.value).toBe('A');
    expect(component.userForm.get('permissions')?.value[0].name).toBe('Foreign');
    expect(component.userForm.get('roles')?.value[0].name).toBe('RolX');
  });

  it('should match modules and routes by id/path when names differ', () => {
    component.create();
    selectUser({
      _id: 'u1',
      name: 'A',
      lastName: 'B',
      email: 'a@b.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      permissions: undefined,
      roles: undefined,
      modules: [
        {
          _id: 'm1',
          name: 'NOT_THE_SAME',
          isActive: true,
          routes: [
            {
              name: 'NOT_THE_SAME',
              path: '/pages',
              isActive: true,
              children: [{ name: 'Child', path: '/c', isActive: true }],
            },
          ],
        },
      ],
    } as any);

    const modules = component.userForm.get('modules')?.value;
    expect(modules[0].isActive).toBe(true);
    expect(modules[0].routes[0].isActive).toBe(true);
  });

  it('should produce an empty route list when the module has none', () => {
    component.modulesOptions = [{ name: 'bare', isActive: true }];
    component.create();

    const modules = component.userForm.get('modules')?.value;
    expect(modules[0].routes).toEqual([]);
  });

  it('should derive the parent route state from its children when parent is null', () => {
    component.modulesOptions = [
      {
        _id: 'm1',
        name: 'adminUserModule',
        isActive: true,
        routes: [
          {
            name: 'Pages',
            path: '/pages',
            isActive: null,
            children: [
              { name: 'Users', path: '/users', isActive: true },
              { name: 'Roles', path: '/roles', isActive: true },
            ],
          },
        ],
      },
    ];
    component.create();
    selectUser({
      _id: 'u1',
      name: 'A',
      lastName: 'B',
      email: 'a@b.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      modules: [
        {
          name: 'adminUserModule',
          isActive: true,
          routes: [
            {
              name: 'Pages',
              path: '/pages',
              isActive: null,
              children: [
                { name: 'Users', path: '/users', isActive: true },
                { name: 'Roles', path: '/roles', isActive: false },
              ],
            },
          ],
        },
      ],
    });

    const modules = component.userForm.get('modules')?.value;
    const route = modules[0].routes[0];
    expect(route.isActive).toBe(true);
    expect(route.children.find((c: any) => c.name === 'Users').isActive).toBe(true);
    expect(route.children.find((c: any) => c.name === 'Roles').isActive).toBe(false);
  });

  it('should keep user modules and routes that are not in the catalog', () => {
    component.modulesOptions = [
      { _id: 'm1', name: 'adminUserModule', isActive: true, routes: [] },
    ];
    component.create();
    selectUser({
      _id: 'u1',
      name: 'A',
      lastName: 'B',
      email: 'a@b.com',
      isActived: true,
      isAdmin: true,
      isSuperAdmin: false,
      company: 'BPO',
      modules: [
        {
          _id: 'm2',
          name: 'crmCampaign',
          isActive: true,
          routes: [
            {
              name: 'Opciones',
              path: '/pages',
              isActive: true,
              children: [{ name: 'Dashboard', path: '/dashboard', isActive: true }],
            },
          ],
        },
      ],
    });

    const modules = component.userForm.get('modules')?.value;
    const crm = modules.find((m: any) => m.name === 'crmCampaign');
    expect(crm).toBeTruthy();
    expect(crm.isActive).toBe(true);
    expect(crm.routes[0].children[0].isActive).toBe(true);
  });

  it('should recompute the parent route when a child is toggled', () => {
    const route = {
      name: 'Pages',
      path: '/pages',
      isActive: false,
      children: [
        { name: 'Users', path: '/users', isActive: false },
        { name: 'Roles', path: '/roles', isActive: false },
      ],
    };
    component.toggleChild(route, route.children[0], { checked: true });
    expect(route.isActive).toBe(true);

    component.toggleChild(route, route.children[0], { checked: false });
    expect(route.isActive).toBe(false);
  });

  it('should enable all routes and children when the module is activated', () => {
    const mod = {
      name: 'adminUserModule',
      isActive: false,
      routes: [
        {
          name: 'Pages',
          path: '/pages',
          isActive: false,
          children: [
            { name: 'Users', path: '/users', isActive: false },
            { name: 'Roles', path: '/roles', isActive: false },
          ],
        },
      ],
    };
    component.toggleModule(mod, { checked: true });
    expect(mod.isActive).toBe(true);
    expect(mod.routes[0].isActive).toBe(true);
    expect(mod.routes[0].children.every((c: any) => c.isActive)).toBe(true);
  });

  describe('carga masiva - validaciones', () => {
    const header = [
      'Nombres',
      'Apellidos',
      'Correo Electrónico',
      'Teléfono',
      'TenantId',
      'Empresa',
      'Usuario',
      'Roles',
      'Permisos',
      'Módulos',
    ];

    const validRow = (i = 0) => ({
      'Nombres': `Nombre${i}`,
      'Apellidos': `Apellido${i}`,
      'Correo Electrónico': `user${i}@mail.com`,
      'Teléfono': `300000000${i}`,
      'TenantId': '000000',
      'Empresa': 'BPONET',
      'Usuario': `user${i}`,
      'Roles': '',
      'Permisos': '',
      'Módulos': '',
    });

    const buildPreview = (rows: Record<string, unknown>[]) =>
      (component as any).buildPreview(header, rows);

    beforeEach(() => {
      confirmServiceMock.showMessage.calls.reset();
    });

    it('rechaza más de 50 usuarios y muestra el mensaje', () => {
      const rows = Array.from({ length: 51 }, (_, i) => validRow(i));
      buildPreview(rows);

      expect(
        component.previewErrors.some((e) => e.includes('límite máximo')),
      ).toBe(true);
      expect(
        component.previewErrors.some((e) => e.includes('51 usuarios')),
      ).toBe(true);
      expect(confirmServiceMock.showMessage).toHaveBeenCalled();
    });

    it('acepta exactamente 50 usuarios', () => {
      const rows = Array.from({ length: 50 }, (_, i) => validRow(i));
      buildPreview(rows);

      expect(
        component.previewErrors.some((e) => e.includes('límite máximo')),
      ).toBe(false);
    });

    it('ignora filas vacías o con solo espacios (no las cuenta)', () => {
      const rows = Array.from({ length: 50 }, (_, i) => validRow(i));
      const emptyRow = {
        'Nombres': ' ',
        'Apellidos': '',
        'Correo Electrónico': ' ',
        'Teléfono': '',
        'Usuario': '',
        'Empresa': '',
        'TenantId': '',
      };

      buildPreview([...rows, emptyRow]);

      expect(
        component.previewErrors.some((e) => e.includes('límite máximo')),
      ).toBe(false);
      expect(component.previewData.length).toBe(50);
    });

    it('muestra mensaje cuando el archivo está vacío', () => {
      buildPreview([]);
      expect(component.previewErrors).toContain('El archivo Excel está vacío.');
      expect(confirmServiceMock.showMessage).toHaveBeenCalled();
    });

    it('muestra mensaje cuando faltan columnas obligatorias', () => {
      (component as any).buildPreview(['Nombres'], [validRow()]);
      expect(
        component.previewErrors.some((e) =>
          e.includes('Faltan columnas obligatorias'),
        ),
      ).toBe(true);
    });

    it('muestra mensaje por campos obligatorios vacíos (teléfono ya no es obligatorio)', () => {
      buildPreview([{ ...validRow(), 'Nombres': '', 'Teléfono': '' }]);

      expect(
        component.previewErrors.some((e) => e.includes('Falta Nombres')),
      ).toBe(true);
      expect(
        component.previewErrors.some((e) => e.includes('Falta Teléfono')),
      ).toBe(false);
      expect(confirmServiceMock.showMessage).toHaveBeenCalled();
    });

    it('detecta correos duplicados dentro del archivo', () => {
      buildPreview([validRow(1), { ...validRow(2), 'Correo Electrónico': 'user1@mail.com' }]);

      expect(
        component.previewErrors.some((e) => e.includes('Correo duplicado')),
      ).toBe(true);
    });

    it('permite teléfonos duplicados (phone no es único)', () => {
      buildPreview([
        validRow(1),
        { ...validRow(2), 'Teléfono': '3000000001' },
      ]);

      expect(
        component.previewErrors.some((e) => e.includes('Teléfono duplicado')),
      ).toBe(false);
    });

    it('detecta usuarios duplicados dentro del archivo (global)', () => {
      buildPreview([
        validRow(1),
        { ...validRow(2), 'Usuario': 'user1' },
      ]);

      expect(
        component.previewErrors.some((e) => e.includes('Usuario duplicado')),
      ).toBe(true);
    });

    it('no reporta errores con datos válidos', () => {
      buildPreview([validRow(1), validRow(2)]);
      expect(component.previewErrors.length).toBe(0);
      expect(component.previewData.every((r) => r.status === 'OK')).toBe(true);
    });

    it('SuperAdmin: exige Empresa y TenantId en el archivo', () => {
      buildPreview([{ ...validRow(), 'Empresa': '', 'TenantId': '' }]);

      expect(
        component.previewErrors.some(
          (e) => e.includes('Falta Empresa') && e.includes('Falta TenantId'),
        ),
      ).toBe(true);
    });

    it('admin no-Super: no exige Empresa/TenantId y usa los de su sesión', () => {
      sessionStoreMock.getClaims.and.returnValue({
        isSuperAdmin: false,
        company: 'MIEMP',
        tenantId: 'MIEMP-ID',
      });

      const adminHeader = [
        'Nombres',
        'Apellidos',
        'Correo Electrónico',
        'Teléfono',
        'Usuario',
        'Roles',
        'Permisos',
        'Módulos',
      ];
      const adminRow = {
        'Nombres': 'Ana',
        'Apellidos': 'Gómez',
        'Correo Electrónico': 'ana@mail.com',
        'Teléfono': '3200000000',
        'Usuario': 'ana',
        'Roles': '',
        'Permisos': '',
        'Módulos': '',
      };

      (component as any).buildPreview(adminHeader, [adminRow]);

      expect(component.previewErrors.length).toBe(0);
      expect(component.previewData[0].empresa).toBe('MIEMP');
      expect(component.previewData[0].tenantId).toBe('MIEMP-ID');
    });
  });

  describe('disponibilidad de email/username', () => {
    it('la lupa de correo marca disponible', () => {
      userServiceMock.checkAvailability.and.returnValue(
        of({ data: { emailExists: false, usernameExists: false }, meta: {} } as any),
      );
      component.create();
      component.userForm.get('email')?.setValue('nuevo@mail.com');

      component.checkEmailNow();

      expect(userServiceMock.checkAvailability).toHaveBeenCalledWith({
        email: 'nuevo@mail.com',
        excludeId: undefined,
      });
      expect(component.emailStatus).toBe('available');
      expect(component.hasAvailabilityConflict).toBe(false);
    });

    it('marca conflicto si el correo existe y bloquea guardar', () => {
      userServiceMock.checkAvailability.and.returnValue(
        of({ data: { emailExists: true, usernameExists: false }, meta: {} } as any),
      );
      component.create();
      component.userForm.get('email')?.setValue('existe@mail.com');

      component.checkEmailNow();

      expect(component.emailStatus).toBe('taken');
      expect(component.hasAvailabilityConflict).toBe(true);
      expect(component.isSaveDisabled).toBe(true);
    });

    it('no consulta cuando el correo es inválido', () => {
      component.create();
      userServiceMock.checkAvailability.calls.reset();
      component.userForm.get('email')?.setValue('no-es-correo');

      component.checkEmailNow();

      expect(component.emailStatus).toBe('idle');
      expect(userServiceMock.checkAvailability).not.toHaveBeenCalled();
    });

    it('la lupa de usuario detecta conflicto global', () => {
      userServiceMock.checkAvailability.and.returnValue(
        of({ data: { emailExists: false, usernameExists: true }, meta: {} } as any),
      );
      component.create();
      component.userForm.get('username')?.setValue('juanp');

      component.checkUsernameNow();

      expect(component.usernameStatus).toBe('taken');
      expect(component.hasAvailabilityConflict).toBe(true);
    });

    it('bloquea onSubmit ante un conflicto de disponibilidad', () => {
      component.create();
      component.emailStatus = 'taken';
      const saveSpy = spyOn(component, 'save');

      component.onSubmit();

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('normaliza email y username a minúsculas al guardar', () => {
      component.create();
      component.userForm.patchValue({
        username: 'JuanP',
        email: 'A@B.com',
      });

      const values: any = component.getFormattedFormValues();

      expect(values.username).toBe('juanp');
      expect(values.email).toBe('a@b.com');
    });
  });

  describe('plantillas de carga masiva por rol', () => {
    it('SuperAdmin: incluye TenantId y Empresa', () => {
      sessionStoreMock.getClaims.and.returnValue({
        isSuperAdmin: true,
        company: 'BPONET',
        tenantId: '000000',
      });

      const { rows, fileName } = component.buildMassiveTemplateData();

      expect(fileName).toContain('SuperAdmin');
      expect(Object.keys(rows[0])).toContain('TenantId');
      expect(Object.keys(rows[0])).toContain('Empresa');
      expect(rows[0]['Empresa']).toBe('BPONET');
      expect(rows[0]['TenantId']).toBe('000000');
    });

    it('Admin no-Super: no incluye TenantId ni Empresa', () => {
      sessionStoreMock.getClaims.and.returnValue({
        isSuperAdmin: false,
        company: 'MIEMP',
        tenantId: 'MIEMP-ID',
      });

      const { rows, fileName } = component.buildMassiveTemplateData();

      expect(fileName).toContain('Admin');
      expect(fileName).not.toContain('SuperAdmin');
      expect(Object.keys(rows[0])).not.toContain('TenantId');
      expect(Object.keys(rows[0])).not.toContain('Empresa');
    });
  });

  describe('regla de rol SuperAdmin', () => {
    it('deshabilita y omite isSuperAdmin para un admin no-Super', () => {
      sessionStoreMock.getClaims.and.returnValue({
        isSuperAdmin: false,
        company: 'MIEMP',
        tenantId: 'MIEMP-ID',
      });

      component.create();

      expect(component.userForm.get('isSuperAdmin')?.disabled).toBe(true);
      const values: any = component.getFormattedFormValues();
      expect(values.isSuperAdmin).toBeUndefined();
    });

    it('habilita isSuperAdmin para un SuperAdmin', () => {
      sessionStoreMock.getClaims.and.returnValue({
        isSuperAdmin: true,
        company: 'BPONET',
        tenantId: '000000',
      });

      component.create();

      expect(component.userForm.get('isSuperAdmin')?.disabled).toBe(false);
    });
  });
});
