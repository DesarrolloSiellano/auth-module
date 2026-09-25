import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';

import { TenantConfigComponent } from './tenant-config';
import { TenantConfigService } from './services/tenant-config.service';

describe('TenantConfigComponent (catálogo)', () => {
  let component: TenantConfigComponent;
  let fixture: ComponentFixture<TenantConfigComponent>;
  let tenantServiceMock: jasmine.SpyObj<TenantConfigService>;

  beforeEach(async () => {
    tenantServiceMock = jasmine.createSpyObj('TenantConfigService', [
      'getCatalog',
      'createDefinition',
      'updateDefinition',
      'deleteDefinition',
    ]);
    tenantServiceMock.getCatalog.and.returnValue(
      of({
        data: [
          {
            key: 'features.pbx',
            label: 'PBX',
            group: 'features',
            type: 'boolean',
            defaultValue: false,
          },
        ],
        meta: { totalData: 1 },
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [TenantConfigComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
      ],
    })
      .overrideComponent(TenantConfigComponent, {
        remove: { providers: [TenantConfigService] },
        add: {
          providers: [{ provide: TenantConfigService, useValue: tenantServiceMock }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenantConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga el catálogo', () => {
    expect(component.catalog.length).toBe(1);
    expect(component.catalog[0].key).toBe('features.pbx');
  });

  it('abre el diálogo de creación con valores por defecto', () => {
    component.openCreateDefinition();
    expect(component.isEditingDefinition).toBe(false);
    expect(component.definitionDialogVisible).toBe(true);
    expect(component.definitionForm.type).toBe('boolean');
  });

  it('abre el diálogo de edición con los datos de la política', () => {
    component.openEditDefinition(component.catalog[0]);
    expect(component.isEditingDefinition).toBe(true);
    expect(component.definitionForm.key).toBe('features.pbx');
  });

  it('crea una definición nueva', () => {
    tenantServiceMock.createDefinition.and.returnValue(
      of({ data: {}, meta: {} } as any),
    );
    component.openCreateDefinition();
    component.definitionForm = {
      key: 'features.x',
      label: 'X',
      group: 'features',
      type: 'boolean',
      defaultValue: 'true',
      order: 1,
    };

    component.saveDefinition();

    expect(tenantServiceMock.createDefinition).toHaveBeenCalled();
    expect(component.definitionDialogVisible).toBe(false);
  });
});
