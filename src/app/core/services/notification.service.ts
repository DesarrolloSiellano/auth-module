import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type NotificationSeverity = 'success' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly messageService = inject(MessageService);

  show(
    severity: NotificationSeverity,
    summary: string,
    detail: string,
    life = 3000,
  ): void {
    this.messageService.add({ severity, summary, detail, life });
  }

  success(summary: string, detail: string, life = 3000): void {
    this.show('success', summary, detail, life);
  }

  info(summary: string, detail: string, life = 3000): void {
    this.show('info', summary, detail, life);
  }

  warn(summary: string, detail: string, life = 4000): void {
    this.show('warn', summary, detail, life);
  }

  error(summary: string, detail: string, life = 5000): void {
    this.show('error', summary, detail, life);
  }
}
