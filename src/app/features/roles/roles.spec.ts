import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { RolesComponent } from './roles';
import { RolesServices } from './services/roles';
import { PermissionService } from '../permissions/services/permission.service';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';

describe('RolesComponent', () => {
  let component: RolesComponent;
  let fixture: ComponentFixture<RolesComponent>;

  let permissionServiceMock: jasmine.SpyObj<PermissionService>;
  let dataLoaderMock: jasmine.SpyObj<DataLoaderService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  const permission: any = { _id: 'p1', name: 'Crear', action: 'create', isActive: true };
  const role: any = { _id: 'r1', name: 'Admin', codeRol: 'ADM', isActive: true, permissions: [permission] };

  beforeEach(async () => {
    permissionServiceMock = jasmine.createSpyObj('PermissionService', ['findAll']);
    permissionServiceMock.findAll.and.returnValue(
      of({ data: [permission as any], meta: {} } as any),
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
      imports: [RolesComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
      ],
    })
      .overrideComponent(RolesComponent, {
        remove: {
          providers: [
            RolesServices, PermissionService, DataLoaderService, ExcelExportService, ConfirmService,
          ],
        },
        add: {
          providers: [
            { provide: RolesServices, useValue: jasmine.createSpyObj('RolesServices', ['findByPage', 'findAll']) },
            { provide: PermissionService, useValue: permissionServiceMock },
            { provide: DataLoaderService, useValue: dataLoaderMock },
            { provide: ExcelExportService, useValue: {} },
            { provide: ConfirmService, useValue: confirmServiceMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load permission options on init', () => {
    const permissionsField = (component as any).form.find(
      (field: any) => field.name === 'permissions',
    );
    expect(permissionsField?.options).toEqual([
      { name: permission.name, value: permission },
    ]);
  });

  it('should set the creation title from the subtitle', () => {
    component.create();
    expect(component.isEditForm).toBe(false);
    expect(component.titleForm).toBe('Creación de Rol');
  });

  it('should map selected permissions when editing', () => {
    component.create();
    component.onSelectionChange(role);

    expect(component.isEditForm).toBe(true);
    expect(component.titleForm).toBe('Edición de Roles');
    expect((component.initialData as any).permissions[0].value).toEqual(permission);
  });

  it('should keep raw permissions when no option matches', () => {
    component.create();
    const foreign = { _id: 'p9', name: 'Borrar', action: 'delete', isActive: true };
    component.onSelectionChange({ ...role, permissions: [foreign] });

    expect((component.initialData as any).permissions[0].name).toBe('Borrar');
  });

  it('should do nothing when selection is empty', () => {
    component.onSelectionChange(undefined);
    expect(component.isEditForm).toBe(false);
    expect(component.initialData).toBeUndefined();
  });

  it('should render the creation dialog', () => {
    component.create();
    fixture.detectChanges();
    expect(component.isFormVisible).toBe(true);
    expect(component.isDisplayForm).toBe(true);
  });

  it('should keep raw permissions when no options are configured', () => {
    (component as any).form = [
      { name: 'name', label: 'Nombre', type: 'text', show: true, weight: 1 },
    ];
    const foreign = { _id: 'p9', name: 'Borrar', action: 'delete', isActive: true };

    component.onSelectionChange({ ...role, permissions: [foreign] });

    expect((component.initialData as any).permissions[0].name).toBe('Borrar');
  });

  it('should handle a role without permissions', () => {
    component.create();
    component.onSelectionChange({ ...role, permissions: undefined });

    expect(component.isEditForm).toBe(true);
    expect((component.initialData as any).permissions).toEqual([]);
  });
});
