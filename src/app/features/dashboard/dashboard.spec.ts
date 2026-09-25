import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard';
import { SessionStore } from '../../core/services/session.store';
import { TenantConfigService } from '../tenant-config/services/tenant-config.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let tenantServiceMock: jasmine.SpyObj<TenantConfigService>;

  beforeEach(async () => {
    tenantServiceMock = jasmine.createSpyObj('TenantConfigService', [
      'getCatalog',
      'getMyConfig',
      'getUsage',
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
            key: 'channels.sms.enabled',
            label: 'SMS habilitado',
            group: 'channels',
            type: 'boolean',
            defaultValue: true,
          },
          {
            key: 'channels.sms.monthlyLimit',
            label: 'SMS por mes',
            group: 'channels',
            type: 'number',
            defaultValue: 3000,
            unit: 'mensajes/mes',
          },
        ],
        meta: { totalData: 3 },
      } as any),
    );
    tenantServiceMock.getMyConfig.and.returnValue(
      of({
        data: {
          tenantId: '0000000',
          company: 'BPONET',
          version: 1,
          // El backend devuelve la config anidada.
          features: { pbx: true },
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
            metrics: { 'sms.sent': 10, 'audio.sent': 5 },
          },
        ],
        meta: { totalData: 1 },
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideAnimationsAsync(),
        {
          provide: SessionStore,
          useValue: {
            getClaims: () => ({ company: 'BPONET', tenantId: '0000000' }),
          },
        },
        { provide: TenantConfigService, useValue: tenantServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toma la compañía y tenant del usuario', () => {
    expect(component.company).toBe('BPONET');
    expect(component.tenantId).toBe('0000000');
  });

  it('marca las políticas activas de la compañía', () => {
    expect(component.activeFeatures.length).toBe(1);
    expect(component.activeFeatures[0].label).toBe('PBX');
  });

  it('lista límites y cuotas', () => {
    const keys = component.quotas.map((q) => q.key);
    expect(keys).toContain('channels.sms.monthlyLimit');
  });

  it('calcula totales y barras por métrica', () => {
    expect(component.totalUsage).toBe(15);
    expect(component.totalsByMetric[0].metric).toBe('sms.sent');
    expect(component.barWidth(10)).toBe('100%');
  });
});
