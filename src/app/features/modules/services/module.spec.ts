import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ModuleService } from './module.service';
import { ENVIROMENT } from '../../../../enviroments/enviroment';

describe('ModuleService', () => {
  let service: ModuleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ModuleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list modules', () => {
    service.findAll().subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/modules`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should create a module', () => {
    const mod = { name: 'admin' } as any;
    service.create(mod).subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/modules`);
    expect(req.request.method).toBe('POST');
    req.flush({ statusCode: 201, data: mod, meta: {} });
  });

  it('should update and delete modules', () => {
    service.update('1', { name: 'x' } as any).subscribe();
    const put = httpTesting.expectOne(`${ENVIROMENT.urlApi}/modules/1`);
    expect(put.request.method).toBe('PUT');
    put.flush({ statusCode: 200, data: {}, meta: {} });

    service.delete('1').subscribe();
    const del = httpTesting.expectOne(`${ENVIROMENT.urlApi}/modules/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ statusCode: 200, data: null, meta: {} });
  });
});
