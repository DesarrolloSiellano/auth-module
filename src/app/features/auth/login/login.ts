import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { FormTemplateComponent } from '../../../shared/components/form-template/form-template.component';
import { Auth } from '../service/auth';
import { Message } from 'primeng/message';
import { ProcessAuthData } from '../service/process-auth-data';
import { Router, RouterModule } from '@angular/router';
import { LOGIN_FORM } from '../../../shared/forms/login.form';
import { ActivatedRoute } from '@angular/router';
import { UAParser } from 'ua-parser-js';
import { Toast } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { getHttpErrorInfo } from '../../../core/helpers/http-error';

@Component({
  selector: 'app-login',
  imports: [
    Card,
    Toast,
    Button,
    FormTemplateComponent,
    Message,
    RouterModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [Auth],
})
export class Login implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(FormTemplateComponent) formComponent?: FormTemplateComponent;
  loginForm = LOGIN_FORM;
  showMessageError = signal(false);
  errorMessage = signal(''); // Señal para mensaje
  errorStatus = signal(0);
  showMessageSuccess = signal(false);
  messageSuccess = signal('');
  isSubmitting = signal(false);

  redirectUri: string | null = null;
  parser: UAParser = new UAParser();
  private subscriptions: Subscription = new Subscription();
  private timers: ReturnType<typeof setTimeout>[] = [];

  private readonly auth = inject(Auth);
  private readonly processAuthData = inject(ProcessAuthData);
  private readonly router = inject(Router);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        this.redirectUri = params['redirect_uri'] || null;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  login() {
    // Evita reenviar el formulario mientras la petición está en curso.
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const info = this.parser.getResult();
    const data = {
      meta: {
        os: info.os.name || '',
        os_version: info.os.version || '',
        browser: info.browser.name || '',
        browser_version: info.browser.version || '',
        istable: info.device.type === 'tablet',
        ismovil: info.device.type === 'mobile',
        isbrowser: !info.device.type,
        user_agent: info.ua || '',
      },
      ...this.formComponent?.formGroup?.value,
    };

    this.auth.login(data, this.redirectUri).subscribe({
      next: (res) => {
        if (res.url) {
          window.location.href = String(res.url);
          return;
        }
        const token = res.meta.accessToken || res.meta.token;
        const mustChangePassword =
          (res.meta as any)?.mustChangePassword === true;
        this.processAuthData.proccesAuthData(token, res.meta.refreshToken)
          .subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.formComponent?.formGroup?.reset();
              localStorage.setItem(
                'mustChangePassword',
                String(mustChangePassword),
              );
              this.messageSuccess.set('Inicio de sesión exitoso');
              this.showMessageSuccess.set(true);
              this.showMessageError.set(false);
              this.cdRef.detectChanges();

              this.timers.push(
                setTimeout(() => {
                  this.router.navigate([
                    mustChangePassword
                      ? '/change-password'
                      : '/pages/dashboard',
                  ]);
                }, 800),
              );
            },
            error: (profileError) => {
              this.isSubmitting.set(false);
              console.error(profileError);
              this.showMessageSuccess.set(false);
              this.errorStatus.set(profileError?.status || res.statusCode || 0);
              this.errorMessage.set(
                this.extractErrorMessage(profileError) ||
                  'No tienes permisos para acceder a este módulo',
              );
              this.showMessageError.set(true);
              this.cdRef.detectChanges();
            },
          });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error(err);
        this.showMessageSuccess.set(false);
        this.errorStatus.set(err.status);
        this.errorMessage.set(
          this.extractErrorMessage(err) || 'Error al iniciar sesión',
        );
        this.showMessageError.set(true);
        this.cdRef.detectChanges();

        this.timers.push(
          setTimeout(() => {
            this.showMessageError.set(false);
            this.cdRef.detectChanges();
          }, 5000),
        );
      },
      complete: () => {
        this.cdRef.detectChanges();
      },
    });
  }

  private extractErrorMessage(err: unknown): string {
    return getHttpErrorInfo(err).message;
  }

  recoveryPass() {
    this.router.navigate(['/recovery'], {
      queryParams: { redirect_uri: this.redirectUri },
    });
  }
}
