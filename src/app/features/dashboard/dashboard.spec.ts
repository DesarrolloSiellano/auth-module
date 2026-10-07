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
  let claims: Record<string, unknown>;

  beforeEach(async () => {
    claims = { company: 'BPONET', tenantId: '0000000' };
    tenantServiceMock = jasmine.createSpyObj('TenantConfigService', [
      'getCatalog',
      'getMyConfig',
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
          {
            key: 'general.timezone',
            label: 'Zona horaria',
            group: 'general',
            type: 'select',
            defaultValue: 'America/Bogota',
          },
        ],
        meta: { totalData: 4 },
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

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideAnimationsAsync(),
        {
          provide: SessionStore,
          useValue: { getClaims: () => claims },
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

  it('expone la información general del tenant', () => {
    expect(component.generalInfo.map((i) => i.key)).toContain('general.timezone');
  });

  it('resume el catálogo por grupo', () => {
    expect(component.catalogSummary.map((g) => g.group)).toContain('channels');
  });

  it('no muestra la barra de prueba si el usuario no es de prueba', () => {
    expect(component.isTrialUser).toBe(false);
  });

  it('calcula días, porcentaje y color de la prueba según la config del tenant', () => {
    claims = {
      company: 'BPONET',
      tenantId: '0000000',
      isTrial: true,
      trialStartedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
      trialEndsAt: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    };
    component.configValues = { 'limits.trialDays': 10 };

    expect(component.isTrialUser).toBe(true);
    expect(component.trialTotalDays).toBe(10);
    expect(component.trialElapsedDays).toBe(6);
    expect(component.trialPercent).toBe(60);
    expect(component.trialState).toBe('warn'); // 60% → ámbar

    component.configValues = { 'limits.trialDays': 8 };
    expect(component.trialPercent).toBe(75);
    expect(component.trialState).toBe('warn');

    component.configValues = { 'limits.trialDays': 7 };
    expect(component.trialPercent).toBe(86);
    expect(component.trialState).toBe('danger'); // >= 80% → rojo
  });

  it('marca la prueba como expirada cuando la fecha venció', () => {
    claims = {
      company: 'BPONET',
      tenantId: '0000000',
      isTrial: true,
      trialStartedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
      trialEndsAt: new Date(Date.now() - 86_400_000).toISOString(),
    };
    component.configValues = { 'limits.trialDays': 7 };

    expect(component.trialExpired).toBe(true);
    expect(component.trialState).toBe('expired');
  });
});
