import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { Auth } from '../../features/auth/service/auth';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';
import { SessionStore } from '../services/session.store';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let session: SessionStore;
  let authMock: jasmine.SpyObj<Auth>;
  let processAuthDataMock: jasmine.SpyObj<ProcessAuthData>;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    authMock = jasmine.createSpyObj('Auth', ['refreshToken']);
    processAuthDataMock = jasmine.createSpyObj('ProcessAuthData', [
      'proccesAuthData',
    ]);
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: authMock },
        { provide: ProcessAuthData, useValue: processAuthDataMock },
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

  it('should attach the Bearer token to requests', () => {
    session.setTokens('access-token');
    http.get('/api/data').subscribe();

    const req = httpTesting.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
    req.flush({ ok: true });
  });

  it('should not attach the token to login requests', () => {
    session.setTokens('access-token');
    http.post('/auth/login', {}).subscribe();

    const req = httpTesting.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });

  it('should refresh the token and retry on 401', () => {
    session.setTokens('old-access', 'refresh-token');
    authMock.refreshToken.and.returnValue(
      of({ accessToken: 'new-access', message: 'ok' }),
    );

    http.get('/api/data').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    const first = httpTesting.expectOne('/api/data');
    expect(first.request.headers.get('Authorization')).toBe('Bearer old-access');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retried = httpTesting.expectOne('/api/data');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-access');
    retried.flush({ ok: true });
  });

  it('should clear the session and redirect when there is no refresh token', (done) => {
    session.setTokens('old-access');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    http.get('/api/data').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(session.getAccessToken()).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });

    const req = httpTesting.expectOne('/api/data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should clear the session and redirect when the refresh fails', (done) => {
    session.setTokens('old-access', 'refresh-token');
    authMock.refreshToken.and.returnValue(of({ accessToken: 'still-old' }));
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    http.get('/api/data').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(session.getAccessToken()).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });

    const first = httpTesting.expectOne('/api/data');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // El reintento también responde 401: el refresh no resuelve el problema
    const retried = httpTesting.expectOne('/api/data');
    retried.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });
});
