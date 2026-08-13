import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';
import { SessionStore } from '../services/session.store';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let session: SessionStore;
  let router: Router;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    localStorage.clear();
    notification = jasmine.createSpyObj('NotificationService', [
      'show',
      'success',
      'info',
      'warn',
      'error',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notification },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  const flush = (url: string, status: number, message: any) => {
    const req = httpTesting.expectOne(url);
    req.flush(
      { message, statusCode: status },
      { status, statusText: String(status) },
    );
  };

  it('should notify data validation errors (400)', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 400, 'Invalid ID format');
    expect(notification.error).toHaveBeenCalledWith(
      'Datos inválidos',
      'Invalid ID format',
    );
  });

  it('should handle forbidden (403)', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 403, 'Sin permisos');
    expect(notification.error).toHaveBeenCalledWith(
      'Sin permisos',
      'Sin permisos',
    );
  });

  it('should handle not found (404)', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 404, 'No found');
    expect(notification.error).toHaveBeenCalledWith('No encontrado', 'No found');
  });

  it('should warn on rate limiting (429)', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 429, 'Too Many Requests');
    expect(notification.warn).toHaveBeenCalled();
  });

  it('should notify server errors (500)', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 500, 'boom');
    expect(notification.error).toHaveBeenCalledWith(
      'Error del servidor',
      'Ocurrió un error interno. Intenta de nuevo más tarde.',
    );
  });

  it('should handle connection errors (0)', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    const req = httpTesting.expectOne('/api/x');
    req.error(new ErrorEvent('Network error'));
    expect(notification.error).toHaveBeenCalledWith(
      'Sin conexión',
      'No se pudo conectar con el servidor.',
    );
  });

  it('should clear the session and redirect on 401', () => {
    session.setTokens('access');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 401, 'Unauthorized');

    expect(session.getAccessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(notification.error).toHaveBeenCalledWith(
      'Sesión expirada',
      'Tu sesión ha caducado. Inicia sesión nuevamente.',
    );
  });

  it('should not notify on login page requests', () => {
    http.post('/auth/login', {}).subscribe({ error: () => undefined });
    flush('/auth/login', 403, 'Creadenciales invalidas');
    expect(notification.error).not.toHaveBeenCalled();
    expect(notification.warn).not.toHaveBeenCalled();
  });

  it('should use a generic message for unknown statuses', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    flush('/api/x', 502, 'Bad Gateway');
    expect(notification.error).toHaveBeenCalledWith('Error', 'Bad Gateway');
  });
});
