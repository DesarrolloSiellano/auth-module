import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      providers: [{ provide: MessageService, useValue: spy }],
    });
    service = TestBed.inject(NotificationService);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show a message with given severity', () => {
    service.show('warn', 'Sum', 'Detail', 4000);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Sum',
      detail: 'Detail',
      life: 4000,
    });
  });

  it('should use default life when not provided', () => {
    service.show('info', 'Sum', 'Detail');
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Sum',
      detail: 'Detail',
      life: 3000,
    });
  });

  it('should expose convenience methods', () => {
    service.success('A', 'B');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success' }),
    );
    service.error('A', 'B');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
    service.warn('A', 'B');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'warn' }),
    );
  });

  it('should forward an explicit life to the convenience methods', () => {
    service.success('A', 'B', 1000);
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ life: 1000 }),
    );
    service.info('A', 'B', 2000);
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ life: 2000 }),
    );
    service.warn('A', 'B', 3000);
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ life: 3000 }),
    );
    service.error('A', 'B', 4000);
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ life: 4000 }),
    );
  });

  it('should use the default life for info', () => {
    service.info('A', 'B');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ life: 3000 }),
    );
  });
});
