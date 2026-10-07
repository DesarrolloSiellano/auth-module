import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';

import { TenantPoliciesDialogComponent } from './tenant-policies-dialog';
import { TenantConfigService } from './services/tenant-config.service';

describe('TenantPoliciesDialogComponent', () => {
  let component: TenantPoliciesDialogComponent;
  let fixture: ComponentFixture<TenantPoliciesDialogComponent>;
  let tenantServiceMock: jasmine.SpyObj<TenantConfigService>;

  beforeEach(async () => {
    tenantServiceMock = jasmine.createSpyObj('TenantConfigService', [
      'getCatalog',
      'getConfigByTenant',
      'upsertConfig',
      'getUsage',
      'listUsagePeriods',
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
          {
            key: 'channels.sms.monthlyLimit',
            label: 'SMS',
            group: 'channels',
            type: 'number',
            defaultValue: 3000,
          },
        ],
        meta: { totalData: 2 },
      } as any),
    );
    tenantServiceMock.getConfigByTenant.and.returnValue(
      of({
        data: {
          tenantId: '0000000',
          company: 'BPONET',
          version: 1,
          values: { 'features.pbx': true },
        },
        meta: { totalData: 1 },
      } as any),
    );
    tenantServiceMock.getUsage.and.returnValue(
      of({
        data: [
          {
            tenantId: '0000000',
            period: '2026-09',
            metrics: { 'sms.sent': 5 },
          },
        ],
        meta: { totalData: 1 },
      } as any),
    );
    tenantServiceMock.listUsagePeriods.and.returnValue(
      of({ data: ['2026-09'], meta: { totalData: 1 } } as any),
    );

    await TestBed.configureTestingModule({
      imports: [TenantPoliciesDialogComponent],
      providers: [
        provideHttpClient(),
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
      ],
    })
      .overrideComponent(TenantPoliciesDialogComponent, {
        remove: { providers: [TenantConfigService] },
        add: {
          providers: [{ provide: TenantConfigService, useValue: tenantServiceMock }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TenantPoliciesDialogComponent);
    component = fixture.componentInstance;
    component.company = { id: '0000000', name: 'BPONET' } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al abrir carga catálogo, agrupa y resuelve valores', () => {
    component.visible = true;
    component.ngOnChanges({ visible: { currentValue: true } } as any);

    expect(component.catalogGroups.length).toBe(2);
    expect(component.configValues['features.pbx']).toBe(true);
    expect(component.configValues['channels.sms.monthlyLimit']).toBe(3000);
  });

  it('guarda la configuración de la empresa', () => {
    tenantServiceMock.upsertConfig.and.returnValue(
      of({ data: {}, meta: {} } as any),
    );
    component.configValues = { 'features.pbx': false };

    component.saveConfig();

    expect(tenantServiceMock.upsertConfig).toHaveBeenCalledWith('0000000', {
      company: 'BPONET',
      values: { 'features.pbx': false },
    });
  });

  it('mapea las métricas de uso a filas', () => {
    const rows = component.usageRows({
      tenantId: '0000000',
      period: '2026-09',
      metrics: { 'sms.sent': 3, 'audio.sent': 2 },
    } as any);

    expect(rows.length).toBe(2);
    expect(rows[0].metric).toBe('sms.sent');
    expect(rows[0].value).toBe(3);
  });

  it('aplana métricas anidadas (evita [object Object])', () => {
    const rows = component.usageRows({
      tenantId: '0000000',
      period: '2026-09',
      metrics: { whatsapp: { sent: 7 } },
    } as any);

    expect(rows).toEqual([{ metric: 'whatsapp.sent', value: 7 }]);
  });

  it('carga solo los períodos existentes', () => {
    component.visible = true;
    component.ngOnChanges({ visible: { currentValue: true } } as any);

    expect(component.usagePeriods).toEqual(['2026-09']);
    expect(component.usagePeriod).toBe('2026-09');
  });
});
