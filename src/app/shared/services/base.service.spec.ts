import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseService } from './base.service';

interface Item {
  id: number;
  name: string;
}

interface ListResponse {
  data: Item[];
  meta: { totalData: number };
}

@Injectable()
class TestService extends BaseService<Item, ListResponse> {
  constructor(http: HttpClient) {
    super(http, 'http://api.test/items');
  }
}

describe('BaseService', () => {
  let service: TestService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestService],
    });
    service = TestBed.inject(TestService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should GET the base url on findAll', () => {
    service.findAll().subscribe();
    const req = httpTesting.expectOne('http://api.test/items');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { totalData: 0 } });
  });

  it('should encode the id in findById and findByDocument', () => {
    service.findById('a/b c').subscribe();
    const req1 = httpTesting.expectOne('http://api.test/items/a%2Fb%20c');
    expect(req1.request.method).toBe('GET');
    req1.flush({ data: {}, meta: {} });

    service.findByDocument('x?y=1').subscribe();
    const req2 = httpTesting.expectOne('http://api.test/items/x%3Fy%3D1');
    expect(req2.request.method).toBe('GET');
    req2.flush({ data: {}, meta: {} });
  });

  it('should build findByPage with encoded params', () => {
    service.findByPage(0, 10, 'a b', '{"x":1}').subscribe();
    const req = httpTesting.expectOne(
      'http://api.test/items/findByPage?from=0&limit=10&global=a%20b&filters=%7B%22x%22%3A1%7D',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should omit empty params in findByPage', () => {
    service.findByPage().subscribe();
    const req = httpTesting.expectOne('http://api.test/items/findByPage');
    expect(req.request.url).toBe('http://api.test/items/findByPage');
    req.flush({ data: [], meta: {} });
  });

  it('should build findByDate with startDate/endDate', () => {
    service.findByDate('2026-01-01', '2026-01-31').subscribe();
    const req = httpTesting.expectOne(
      'http://api.test/items/findByDate?startDate=2026-01-01&endDate=2026-01-31',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should omit empty dates in findByDate', () => {
    service.findByDate().subscribe();
    const req = httpTesting.expectOne('http://api.test/items/findByDate');
    expect(req.request.url).toBe('http://api.test/items/findByDate');
    req.flush({ data: [], meta: {} });
  });

  it('should POST on create', () => {
    const item: Item = { id: 1, name: 'A' };
    service.create(item).subscribe();
    const req = httpTesting.expectOne('http://api.test/items');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(item);
    req.flush({ data: [], meta: {} });
  });

  it('should PUT on update with encoded id', () => {
    const item: Item = { id: 1, name: 'B' };
    service.update('1/2', item).subscribe();
    const req = httpTesting.expectOne('http://api.test/items/1%2F2');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(item);
    req.flush({ data: [], meta: {} });
  });

  it('should DELETE on delete with encoded id', () => {
    service.delete('3 4').subscribe();
    const req = httpTesting.expectOne('http://api.test/items/3%204');
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: [], meta: {} });
  });
});
