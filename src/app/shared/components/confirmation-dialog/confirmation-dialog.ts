// confirm-dialog-global.component.ts
import { Component } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ConfirmDialog, ToastModule, ButtonModule, CommonModule],
  template: `<div class="card flex justify-center">
    <p-toast></p-toast>
    <p-confirmdialog>
      <ng-template #message let-message>
        <div
          class="flex flex-col items-center w-full gap-4 border-b border-surface-200 dark:border-surface-700"
        >
          <i [ngClass]="message.icon" class="!text-6xl text-primary-500"></i>
          <p>{{ message.message }}</p>
        </div>
      </ng-template>
    </p-confirmdialog>
  </div> `,
  providers: [ConfirmationService, MessageService],
})
export class ConfirmDialogGlobalComponent {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  confirm(
    message: string,
    header = 'Confirmation',
    icon = 'pi pi-exclamation-circle',
    acceptLabel = 'Aceptar',
    rejectLabel = 'Cancelar',
    acceptFn?: () => void,
    rejectFn?: () => void
  ) {
    this.confirmationService.confirm({
      header,
      message,
      icon,
      rejectButtonProps: {
        label: rejectLabel,
        icon: 'pi pi-times',
        variant: 'outlined',
        size: 'small',
      },
      acceptButtonProps: {
        label: acceptLabel,
        icon: 'pi pi-check',
        size: 'small',
      },
      accept: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmed',
          detail: 'You have accepted',
          life: 3000,
        });
        if (acceptFn) acceptFn();
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Rejected',
          detail: 'You have rejected',
          life: 3000,
        });
        if (rejectFn) rejectFn();
      },
    });
  }
}
