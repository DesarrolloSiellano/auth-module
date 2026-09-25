import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { ModulesComponent } from './modules';
import { ModuleService } from './services/module.service';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { Module, Route } from './interfaces/module.interface';

describe('ModulesComponent', () => {
  let component: ModulesComponent;
  let fixture: ComponentFixture<ModulesComponent>;

  let moduleServiceMock: jasmine.SpyObj<ModuleService>;
  let dataLoaderMock: jasmine.SpyObj<DataLoaderService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    moduleServiceMock = jasmine.createSpyObj('ModuleService', [
      'findAll', 'findByPage', 'create', 'update', 'delete',
    ]);
    moduleServiceMock.findByPage.and.returnValue(
      of({ data: [], meta: { totalData: 0 } } as any),
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
      imports: [ModulesComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
      ],
    })
      .overrideComponent(ModulesComponent, {
        remove: {
          providers: [ModuleService, DataLoaderService, ExcelExportService, ConfirmService],
        },
        add: {
          providers: [
            { provide: ModuleService, useValue: moduleServiceMock },
            { provide: DataLoaderService, useValue: dataLoaderMock },
            { provide: ExcelExportService, useValue: {} },
            { provide: ConfirmService, useValue: confirmServiceMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build an empty form on init', () => {
    expect(component.moduleForm.get('name')?.value).toBe('');
    expect(component.moduleForm.get('isActive')?.value).toBe(true);
    expect(component.routes.length).toBe(0);
  });

  it('should reset the form when creating', () => {
    component.addRoute();
    component.moduleForm.patchValue({ name: 'x' });

    component.create();

    expect(component.isEditForm).toBe(false);
    expect(component.moduleForm.get('name')?.value).toBe('');
    expect(component.routes.length).toBe(0);
  });

  it('should add and remove parent routes', () => {
    component.addRoute();
    expect(component.routes.length).toBe(1);

    component.addRoute();
    expect(component.routes.length).toBe(2);

    component.removeRoute(0);
    expect(component.routes.length).toBe(1);
  });

  it('should add and remove route children', () => {
    component.addRoute();
    component.addRouteChild(0);
    expect(component.getChildren(component.routes.at(0)).length).toBe(1);

    component.addRouteChild(0);
    expect(component.getChildren(component.routes.at(0)).length).toBe(2);

    component.removeRouteChild(0, 0);
    expect(component.getChildren(component.routes.at(0)).length).toBe(1);
  });

  it('should report row validation errors', () => {
    component.addRoute();
    const route = component.routes.at(0);
    expect(component.getRowErrorMessage(route, 'name')).toContain('obligatorio');
  });

  it('should return the formatted form values including routes', () => {
    component.addRoute();
    component.routes.at(0).patchValue({ name: 'Pages', path: '/pages' });

    const values = component.getFormattedFormValues();
    expect(values.name).toBe('');
    expect(values.routes.length).toBe(1);
    expect(values.routes[0].name).toBe('Pages');
  });

  it('should load selection data when editing', () => {
    component.onSelectionChange({
      _id: 'm9',
      name: 'adminUserModule',
      description: 'Desc',
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
    } as unknown as Module & { router?: Route[] });

    expect(component.isEditForm).toBe(true);
    expect(component.moduleForm.get('name')?.value).toBe('adminUserModule');
    expect(component.routes.length).toBe(1);
    expect(component.routes.at(0).get('path')?.value).toBe('/pages');
  });

  it('should submit when the form is valid', () => {
    component.moduleForm.patchValue({ name: 'admin', description: 'desc' });
    const saveSpy = spyOn(component, 'save');
    component.onSubmit();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should load selection data from the router alias', () => {
    component.onSelectionChange({
      _id: 'm9',
      name: 'adminUserModule',
      description: 'Desc',
      isActive: true,
      router: [
        {
          name: 'Pages',
          path: '/pages',
          initPath: '/pages/users',
          icon: 'layout',
          isActive: true,
          children: [],
        },
      ],
    } as unknown as Module & { router?: Route[] });

    expect(component.routes.length).toBe(1);
    expect(component.routes.at(0).get('name')?.value).toBe('Pages');
  });

  it('should build a route group from existing data', () => {
    const group = component.createRouteGroup({
      name: 'Pages',
      path: '/pages',
      initPath: '/pages/dashboard',
      icon: 'layout',
      isActive: true,
      children: [{ name: 'Child', path: '/c', initPath: '', icon: 'home', isActive: true }],
    });

    expect(group.get('name')?.value).toBe('Pages');
    expect(component.getChildren(group).length).toBe(1);
  });

  it('should render the creation dialog with a fresh form', () => {
    component.create();
    fixture.detectChanges();

    expect(component.isFormVisible).toBe(true);
    expect(component.isDisplayForm).toBe(true);
    expect(component.isEditForm).toBe(false);
    expect(component.routes.length).toBe(0);
  });

  it('should return null for an unknown root control', () => {
    expect(component.getErrorMessage('nope')).toBeNull();
  });

  it('should build an empty route list when selection has no routes', () => {
    component.onSelectionChange({
      _id: 'm9',
      name: 'admin',
      description: 'Desc',
      isActive: true,
    } as any);

    expect(component.isEditForm).toBe(true);
    expect(component.routes.length).toBe(0);
  });
});
