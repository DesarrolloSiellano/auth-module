import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { ProcessAuthData } from './process-auth-data';
import { SessionStore } from '../../../core/services/session.store';
import { ENVIROMENT } from '../../../../environments/environment';
import { createToken, identityPayload } from '../../../core/testing/jwt.util';

describe('ProcessAuthData', () => {
  let service: ProcessAuthData;
  let httpTesting: HttpTestingController;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MessageService],
    });
    service = TestBed.inject(ProcessAuthData);
    httpTesting = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save tokens and profile to session on success', () => {
    const token = createToken(identityPayload);
    const profile = {
      statusCode: 200,
      data: {
        user: { ...identityPayload, isAdmin: true, isNewUser: false },
        modules: [
          {
            _id: 'm1',
            name: ENVIROMENT.storageKey,
            description: 'Admin module',
            isActive: true,
            routes: [],
          },
        ],
        roles: [{ name: 'Admin', codeRol: 'ADM', isActive: true }],
        permissions: [{ name: 'Crear', action: 'create', isActive: true }],
      },
      meta: { totalData: 1, id: '1' },
    };

    let completed = false;
    service.proccesAuthData(token, 'refresh').subscribe({
      next: () => (completed = true),
    });

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(profile);

    expect(completed).toBe(true);
    expect(session.getAccessToken()).toBe(token);
    expect(session.getRefreshToken()).toBe('refresh');
    expect(localStorage.getItem('isAdmin')).toBe('true');
    expect(localStorage.getItem('mustChangePassword')).toBe('false');
    expect(localStorage.getItem(ENVIROMENT.storageKey)).toContain('adminUserModule');
    expect(localStorage.getItem('roles')).toContain('ADM');
  });

  it('guarda mustChangePassword desde el perfil', () => {
    const token = createToken(identityPayload);
    service.proccesAuthData(token).subscribe();

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/profile`);
    req.flush({
      statusCode: 200,
      data: {
        user: {
          ...identityPayload,
          isAdmin: false,
          isNewUser: true,
          mustChangePassword: true,
        },
        modules: [
          { name: ENVIROMENT.storageKey, isActive: true, routes: [] },
        ],
        roles: [],
        permissions: [],
      },
      meta: { totalData: 1, id: '1' },
    });

    expect(localStorage.getItem('isNewUser')).toBe('true');
    expect(localStorage.getItem('mustChangePassword')).toBe('true');
  });

  it('should error when the user lacks module access', () => {
    const token = createToken(identityPayload);
    const profile = {
      statusCode: 200,
      data: {
        user: { ...identityPayload, isAdmin: false, isNewUser: false },
        modules: [
          { name: 'otherModule', isActive: true, routes: [] },
        ],
        roles: [],
        permissions: [],
      },
      meta: { totalData: 1, id: '1' },
    };

    let failed = false;
    service.proccesAuthData(token).subscribe({
      error: () => (failed = true),
    });

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/profile`);
    req.flush(profile);

    expect(failed).toBe(true);
  });

  it('should propagate profile request errors', () => {
    const token = createToken(identityPayload);
    let failed = false;

    service.proccesAuthData(token).subscribe({
      error: () => (failed = true),
    });

    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/profile`);
    req.error(new ErrorEvent('Network error'));

    expect(failed).toBe(true);
  });

  it('should detect module access correctly', () => {
    expect(
      service.hasModuleAccess([
        { name: ENVIROMENT.storageKey, isActive: true },
      ]),
    ).toBe(true);
    expect(
      service.hasModuleAccess([
        { name: ENVIROMENT.storageKey, isActive: false },
      ]),
    ).toBe(false);
    expect(service.hasModuleAccess([{ name: 'other', isActive: true }])).toBe(
      false,
    );
  });
});
