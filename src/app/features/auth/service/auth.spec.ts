import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Auth } from './auth';
import { ENVIROMENT } from '../../../../enviroments/enviroment';

describe('Auth', () => {
  let service: Auth;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(Auth);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login posting to /auth/login with redirectUri', () => {
    const loginRequest = {
      email: 'a@b.com',
      password: '1234',
      meta: {} as any,
    };

    service.login(loginRequest, 'http://localhost:4200').subscribe();

    const req = httpTesting.expectOne(
      `${ENVIROMENT.urlApi}/auth/login/?redirectUri=http://localhost:4200`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush({ statusCode: 200 });
  });

  it('should call change-password endpoint', () => {
    service
      .changePassword({
        id: '1',
        currentPassword: 'old',
        newPassword: 'new',
      })
      .subscribe();

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/auth/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id: '1',
      currentPassword: 'old',
      newPassword: 'new',
    });
    req.flush({ statusCode: 200 });
  });

  it('should call recovery-password endpoint with redirectUri', () => {
    service.recoveryPassword('a@b.com', 'http://x').subscribe();

    const req = httpTesting.expectOne(
      `${ENVIROMENT.urlApi}/auth/recovery-password/?redirectUri=http://x`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({ statusCode: 200 });
  });

  it('should refresh token posting to /auth/refresh', () => {
    service.refreshToken('refresh-token').subscribe();

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh-token' });
    req.flush({ accessToken: 'new-access' });
  });

  it('should fetch the user profile', () => {
    service.getProfile().subscribe((res) => {
      expect(res.data.user.email).toBe('a@b.com');
    });

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/profile`);
    expect(req.request.method).toBe('GET');
    req.flush({
      statusCode: 200,
      data: { user: { email: 'a@b.com' }, modules: [], roles: [], permissions: [] },
      meta: { totalData: 1, id: '1' },
    });
  });
});
