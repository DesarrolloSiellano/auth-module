import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PermissionService } from './permission.service';
import { ENVIROMENT } from '../../../../enviroments/enviroment';

describe('PermissionService', () => {
  let service: PermissionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PermissionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list permissions', () => {
    service.findAll().subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/permissions`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should create a permission', () => {
    const perm = { name: 'Crear' } as any;
    service.create(perm).subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/permissions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(perm);
    req.flush({ statusCode: 201, data: perm, meta: {} });
  });

  it('should update and delete permissions', () => {
    service.update('1', { name: 'x' } as any).subscribe();
    httpTesting
      .expectOne(`${ENVIROMENT.urlApi}/permissions/1`)
      .flush({ statusCode: 200, data: {}, meta: {} });

    service.delete('1').subscribe();
    httpTesting
      .expectOne(`${ENVIROMENT.urlApi}/permissions/1`)
      .flush({ statusCode: 200, data: null, meta: {} });
  });
});
