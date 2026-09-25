import {
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
import { Message } from 'primeng/message';
import { Auth } from '../service/auth';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { getHttpErrorInfo } from '../../../core/helpers/http-error';

import { RECOVERY_FORM } from '../../../shared/forms/login.form';

@Component({
  selector: 'app-recovery',
  imports: [
    Card,
    Button,
    FormTemplateComponent,
    Message,
    RouterModule,
  ],
  templateUrl: './recovery.html',
  styleUrls: ['../login/login.scss'],
})
export class RecoveryComponent implements OnInit, OnDestroy {
  @ViewChild(FormTemplateComponent) formComponent?: FormTemplateComponent;

  redirectUri: string | null = null;

  showMessageError = signal(false);
  errorMessage = signal(''); // Señal para mensaje
  errorStatus = signal(0);
  showMessageSuccess = signal(false);
  messageSuccess = signal('');
  successStatus = signal(0);
  isSubmitting = signal(false);

  recoveryForm = RECOVERY_FORM;

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.redirectUri = this.route.snapshot.queryParamMap.get('redirect_uri');
  }

  ngOnDestroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  recovery() {
    // Evita reenviar el formulario mientras la petición está en curso.
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    this.auth
      .recoveryPassword(this.formComponent?.formGroup?.value.email, this.redirectUri)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.successStatus.set(res.statusCode);
          this.messageSuccess.set(res.message);
          this.showMessageSuccess.set(true);

          this.timers.push(
            setTimeout(() => {
              this.showMessageSuccess.set(false);
              if (this.redirectUri && this.redirectUri !== 'null') {
                this.router.navigate(['/login'], {
                  queryParams: { redirect_uri: this.redirectUri },
                });
              } else {
                this.router.navigate(['/login']);
              }
            }, 3000),
          );
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error(err);
          const info = getHttpErrorInfo(err);
          this.timers.push(
            setTimeout(() => {
              this.errorStatus.set(info.status);
              this.errorMessage.set(info.message);
              this.showMessageError.set(true);
            }, 0),
          );
          this.timers.push(
            setTimeout(() => {
              this.showMessageError.set(false);
            }, 3000),
          );
        },
        complete: () => {
          this.showMessageError.set(false);
        },
      });
  }
}
