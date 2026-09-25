import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionBootstrapService } from './session-bootstrap.service';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';
import { SessionStore } from './session.store';

describe('SessionBootstrapService', () => {
  let service: SessionBootstrapService;
  let processAuthDataMock: jasmine.SpyObj<ProcessAuthData>;
  let session: SessionStore;
  let router: Router;

  const originalUrl = window.location.href;

  beforeEach(() => {
    localStorage.clear();
    processAuthDataMock = jasmine.createSpyObj('ProcessAuthData', [
      'proccesAuthData',
    ]);
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProcessAuthData, useValue: processAuthDataMock },
      ],
    });
    service = TestBed.inject(SessionBootstrapService);
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    history.replaceState({}, '', originalUrl);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should resolve true when there is no access_token in the URL', (done) => {
    service.load().then((res) => {
      expect(res).toBe(true);
      expect(processAuthDataMock.proccesAuthData).not.toHaveBeenCalled();
      done();
    });
  });

  it('should process the token from the URL and navigate to /pages/dashboard', (done) => {
    history.pushState({}, '', '/?access_token=abc&refresh_token=xyz');

    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    service.load().then((res) => {
      expect(res).toBe(true);
      expect(processAuthDataMock.proccesAuthData).toHaveBeenCalledWith(
        'abc',
        'xyz',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/pages/dashboard']);
      expect(window.location.search).not.toContain('access_token');
      done();
    });
  });

  it('should clear the session and navigate to login on failure', (done) => {
    history.pushState({}, '', '/?access_token=abc');
    session.setTokens('old');
    processAuthDataMock.proccesAuthData.and.returnValue(
      throwError(() => new Error('nope')),
    );

    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    service.load().then((res) => {
      expect(res).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(session.getAccessToken()).toBeNull();
      done();
    });
  });
});
