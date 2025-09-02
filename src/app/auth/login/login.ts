import { Component, signal, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { LOGIN_FORM } from '../../shared/forms/login.form';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { Auth } from '../service/auth';
import { MessageModule } from 'primeng/message';
import { ProcessAuthData } from '../service/process-auth-data';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ CardModule, PasswordModule, ButtonModule, InputTextModule, FloatLabelModule, FormTemplateComponent, MessageModule ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [Auth]
})
export class Login {
  @ViewChild(FormTemplateComponent) formComponent?: FormTemplateComponent;
  loginForm = LOGIN_FORM;
  showMessageError = signal(false);
  errorMessage = signal('');      // Señal para mensaje
  errorStatus = signal(0);

  constructor(private auth: Auth,  private processAuthData: ProcessAuthData, private router: Router) {}


  login() {
    this.auth.login(this.formComponent?.formGroup?.value).subscribe({
      next: (res) => {
       this.processAuthData.proccesAuthData(res.meta.token);
        this.formComponent?.formGroup?.reset();
        this.showMessageError.set(false);

        this.router.navigate(['/pages/users']);

      },
      error: (err) => {
        console.log(err);
        this.errorStatus.set(err.status);
        this.errorMessage.set(err.error.message);
        this.showMessageError.set(true);
        setTimeout(() => {
          this.showMessageError.set(false);
        }, 3000);
      },
      complete: () => {
        this.showMessageError.set(false);
      }
    })
  }



}
