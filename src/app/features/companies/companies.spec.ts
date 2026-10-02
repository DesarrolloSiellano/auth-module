import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { CompaniesComponent } from './companies';
import { CompaniesService } from './services/companies.service';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { SessionStore } from '../../core/services/session.store';
import { COMPANIES_FORM } from '../../shared/forms/companies.form';

describe('CompaniesComponent', () => {
  let component: CompaniesComponent;
  let fixture: ComponentFixture<CompaniesComponent>;

  let dataLoaderMock: jasmine.SpyObj<DataLoaderService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;
  let companiesServiceMock: jasmine.SpyObj<CompaniesService>;
  let sessionStoreMock: { getClaims: jasmine.Spy };

  beforeEach(async () => {
    sessionStoreMock = {
      getClaims: jasmine
        .createSpy('getClaims')
        .and.returnValue({ isSuperAdmin: true }),
    };

    companiesServiceMock = jasmine.createSpyObj('CompaniesService', [
      'findAll', 'findByPage', 'block', 'unblock',
    ]);
    companiesServiceMock.findByPage.and.returnValue(
      of({ data: [], meta: { totalData: 0 } } as any),
    );
    companiesServiceMock.block.and.returnValue(of({ statusCode: 200 } as any));
    companiesServiceMock.unblock.and.returnValue(of({ statusCode: 200 } as any));

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
      imports: [CompaniesComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
      ],
    })
      .overrideComponent(CompaniesComponent, {
        remove: {
          providers: [CompaniesService, DataLoaderService, ExcelExportService, ConfirmService],
        },
        add: {
          providers: [
            { provide: CompaniesService, useValue: companiesServiceMock },
            { provide: DataLoaderService, useValue: dataLoaderMock },
            { provide: ExcelExportService, useValue: {} },
            { provide: ConfirmService, useValue: confirmServiceMock },
            { provide: SessionStore, useValue: sessionStoreMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define title, subtitle and columns', () => {
    expect(component.title).toBe('Compañias');
    expect(component.subtitle).toBe('Compañia');
    expect(component.cols.length).toBeGreaterThan(0);
  });

  it('should use the companies form config', () => {
    expect((component as any).form).toEqual(COMPANIES_FORM);
  });

  it('should open the creation dialog', () => {
    component.create();
    expect(component.isEditForm).toBe(false);
    expect(component.isFormVisible).toBe(true);
    expect(component.titleForm).toBe('Creación de Compañia');
  });

  it('should expose a block action and an unblock action per state', () => {
    const active = component.actionsForCompany({
      _id: '1',
      isBlocked: false,
    } as any);
    expect(active.some((action) => action.key === 'block')).toBe(true);
    expect(active.some((action) => action.key === 'unblock')).toBe(false);

    const blocked = component.actionsForCompany({
      _id: '1',
      isBlocked: true,
    } as any);
    expect(blocked.some((action) => action.key === 'unblock')).toBe(true);
    expect(blocked.some((action) => action.key === 'block')).toBe(false);
  });

  it('should open the block dialog on the block action', () => {
    component.onExtraAction({
      key: 'block',
      row: { _id: '1', name: 'EmpresaX', isBlocked: false },
    });

    expect(component.blockDialogVisible).toBe(true);
    expect(component.blockTarget?.name).toBe('EmpresaX');
  });

  it('should block the company with reason and until', () => {
    component.blockTarget = { _id: '1', name: 'EmpresaX' } as any;
    component.blockReason = 'mora';
    component.blockUntil = new Date('2026-01-01T00:00:00.000Z');

    component.confirmBlock();

    expect(companiesServiceMock.block).toHaveBeenCalledWith('1', {
      reason: 'mora',
      until: jasmine.any(String),
    });
    expect(component.blockDialogVisible).toBe(false);
  });

  it('should unblock a company after confirmation', async () => {
    await component.unblockCompany({ _id: '1', name: 'EmpresaX' } as any);
    expect(companiesServiceMock.unblock).toHaveBeenCalledWith('1');
  });

  it('should not offer block/unblock to non-SuperAdmin', () => {
    sessionStoreMock.getClaims.and.returnValue({ isSuperAdmin: false });

    const actions = component.actionsForCompany({
      _id: '1',
      isBlocked: false,
    } as any);
    expect(actions.some((action) => action.key === 'block')).toBe(false);
    expect(actions.some((action) => action.key === 'unblock')).toBe(false);

    component.onExtraAction({
      key: 'block',
      row: { _id: '1', name: 'EmpresaX', isBlocked: false },
    });
    expect(component.blockDialogVisible).toBe(false);
    expect(confirmServiceMock.showMessage).toHaveBeenCalled();
  });
});
