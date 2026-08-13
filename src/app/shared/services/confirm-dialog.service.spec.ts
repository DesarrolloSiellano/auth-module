import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmService } from './confirm-dialog.service';

describe('ConfirmService', () => {
  let service: ConfirmService;
  let confirmationService: ConfirmationService;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const msgSpy = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      providers: [
        ConfirmationService,
        { provide: MessageService, useValue: msgSpy },
      ],
    });
    service = TestBed.inject(ConfirmService);
    confirmationService = TestBed.inject(ConfirmationService);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should resolve true when the user accepts', (done) => {
    let captured: any;
    spyOn(confirmationService, 'confirm').and.callFake((options: any) => {
      captured = options;
      return confirmationService;
    });

    service.confirm('Item', 'Header', 'Message', 'icon', 'No', 'Sí').then((res) => {
      expect(res).toBe(true);
      done();
    });

    captured.accept();
  });

  it('should resolve false when the user rejects', (done) => {
    let captured: any;
    spyOn(confirmationService, 'confirm').and.callFake((options: any) => {
      captured = options;
      return confirmationService;
    });

    service.confirm('Item', 'Header', 'Message', 'icon', 'No', 'Sí').then((res) => {
      expect(res).toBe(false);
      done();
    });

    captured.reject();
  });

  it('should add a message via showMessage', () => {
    service.showMessage('error', 'Summary', 'Detail', 5000);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Summary',
      detail: 'Detail',
      life: 5000,
    });
  });

  it('should use the default life for showMessage', () => {
    service.showMessage('info', 'Summary', 'Detail');
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Summary',
      detail: 'Detail',
      life: 3000,
    });
  });

  it('should use default labels and severity when not provided', (done) => {
    let captured: any;
    spyOn(confirmationService, 'confirm').and.callFake((options: any) => {
      captured = options;
      return confirmationService;
    });

    service.confirm('', 'Header', 'Message', '', '', '').then((res) => {
      expect(res).toBe(true);
      expect(captured.rejectButtonProps.label).toBe('Cancelar');
      expect(captured.acceptButtonProps.label).toBe('Aceptar');
      done();
    });

    captured.accept();
  });
});
