import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';

import { SessionsComponent } from './sessions';
import { SessionsService } from './services/sessions.service';
import { SessionStore } from '../../core/services/session.store';

describe('SessionsComponent', () => {
  let component: SessionsComponent;
  let fixture: ComponentFixture<SessionsComponent>;
  let sessionsServiceMock: jasmine.SpyObj<SessionsService>;

  const sessionItem = {
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
      'findAll',
      'revoke',
      'revokeByUser',
      'revokeMany',
      'revokeAll',
    ]);
    sessionsServiceMock.findAll.and.returnValue(
      of({ data: [sessionItem], meta: { totalData: 1 } } as any),
    );

    await TestBed.configureTestingModule({
      imports: [SessionsComponent],
      providers: [
        provideAnimationsAsync(),
        MessageService,
        ConfirmationService,
        {
          provide: SessionStore,
          useValue: { getClaims: () => ({ isSuperAdmin: true }) },
        },
        { provide: SessionsService, useValue: sessionsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga las sesiones al iniciar', () => {
    expect(sessionsServiceMock.findAll).toHaveBeenCalled();
    expect(component.sessions.length).toBe(1);
  });

  it('detecta si es SuperAdmin', () => {
    expect(component.isSuperAdmin).toBe(true);
  });

  it('revoca una sesión tras confirmar', async () => {
    sessionsServiceMock.revoke.and.returnValue(of({} as any));
    spyOn<any>(component['confirmService'], 'confirm').and.resolveTo(true);

    await component.revoke(sessionItem as any);

    expect(sessionsServiceMock.revoke).toHaveBeenCalledWith('s1');
  });

  it('revoca las sesiones seleccionadas', async () => {
    sessionsServiceMock.revokeMany.and.returnValue(of({} as any));
    spyOn<any>(component['confirmService'], 'confirm').and.resolveTo(true);
    component.selected = [sessionItem as any];

    await component.revokeSelected();

    expect(sessionsServiceMock.revokeMany).toHaveBeenCalledWith(['s1']);
  });
});
