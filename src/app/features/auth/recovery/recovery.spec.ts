import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { RecoveryComponent } from './recovery';
import { Auth } from '../service/auth';
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

describe('RecoveryComponent', () => {
  let component: RecoveryComponent;
  let fixture: ComponentFixture<RecoveryComponent>;
  let authMock: jasmine.SpyObj<Auth>;
  let router: Router;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('Auth', ['recoveryPassword']);

    await TestBed.configureTestingModule({
      imports: [RecoveryComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        MessageService,
        ConfirmationService,
        { provide: Auth, useValue: authMock },
      ],
    })
      .overrideComponent(RecoveryComponent, {
        remove: { providers: [Auth], imports: [FormTemplateComponent] },
        add: {
          providers: [{ provide: Auth, useValue: authMock }],
          imports: [MockFormTemplate],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecoveryComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render without messages initially', () => {
    expect(component.showMessageError()).toBe(false);
    expect(component.showMessageSuccess()).toBe(false);
  });

  it('should show success and redirect on recovery', fakeAsync(() => {
    authMock.recoveryPassword.and.returnValue(
      of({ statusCode: 200, message: 'Email enviado', data: null } as any),
    );
    component.formComponent = {
      formGroup: { value: { email: 'a@b.com' } },
    } as any;
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.recovery();
    tick();
    fixture.detectChanges();

    expect(authMock.recoveryPassword).toHaveBeenCalledWith('a@b.com', null);
    expect(component.showMessageSuccess()).toBe(true);

    tick(4000);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should show an error message on failure', fakeAsync(() => {
    authMock.recoveryPassword.and.returnValue(
      throwError(() => ({ status: 404, error: { message: 'Usuario no encontrado' } })),
    );

    component.recovery();
    tick();
    fixture.detectChanges();

    expect(component.showMessageError()).toBe(true);
    expect(component.errorMessage()).toContain('Usuario no encontrado');
    expect(component.errorStatus()).toBe(404);

    tick(4000);
    fixture.detectChanges();
    expect(component.showMessageError()).toBe(false);
  }));

  it('should navigate back to login with the redirect uri', fakeAsync(() => {
    authMock.recoveryPassword.and.returnValue(
      of({ statusCode: 200, message: 'Email enviado', data: null } as any),
    );
    component.formComponent = {
      formGroup: { value: { email: 'a@b.com' } },
    } as any;
    component.redirectUri = 'http://x';
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.recovery();
    tick(4000);

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirect_uri: 'http://x' },
    });
  }));
});
