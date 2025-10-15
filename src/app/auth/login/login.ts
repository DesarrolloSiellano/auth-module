import { ChangeDetectorRef, Component, OnInit, signal, ViewChild } from '@angular/core';
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


  constructor(
    private auth: Auth,
    private processAuthData: ProcessAuthData,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.redirectUri = params['redirect_uri'] || null;
    });

  }

  login() {

    this.auth.login(this.formComponent?.formGroup?.value, this.redirectUri).subscribe({
      next: (res) => {

        if(res.url){
          console.log(res.url);

          // Reemplaza la URL actual por la que viene del backend sin recargar
          window.location.href = String(res.url); //res.url;
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
