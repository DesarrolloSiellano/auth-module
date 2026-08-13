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
import { COMPANIES_FORM } from '../../shared/forms/companies.form';

describe('CompaniesComponent', () => {
  let component: CompaniesComponent;
  let fixture: ComponentFixture<CompaniesComponent>;

  let dataLoaderMock: jasmine.SpyObj<DataLoaderService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const companiesServiceMock = jasmine.createSpyObj('CompaniesService', [
      'findAll', 'findByPage',
    ]);
    companiesServiceMock.findByPage.and.returnValue(
      of({ data: [], meta: { totalData: 0 } }),
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
});
