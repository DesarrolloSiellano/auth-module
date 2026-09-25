import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { MySessionsComponent } from './my-sessions';
import { SessionsService } from '../sessions/services/sessions.service';
import { AuditService } from '../reports/services/audit.service';

describe('MySessionsComponent', () => {
  let component: MySessionsComponent;
  let fixture: ComponentFixture<MySessionsComponent>;
  let sessionsServiceMock: jasmine.SpyObj<SessionsService>;
  let auditServiceMock: jasmine.SpyObj<AuditService>;

  const session = {
    _id: 's1',
    user: 'u1',
    email: 'a@mail.com',
    company: 'BPONET',
    ip: '127.0.0.1',
    browser: 'Chrome',
    os: 'Mac',
    isActive: true,
    created: '2026-09-24 10:00:00',
    lastActivityAt: '2026-09-24 10:05:00',
  };

  beforeEach(async () => {
    sessionsServiceMock = jasmine.createSpyObj('SessionsService', [
      'findMine',
      'revokeMine',
      'revokeAllMine',
    ]);
    auditServiceMock = jasmine.createSpyObj('AuditService', ['mine']);
    sessionsServiceMock.findMine.and.returnValue(
      of({ data: [session], meta: { totalData: 1 } } as any),
    );
    auditServiceMock.mine.and.returnValue(
      of({
        data: [
          {
            _id: 'a1',
            action: 'login.success',
            category: 'auth',
            status: 'success',
            createdAt: '2026-09-24T10:00:00.000Z',
          },
        ],
        meta: { totalData: 1 },
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [MySessionsComponent],
      providers: [
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
        { provide: SessionsService, useValue: sessionsServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MySessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga sesiones e historial', () => {
    expect(sessionsServiceMock.findMine).toHaveBeenCalled();
    component.loadAudit();
    expect(auditServiceMock.mine).toHaveBeenCalled();
    expect(component.sessions.length).toBe(1);
    expect(component.audit.length).toBe(1);
  });

  it('traduce la acción de auditoría', () => {
    expect(component.actionLabel('login.success')).toBe('Inicio de sesión');
  });

  it('cierra una sesión tras confirmar', async () => {
    sessionsServiceMock.revokeMine.and.returnValue(of({} as any));
    spyOn<any>(component['confirmService'], 'confirm').and.resolveTo(true);

    await component.revoke(session as any);

    expect(sessionsServiceMock.revokeMine).toHaveBeenCalledWith('s1');
  });
});
