import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user';
import { ENVIROMENT } from '../../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list users', () => {
    service.findAll().subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should query users by page with encoded params', () => {
    service.findByPage(0, 10, 'bpo', '{}').subscribe();
    const req = httpTesting.expectOne(
      `${ENVIROMENT.urlApi}/users/findByPage?from=0&limit=10&global=bpo&filters=%7B%7D`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {} });
  });

  it('should create a user', () => {
    const user = { name: 'A' } as any;
    service.create(user).subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(user);
    req.flush({ statusCode: 201, data: user, meta: {} });
  });

  it('should update a user', () => {
    const user = { name: 'B' } as any;
    service.update('123', user).subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/123`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(user);
    req.flush({ statusCode: 200, data: user, meta: {} });
  });

  it('should delete a user', () => {
    service.delete('123').subscribe();
    const req = httpTesting.expectOne(`${ENVIROMENT.urlApi}/users/123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ statusCode: 200, data: null, meta: {} });
  });
});
