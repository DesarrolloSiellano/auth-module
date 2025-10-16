import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { Auth } from '../service/auth';
import { MessageModule } from 'primeng/message';
import { ProcessAuthData } from '../service/process-auth-data';
import { Router, RouterModule } from '@angular/router';
import { LOGIN_FORM } from '../../shared/forms/login.form';
import { ActivatedRoute } from '@angular/router';
import { UAParser } from 'ua-parser-js';

@Component({
  selector: 'app-login',
  imports: [
    CardModule,
    PasswordModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    FormTemplateComponent,
    MessageModule,
    RouterModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [Auth],
})
export class Login implements OnInit {
  @ViewChild(FormTemplateComponent) formComponent?: FormTemplateComponent;
  loginForm = LOGIN_FORM;
  showMessageError = signal(false);
  errorMessage = signal(''); // Señal para mensaje
  errorStatus = signal(0);

  redirectUri: string | null = null;
  parser: UAParser = new UAParser();

  constructor(
    private auth: Auth,
    private processAuthData: ProcessAuthData,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.redirectUri = params['redirect_uri'] || null;
    });
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
        this.processAuthData.proccesAuthData(res.meta.token);
        this.formComponent?.formGroup?.reset();
        //this.showMessageError.set(false);

        this.router.navigate(['/pages/users']);
      },
      error: (err) => {
        console.log(err);
        setTimeout(() => {
          this.errorStatus.set(err.status);
          this.errorMessage.set(err.error.message);
          this.showMessageError.set(true);
          this.cdRef.detectChanges();

          setTimeout(() => {
            this.showMessageError.set(false);
            this.cdRef.detectChanges();
          }, 3000);
        });
      },
      complete: () => {
        this.showMessageError.set(false);
        this.cdRef.detectChanges();
      },
    });
  }
}
