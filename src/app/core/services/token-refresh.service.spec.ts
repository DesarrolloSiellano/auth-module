import { TestBed } from '@angular/core/testing';
import { delay, of, throwError } from 'rxjs';
import { TokenRefreshService } from './token-refresh.service';
import { SessionStore } from './session.store';
import { Auth } from '../../features/auth/service/auth';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let session: SessionStore;
  let authMock: jasmine.SpyObj<Auth>;
  let processAuthDataMock: jasmine.SpyObj<ProcessAuthData>;

  beforeEach(() => {
    localStorage.clear();
    authMock = jasmine.createSpyObj('Auth', ['refreshToken']);
    processAuthDataMock = jasmine.createSpyObj('ProcessAuthData', [
      'proccesAuthData',
    ]);
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: ProcessAuthData, useValue: processAuthDataMock },
      ],
    });
    service = TestBed.inject(TokenRefreshService);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should error when there is no refresh token', (done) => {
    service.refresh().subscribe({
      error: (err) => {
        expect(err.message).toBe('No refresh token available');
        done();
      },
    });
  });

  it('should refresh, reprocess auth data and emit the new token', (done) => {
    session.setTokens('old-access', 'refresh-token');
    authMock.refreshToken.and.returnValue(
      of({ accessToken: 'new-access', message: 'ok' }),
    );

    service.refresh().subscribe({
      next: (token) => {
        expect(token).toBe('new-access');
        expect(processAuthDataMock.proccesAuthData).toHaveBeenCalledWith(
          'new-access',
          'refresh-token',
        );
        done();
      },
    });
  });

  it('should single-flight concurrent refreshes', (done) => {
    session.setTokens('old-access', 'refresh-token');
    // Refresh asíncrono para que la segunda llamada se encuele
    authMock.refreshToken.and.returnValue(
      of({ accessToken: 'new-access', message: 'ok' }).pipe(delay(10)),
    );

    let calls = 0;
    service.refresh().subscribe({ next: () => calls++ });
    service.refresh().subscribe({
      next: () => {
        calls++;
        setTimeout(() => {
          expect(calls).toBe(2);
          expect(authMock.refreshToken).toHaveBeenCalledTimes(1);
          done();
        }, 0);
      },
    });
  });

  it('should reset the queue on failure', (done) => {
    session.setTokens('old-access', 'refresh-token');
    authMock.refreshToken.and.returnValue(
      throwError(() => new Error('refresh failed')),
    );

    let queuedFailed = false;
    service.refresh().subscribe({ error: () => (queuedFailed = true) });
    service.refresh().subscribe({
      error: () => {
        queuedFailed = true;
        expect(queuedFailed).toBe(true);
        done();
      },
    });
  });
});
