import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RolesServices } from './roles';
import { ENVIROMENT } from '../../../../environments/environment';

describe('RolesServices', () => {
  let service: RolesServices;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RolesServices);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list roles', () => {
    service.findAll().subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/roles`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should create a role', () => {
    const role = { name: 'Admin' } as any;
    service.create(role).subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/roles`);
    expect(req.request.method).toBe('POST');
    req.flush({ statusCode: 201, data: role, meta: {} });
  });

  it('should update and delete roles', () => {
    service.update('1', { name: 'x' } as any).subscribe();
    httpTesting
      .expectOne(`${ENVIROMENT.urlApi}/roles/1`)
      .flush({ statusCode: 200, data: {}, meta: {} });

    service.delete('1').subscribe();
    httpTesting
      .expectOne(`${ENVIROMENT.urlApi}/roles/1`)
      .flush({ statusCode: 200, data: null, meta: {} });
  });
});
