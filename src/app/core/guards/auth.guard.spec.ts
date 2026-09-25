import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { Auth } from '../../features/auth/service/auth';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';
import { SessionStore } from '../services/session.store';
import { ENVIROMENT } from '../../../environments/environment';
import { createToken, identityPayload } from '../testing/jwt.util';

describe('authGuard', () => {
  let authMock: jasmine.SpyObj<Auth>;
  let processAuthDataMock: jasmine.SpyObj<ProcessAuthData>;
  let session: SessionStore;
  let router: Router;

  const setAuthorizationStorage = () => {
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem(
      ENVIROMENT.storageKey,
      JSON.stringify({ isActive: true, routes: [] }),
    );
    localStorage.setItem(
      'roles',
      JSON.stringify([{ codeRol: 'ADM', isActive: true }]),
    );
  };

  const executeGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any) as any);

  beforeEach(() => {
    localStorage.clear();
    authMock = jasmine.createSpyObj('Auth', ['refreshToken']);
    processAuthDataMock = jasmine.createSpyObj('ProcessAuthData', [
      'proccesAuthData',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authMock },
        { provide: ProcessAuthData, useValue: processAuthDataMock },
      ],
    });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should redirect to login when there is no token', () => {
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const result = executeGuard();
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access with a valid token and authorization', () => {
    setAuthorizationStorage();
    session.setTokens(createToken(identityPayload));
    expect(executeGuard()).toBe(true);
  });

  it('should deny access when the user is not active', () => {
    session.setTokens(
      createToken({ ...identityPayload, isActived: false }),
    );
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    expect(executeGuard()).toBe(false);
  });

  it('should refresh an expired token and grant access', () => {
    setAuthorizationStorage();
    session.setTokens(
      createToken({ ...identityPayload, exp: Math.floor(Date.now() / 1000) - 10 }),
      'refresh-token',
    );
    authMock.refreshToken.and.returnValue(
      of({ accessToken: createToken(identityPayload) }),
    );
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    const result = executeGuard();
    expect(result).toBeInstanceOf(Observable);
  });

  it('should clear session and redirect when refresh fails', (done) => {
    session.setTokens(
      createToken({ ...identityPayload, exp: Math.floor(Date.now() / 1000) - 10 }),
      'refresh-token',
    );
    authMock.refreshToken.and.returnValue(throwError(() => new Error('nope')));
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      expect(session.getAccessToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should redirect to login when the token is expired and there is no refresh token', () => {
    session.setTokens(
      createToken({ ...identityPayload, exp: Math.floor(Date.now() / 1000) - 10 }),
    );
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    expect(executeGuard()).toBe(false);
  });

  it('should load the profile when authorization is missing', (done) => {
    session.setTokens(createToken(identityPayload));
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      expect(processAuthDataMock.proccesAuthData).toHaveBeenCalled();
      done();
    });
  });

  it('should deny access with an undecodable token', () => {
    session.setTokens('not-a-valid-jwt');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    expect(executeGuard()).toBe(false);
    expect(session.getAccessToken()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should deny access when isAdmin is false', (done) => {
    session.setTokens(createToken(identityPayload));
    localStorage.setItem('isAdmin', 'false');
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      done();
    });
  });

  it('should deny access when the admin module is inactive', (done) => {
    session.setTokens(createToken(identityPayload));
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem(
      ENVIROMENT.storageKey,
      JSON.stringify({ isActive: false, routes: [] }),
    );
    localStorage.setItem('roles', JSON.stringify([{ codeRol: 'ADM', isActive: true }]));
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      done();
    });
  });

  it('should deny access when the module JSON is invalid', (done) => {
    session.setTokens(createToken(identityPayload));
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem(ENVIROMENT.storageKey, '{invalid-json');
    localStorage.setItem('roles', JSON.stringify([{ codeRol: 'ADM', isActive: true }]));
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      done();
    });
  });

  it('should deny access when the user lacks the ADM role', (done) => {
    session.setTokens(createToken(identityPayload));
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem(ENVIROMENT.storageKey, JSON.stringify({ isActive: true, routes: [] }));
    localStorage.setItem('roles', JSON.stringify([{ codeRol: 'USER', isActive: true }]));
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      done();
    });
  });

  it('should grant access after a successful refresh', (done) => {
    setAuthorizationStorage();
    session.setTokens(
      createToken({ ...identityPayload, exp: Math.floor(Date.now() / 1000) - 10 }),
      'refresh-token',
    );
    authMock.refreshToken.and.returnValue(
      of({ accessToken: createToken(identityPayload) }),
    );
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(true);
      done();
    });
  });

  it('should deny access when the module is not stored', (done) => {
    session.setTokens(createToken(identityPayload));
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('roles', JSON.stringify([{ codeRol: 'ADM', isActive: true }]));
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      done();
    });
  });

  it('should deny access when roles are not stored', (done) => {
    session.setTokens(createToken(identityPayload));
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem(ENVIROMENT.storageKey, JSON.stringify({ isActive: true, routes: [] }));
    processAuthDataMock.proccesAuthData.and.returnValue(of(undefined));

    executeGuard().subscribe((res: boolean) => {
      expect(res).toBe(false);
      done();
    });
  });
});
