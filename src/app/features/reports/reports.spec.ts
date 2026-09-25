import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { ReportsComponent } from './reports';
import { ReportsService } from './services/reports.service';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportsServiceMock: jasmine.SpyObj<ReportsService>;

  const catalogItem = {
    id: 'users-list',
    nombre: 'Usuarios',
    descripcion: 'Usuarios',
    category: 'Usuarios',
    filters: [{ key: 'estado', label: 'Estado', type: 'text' as const }],
    formats: ['xlsx', 'csv', 'pdf'],
  };

  beforeEach(async () => {
    reportsServiceMock = jasmine.createSpyObj('ReportsService', [
      'getCatalog',
      'preview',
      'export',
    ]);
    reportsServiceMock.getCatalog.and.returnValue(
      of({ data: [catalogItem], meta: { totalData: 1 } } as any),
    );
    reportsServiceMock.preview.and.returnValue(
      of({
        data: {
          id: 'users-list',
          nombre: 'Usuarios',
          columns: [{ key: 'nombre', label: 'Nombre' }],
          rows: [{ nombre: 'Ana' }],
          summary: [],
          total: 1,
        },
        meta: {},
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideAnimationsAsync(),
        MessageService,
        { provide: ReportsService, useValue: reportsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga el catálogo al iniciar', () => {
    expect(reportsServiceMock.getCatalog).toHaveBeenCalled();
    expect(component.catalog.length).toBe(1);
  });

  it('inicializa filtros al seleccionar un reporte', () => {
    component.selectReport(catalogItem);
    expect(component.selected?.id).toBe('users-list');
    expect(component.filters['estado']).toBe('');
  });

  it('genera la vista previa', () => {
    component.selectReport(catalogItem);
    component.runPreview();
    expect(reportsServiceMock.preview).toHaveBeenCalledWith(
      'users-list',
      jasmine.any(Object),
      50,
    );
    expect(component.preview?.rows.length).toBe(1);
  });
});
