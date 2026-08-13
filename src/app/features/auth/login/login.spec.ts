import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { Auth } from '../service/auth';
import { ProcessAuthData } from '../service/process-auth-data';
import { FormTemplateComponent } from '../../../shared/components/form-template/form-template.component';

@Component({ selector: 'app-form-template', standalone: true, template: '' })
class MockFormTemplate {
  @Input() form: any;
  @Input() initialData: any;
  @Input() isEdit: any;
  @Input() width: any;
  @Input() colClass: any;
  @Input() titleForm: any;
  @Input() isVisible: any;
}

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authMock: jasmine.SpyObj<Auth>;
  let processAuthDataMock: jasmine.SpyObj<ProcessAuthData>;
  let router: Router;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('Auth', ['login']);
    processAuthDataMock = jasmine.createSpyObj('ProcessAuthData', [
      'proccesAuthData',
    ]);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        { provide: Auth, useValue: authMock },
        { provide: ProcessAuthData, useValue: processAuthDataMock },
      ],
    })
      .overrideComponent(Login, {
        remove: { providers: [Auth], imports: [FormTemplateComponent] },
        add: {
          providers: [{ provide: Auth, useValue: authMock }],
          imports: [MockFormTemplate],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render without success/error messages initially', () => {
    expect(component.showMessageError()).toBe(false);
    expect(component.showMessageSuccess()).toBe(false);
  });

  it('should process auth data and navigate on successful login', fakeAsync(() => {
    authMock.login.and.returnValue(
      of({
        message: 'Login successful',
        statusCode: 200,
        meta: { accessToken: 'access', refreshToken: 'refresh' },
        data: null,
      } as any),
    );
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));
    component.formComponent = {
      formGroup: { value: { email: 'a@b.com', password: '1234' }, reset: () => {} },
    } as any;
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.login();
    tick(900);
    fixture.detectChanges();

    expect(authMock.login).toHaveBeenCalled();
    expect(processAuthDataMock.proccesAuthData).toHaveBeenCalledWith(
      'access',
      'refresh',
    );
    expect(component.showMessageSuccess()).toBe(true);
    expect(component.messageSuccess()).toBe('Inicio de sesión exitoso');
    expect(router.navigate).toHaveBeenCalledWith(['/pages/users']);
  }));

  it('should show an error when login fails', fakeAsync(() => {
    authMock.login.and.returnValue(
      throwError(() => ({
        status: 403,
        error: { message: 'Creadenciales invalidas' },
      })),
    );

    component.login();
    tick();
    fixture.detectChanges();

    expect(component.showMessageError()).toBe(true);
    expect(component.errorMessage()).toContain('Creadenciales invalidas');
    expect(component.errorStatus()).toBe(403);

    tick(6000);
    fixture.detectChanges();
    expect(component.showMessageError()).toBe(false);
  }));

  it('should show an error when the profile load fails', fakeAsync(() => {
    authMock.login.and.returnValue(
      of({ message: 'Login successful', meta: { accessToken: 'access' }, data: null } as any),
    );
    processAuthDataMock.proccesAuthData.and.returnValue(
      throwError(() => new Error('No tienes permisos para acceder a este módulo')),
    );
    component.formComponent = {
      formGroup: { value: { email: 'a@b.com', password: '1234' }, reset: () => {} },
    } as any;

    component.login();
    tick();
    fixture.detectChanges();

    expect(component.showMessageError()).toBe(true);
    expect(component.errorMessage()).toContain('No tienes permisos');
  }));

  it('should navigate to recovery with the redirect uri', () => {
    component.redirectUri = 'http://x';
    const routerSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(
      Promise.resolve(true),
    );

    component.recoveryPass();

    expect(routerSpy).toHaveBeenCalledWith(['/recovery'], {
      queryParams: { redirect_uri: 'http://x' },
    });
  });

  it('should build the login payload and fall back to meta.token', fakeAsync(() => {
    (component as any).parser = {
      getResult: () => ({
        os: { name: '', version: '' },
        browser: { name: '', version: '' },
        device: { type: '' },
        ua: '',
      }),
    };
    authMock.login.and.returnValue(
      of({ statusCode: 200, meta: { token: 'tok', refreshToken: 'r' }, data: null } as any),
    );
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));
    component.formComponent = {
      formGroup: { value: { email: 'a@b.com', password: 'x' }, reset: () => {} },
    } as any;
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.login();
    tick();

    const request = authMock.login.calls.mostRecent().args[0];
    expect(request.meta.os).toBe('');
    expect(request.meta.ismovil).toBe(false);
    expect(processAuthDataMock.proccesAuthData).toHaveBeenCalledWith(
      'tok',
      'r',
    );
  }));
});
