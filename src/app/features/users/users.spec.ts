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
import { ENVIROMENT } from '../../../enviroments/enviroment';

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

  const permission = { _id: 'p1', name: 'Crear', action: 'create', isActive: true };
  const role = { _id: 'r1', name: 'Admin', codeRol: 'ADM', isActive: true };
  const moduleItem = {
    _id: 'm1',
    name: ENVIROMENT.storageKey,
    isActive: true,
    routes: [
      { name: 'Pages', path: '/pages', icon: 'layout' },
    ],
  };

  beforeEach(async () => {
    userServiceMock = jasmine.createSpyObj('UserService', [
      'findAll', 'findByPage', 'findById', 'create', 'update', 'delete',
    ]);
    userServiceMock.findByPage.and.returnValue(
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

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
        { provide: CompaniesService, useValue: companiesServiceMock },
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
    expect(component.itemsAutocomplete).toEqual([{ _id: 'c1', name: 'BPO' }]);
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

    component.onSelectionChange(selected);

    expect(component.isEditForm).toBe(true);
    expect(component.userForm.get('name')?.value).toBe('John');
    expect(component.userForm.get('permissions')?.value).toEqual([permission]);
  });

  it('should require company on create mode', () => {
    component.create();
    expect(component.userForm.get('company')?.hasError('required')).toBe(true);
  });

  it('should toggle module routes', () => {
    const mod = JSON.parse(JSON.stringify(moduleItem));
    component.toggleModule(mod, { checked: false });
    expect(mod.isActive).toBe(false);
    expect(mod.routes[0].isActive).toBe(false);
  });

  it('should toggle route children', () => {
    const route = { isActive: false, children: [{ isActive: false }] };
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
    component.onSelectionChange({
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
    component.onSelectionChange({
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
    component.onSelectionChange({
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
    component.onSelectionChange({
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
});
