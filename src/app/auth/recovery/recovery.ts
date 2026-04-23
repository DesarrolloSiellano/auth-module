import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { FormTemplateComponent } from '../../shared/components/form-template/form-template.component';
import { MessageModule } from 'primeng/message';
import { Auth } from '../service/auth';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { RECOVERY_FORM } from '../../shared/forms/login.form';

@Component({
  selector: 'app-recovery',
  standalone: true,
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
  templateUrl: './recovery.html',
  styleUrls: ['../login/login.scss'],
})
export class RecoveryComponent implements OnInit {
  @ViewChild(FormTemplateComponent) formComponent?: FormTemplateComponent;

  redirectUri: string | null = null;

  showMessageError = signal(false);
  errorMessage = signal(''); // Señal para mensaje
  errorStatus = signal(0);
  showMessageSuccess = signal(false);
  messageSuccess = signal('');
  successStatus = signal(0);

  recoveryForm = RECOVERY_FORM;

  constructor(
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.redirectUri = this.route.snapshot.queryParamMap.get('redirect_uri');
  }

  recovery() {
    this.auth
      .recoveryPassword(this.formComponent?.formGroup?.value.email)
      .subscribe({
        next: (res) => {
          this.successStatus.set(res.statusCode);
          this.messageSuccess.set(res.message);
          this.showMessageSuccess.set(true);

          setTimeout(() => {
            this.showMessageSuccess.set(false);
            if (this.redirectUri && this.redirectUri !== 'null') {
              this.router.navigate(['/login'], { queryParams: { redirect_uri: this.redirectUri } });
            } else {
              this.router.navigate(['/login']);
            }
          }, 3000);
        },
        error: (err) => {
          console.error(err);
          setTimeout(() => {
            this.errorStatus.set(err.status);
            this.errorMessage.set(err.error.message);
            this.showMessageError.set(true);
          }, 0);
          setTimeout(() => {
            this.showMessageError.set(false);
          }, 3000);
        },
        complete: () => {
          this.showMessageError.set(false);
        },
      });
  }
}
