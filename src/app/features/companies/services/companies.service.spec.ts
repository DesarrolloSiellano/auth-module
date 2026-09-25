import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { CompaniesService } from './companies.service';
import { ENVIROMENT } from '../../../../environments/environment';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CompaniesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list companies', () => {
    service.findAll().subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/companies`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should find companies by autocomplete', () => {
    service.findByAutoComplete('bpo').subscribe();
    const req = httpTesting.expectOne(
      `${ENVIROMENT.urlApi}/companies/findByAutoComplete?name=bpo`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should create, update and delete companies', () => {
    const company = { name: 'BPO' } as any;
    service.create(company).subscribe();
    const post = httpTesting.expectOne(`${ENVIROMENT.urlApi}/companies`);
    expect(post.request.method).toBe('POST');
    post.flush({ statusCode: 201, data: company, meta: {} });

    service.update('1', { name: 'X' } as any).subscribe();
    const put = httpTesting.expectOne(`${ENVIROMENT.urlApi}/companies/1`);
    expect(put.request.method).toBe('PUT');
    put.flush({ statusCode: 200, data: {}, meta: {} });

    service.delete('1').subscribe();
    const del = httpTesting.expectOne(`${ENVIROMENT.urlApi}/companies/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ statusCode: 200, data: null, meta: {} });
  });
});
