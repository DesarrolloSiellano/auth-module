import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { ApiDocsComponent } from './api-docs';
import { ApiDocsService } from './services/api-docs.service';

describe('ApiDocsComponent', () => {
  let component: ApiDocsComponent;
  let fixture: ComponentFixture<ApiDocsComponent>;
  let serviceMock: jasmine.SpyObj<ApiDocsService>;

  beforeEach(async () => {
    serviceMock = jasmine.createSpyObj('ApiDocsService', [
      'getTcpDocs',
      'getRestDocs',
    ]);
    serviceMock.getTcpDocs.and.returnValue(
      of({
        data: {
          message: 'Catálogo TCP',
          note: 'solo documentación',
          serviceAuth: 'serviceKey obligatorio',
          total: 2,
          domains: ['auth', 'users'],
          commands: [
            {
              command: 'login',
              domain: 'auth',
              description: 'Inicia sesión',
              payloadExample: { serviceKey: 'x', email: 'a@b.com' },
            },
            {
              command: 'findUserById',
              domain: 'users',
              description: 'Busca usuario',
            },
          ],
        },
        meta: { totalData: 1 },
      } as any),
    );
    serviceMock.getRestDocs.and.returnValue(
      of({
        data: {
          message: 'Catálogo REST',
          note: 'solo documentación',
          total: 2,
          domains: ['auth', 'users'],
          endpoints: [
            { method: 'POST', path: '/api/auth/login', auth: 'Público', description: 'Login' },
            { method: 'GET', path: '/api/users', auth: 'JWT', description: 'Lista' },
          ],
        },
        meta: { totalData: 1 },
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [ApiDocsComponent],
      providers: [
        provideHttpClient(),
        provideAnimationsAsync(),
        MessageService,
      ],
    })
      .overrideComponent(ApiDocsComponent, {
        remove: { providers: [ApiDocsService] },
        add: { providers: [{ provide: ApiDocsService, useValue: serviceMock }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ApiDocsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga y calcula métricas TCP', () => {
    component.loadAll();
    expect(serviceMock.getTcpDocs).toHaveBeenCalled();
    expect(component.totalTcpCommands()).toBe(2);
    expect(component.tcpDomainCounts().length).toBe(2);
  });

  it('filtra comandos por búsqueda', () => {
    component.loadAll();
    component.search = 'login';
    expect(component.filteredTcp().length).toBe(1);
    expect(component.filteredTcp()[0].command).toBe('login');
  });

  it('cambia a REST y filtra por método', () => {
    component.loadAll();
    component.setTab('rest');
    component.search = 'post';
    expect(component.filteredRest().length).toBe(1);
    expect(component.filteredRest()[0].method).toBe('POST');
  });

  it('extrae el dominio de una ruta REST', () => {
    expect(component.pathDomain('/api/users/profile')).toBe('users');
  });

  it('formatea JSON de ejemplo', () => {
    expect(component.formatJson({ a: 1 })).toContain('"a": 1');
  });

  it('renderiza la documentación consumida de los endpoints', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('Documentación del API');
    expect(text).toContain('Comandos TCP');
    expect(text).toContain('login');
    expect(text).toContain('findUserById');
  });

  it('abre y cierra el diálogo de ejemplo de un endpoint REST', () => {
    component.loadAll();
    component.setTab('rest');
    const ep = component.filteredRest()[0];
    component.openEndpoint(ep);
    expect(component.endpointDialogVisible).toBeTrue();
    expect(component.selectedEndpoint).toBe(ep);
    component.closeEndpoint();
    expect(component.endpointDialogVisible).toBeFalse();
    expect(component.selectedEndpoint).toBeNull();
  });

  it('el encabezado y el cuerpo comparten el ancho de columnas', () => {
    component.loadAll();
    component.setTab('rest');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const ths = Array.from(el.querySelectorAll('thead th')) as HTMLElement[];
    const tds = Array.from(
      el.querySelectorAll('tbody tr:first-child td'),
    ) as HTMLElement[];

    expect(ths.length).toBe(tds.length);
    ths.forEach((th, i) => {
      const a = th.getBoundingClientRect();
      const b = tds[i].getBoundingClientRect();
      expect(Math.round(a.left)).toBe(Math.round(b.left));
      expect(Math.round(a.width)).toBe(Math.round(b.width));
    });
  });
});
