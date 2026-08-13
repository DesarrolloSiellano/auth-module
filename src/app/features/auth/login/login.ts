import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { FormTemplateComponent } from '../../../shared/components/form-template/form-template.component';
import { Auth } from '../service/auth';
import { MessageModule } from 'primeng/message';
import { ProcessAuthData } from '../service/process-auth-data';
import { Router, RouterModule } from '@angular/router';
import { LOGIN_FORM } from '../../../shared/forms/login.form';
import { ActivatedRoute } from '@angular/router';
import { UAParser } from 'ua-parser-js';
import { Toast, ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { getHttpErrorInfo } from '../../../core/helpers/http-error';

@Component({
  selector: 'app-login',
  imports: [
    CardModule,
    PasswordModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FormTemplateComponent,
    MessageModule,
    RouterModule,
    Toast,
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

  redirectUri: string | null = null;
  parser: UAParser = new UAParser();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private auth: Auth,
    private processAuthData: ProcessAuthData,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        this.redirectUri = params['redirect_uri'] || null;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  login() {
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
        this.processAuthData.proccesAuthData(token, res.meta.refreshToken)
          .subscribe({
            next: () => {
              this.formComponent?.formGroup?.reset();
              this.messageSuccess.set('Inicio de sesión exitoso');
              this.showMessageSuccess.set(true);
              this.showMessageError.set(false);
              this.cdRef.detectChanges();

              setTimeout(() => {
                this.router.navigate(['/pages/users']);
              }, 800);
            },
            error: (profileError) => {
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
        console.error(err);
        this.showMessageSuccess.set(false);
        this.errorStatus.set(err.status);
        this.errorMessage.set(
          this.extractErrorMessage(err) || 'Error al iniciar sesión',
        );
        this.showMessageError.set(true);
        this.cdRef.detectChanges();

        setTimeout(() => {
          this.showMessageError.set(false);
          this.cdRef.detectChanges();
        }, 5000);
      },
      complete: () => {
        this.cdRef.detectChanges();
      },
    });
  }

  private extractErrorMessage(err: any): string {
    return getHttpErrorInfo(err).message;
  }

  recoveryPass() {
    this.router.navigate(['/recovery'], {
      queryParams: { redirect_uri: this.redirectUri },
    });
  }
}
