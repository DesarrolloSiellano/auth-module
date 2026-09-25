import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { NavbarComponent } from './navbar.component';
import { SidebarService } from '../services/sidebar.service';
import { GetConfigAppService } from '../../shared/services/get-config.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { Auth } from '../../features/auth/service/auth';
import { SessionStore } from '../../core/services/session.store';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';

@Component({ selector: 'app-form-template', standalone: true, template: '' })
class MockFormTemplate {
  @Input() form: any;
  @Input() initialData: any;
  @Input() colClass: any;
  @Input() isEdit: any;
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authMock: jasmine.SpyObj<Auth>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;
  let toggleSidebarSpy: jasmine.Spy;
  let sidebarSubject: BehaviorSubject<boolean>;
  let session: SessionStore;
  let router: Router;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('Auth', ['changePassword', 'logout']);
    authMock.logout.and.returnValue(of({} as any));
    confirmServiceMock = jasmine.createSpyObj('ConfirmService', [
      'showMessage',
      'confirm',
    ]);
    confirmServiceMock.confirm.and.returnValue(Promise.resolve(true));
    toggleSidebarSpy = jasmine.createSpy('toggleSidebar');
    sidebarSubject = new BehaviorSubject(true);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: GetConfigAppService,
          useValue: { getModule: () => ({ description: 'Módulo' }), getUserName: () => 'Admin' },
        },
        { provide: ConfirmService, useValue: confirmServiceMock },
        { provide: Auth, useValue: authMock },
      ],
    })
      .overrideComponent(NavbarComponent, {
        remove: { providers: [SidebarService], imports: [FormTemplateComponent] },
        add: {
          providers: [
            { provide: SidebarService, useValue: { sidebarState: sidebarSubject.asObservable(), toggleSidebar: toggleSidebarSpy } },
          ],
          imports: [MockFormTemplate],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the module config and user name on init', () => {
    expect(component.moduleConfig as any).toEqual({ description: 'Módulo' });
    expect(component.username).toBe('Admin');
  });

  it('should toggle the input visibility', () => {
    component.inputVisible = false;
    component.toggleInput();
    expect(component.inputVisible).toBe(true);
  });

  it('should toggle the sidebar through the sidebar service', () => {
    component.toggleSidebar();
    expect(toggleSidebarSpy).toHaveBeenCalled();
  });

  it('should reflect both sidebar states in the template', () => {
    expect(component.isSidebarOpen).toBe(true);
    fixture.detectChanges();

    sidebarSubject.next(false);
    fixture.detectChanges();
    expect(component.isSidebarOpen).toBe(false);

    sidebarSubject.next(true);
    fixture.detectChanges();
    expect(component.isSidebarOpen).toBe(true);
  });

  it('should open the cog dropdown', () => {
    const trigger = document.createElement('button');
    spyOn(component.dropdown, 'open');
    component.toggleDropdown(trigger);
    expect(component.dropdown.open).toHaveBeenCalledWith(trigger);
  });

  it('should render the change password dialog when opened', () => {
    component.changePassword();
    fixture.detectChanges();

    expect(component.isDisplayChangePassword).toBe(true);

    component.closeDialog();
    fixture.detectChanges();
    expect(component.isDisplayChangePassword).toBe(false);
  });

  it('should open and close the change password dialog', () => {
    expect(component.isDisplayChangePassword).toBe(false);
    component.changePassword();
    expect(component.isDisplayChangePassword).toBe(true);
    component.closeDialog();
    expect(component.isDisplayChangePassword).toBe(false);
  });

  it('should expose the change password option action', () => {
    component.cogOptions[0].action();
    expect(component.isDisplayChangePassword).toBe(true);
  });

  it('should change the password successfully', fakeAsync(() => {
    authMock.changePassword.and.returnValue(
      of({ statusCode: 200, message: 'Cambio exitoso', data: null } as any),
    );
    component.formComponent = {
      formGroup: {
        get: (name: string) =>
          ({ value: name === 'currentPassword' ? 'old' : 'new' }) as any,
        reset: () => {},
      },
    } as any;

    component.save();
    tick();

    expect(authMock.changePassword).toHaveBeenCalled();
    expect(confirmServiceMock.showMessage).toHaveBeenCalledWith(
      'info',
      'Exito',
      'Cambio exitoso',
    );
    expect(localStorage.getItem('isNewUser')).toBe('false');
    expect(component.isDisplayChangePassword).toBe(false);
  }));

  it('should reset the button on change password error', fakeAsync(() => {
    authMock.changePassword.and.returnValue(
      throwError(() => ({ error: { message: 'boom' } })),
    );
    component.formComponent = {
      formGroup: { get: () => ({ value: 'x' }), reset: () => {} },
    } as any;
    spyOn(console, 'error');

    component.save();
    tick();

    expect(component.disabledButton).toBe(false);
  }));

  it('should handle a 201 change password response', fakeAsync(() => {
    authMock.changePassword.and.returnValue(
      of({ statusCode: 201, message: 'Ok', data: null } as any),
    );
    component.formComponent = {
      formGroup: {
        get: (name: string) => ({ value: name === 'currentPassword' ? 'old' : 'new' }) as any,
        reset: () => {},
      },
    } as any;

    component.save();
    tick();

    expect(confirmServiceMock.showMessage).toHaveBeenCalledWith(
      'info',
      'Exito',
      'Ok',
    );
  }));

  it('should clear the session on logout', fakeAsync(() => {
    session.setTokens('access', 'refresh');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.logout();
    tick();

    expect(session.getAccessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should not clear the session when logout is cancelled', fakeAsync(() => {
    confirmServiceMock.confirm.and.returnValue(Promise.resolve(false));
    session.setTokens('access', 'refresh');

    component.logout();
    tick();

    expect(session.getAccessToken()).toBe('access');
  }));

  it('should collapse the sidebar on small screens', () => {
    document.body.innerHTML =
      '<div class="sidebar"></div><div class="navbar"></div>';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });

    component.handleResize();

    expect(
      document.querySelector('.sidebar')?.classList.contains('collapsed'),
    ).toBe(true);
    expect(
      document.querySelector('.navbar')?.classList.contains('sidebar-collapsed'),
    ).toBe(true);
  });

  it('should expand the sidebar on large screens', () => {
    document.body.innerHTML =
      '<div class="sidebar collapsed"></div><div class="navbar"></div>';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });

    component.handleResize();

    expect(
      document.querySelector('.sidebar')?.classList.contains('collapsed'),
    ).toBe(false);
    expect(
      document.querySelector('.navbar')?.classList.contains('sidebar-expanded'),
    ).toBe(true);
  });

  it('should add the dashboard overlay when the sidebar opens on small screens', () => {
    document.body.innerHTML =
      '<div class="sidebar collapsed"></div><div class="navbar"></div><div class="dashboard-content"></div>';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });

    component.toggleSidebar();

    const content = document.querySelector('.dashboard-content');
    expect(content?.classList.contains('dashboard-overlay')).toBe(true);
  });

  it('should remove the dashboard overlay on large screens', () => {
    document.body.innerHTML =
      '<div class="sidebar collapsed"></div><div class="navbar"></div><div class="dashboard-content dashboard-overlay"></div>';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });

    component.toggleSidebar();

    const content = document.querySelector('.dashboard-content');
    expect(content?.classList.contains('dashboard-overlay')).toBe(false);
  });
});
