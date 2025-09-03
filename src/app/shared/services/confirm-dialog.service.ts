// confirm-dialog.service.ts
import { Injectable } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  confirmDelete(
    itemName: string,
    header: string,
    message: string,
    icon: string,
    labelrejectButton: string,
    labelacceptButton: string,
    severityCancel?: 'success' | 'warn' | 'info' | 'danger' | 'secondary' | 'primary',
    severityAccept?: 'success' | 'warn' | 'info' | 'danger' | 'secondary' | 'primary',
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationService.confirm({
        header: header,
        message: `${message} ${itemName}?`,
        icon: icon,
        rejectButtonProps: {
          label: labelrejectButton || 'Cancelar',
          variant: 'outlined',
          severity: severityCancel || 'secondary',
          size: 'small',
        },
        acceptButtonProps: {
          label: labelacceptButton || 'Aceptar',
          variant: 'outlined',
          severity: severityAccept || 'danger',
          size: 'small',
        },
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  showMessage(
    severity: 'success' | 'info' | 'warn' | 'error',
    summary: string,
    detail: string,
    life = 3000
  ) {
    this.messageService.add({ severity, summary, detail, life });
  }
}
