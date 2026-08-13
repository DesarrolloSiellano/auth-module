import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataLoaderService } from './data-load.service';
import { SessionStore } from '../../core/services/session.store';

describe('DataLoaderService', () => {
  let service: DataLoaderService;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataLoaderService);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should forward pagination params to the service method', () => {
    const spy = jasmine.createSpy('serviceMethod').and.returnValue(of({}));
    const event = {
      first: 20,
      rows: 50,
      globalFilter: 'bpo',
      filters: { name: { value: 'x' } },
    };

    service.loadData(spy, event).subscribe();

    expect(spy).toHaveBeenCalledWith(
      20,
      50,
      'bpo',
      JSON.stringify({ name: { value: 'x' } }),
      {},
    );
  });

  it('should default first/rows/global/filters', () => {
    const spy = jasmine.createSpy('serviceMethod').and.returnValue(of({}));
    service.loadData(spy, {}).subscribe();
    expect(spy).toHaveBeenCalledWith(0, 10, '', '{}', {});
  });

  it('should return a valid result from handleResponse', () => {
    const result = service.handleResponse({
      data: [1, 2],
      meta: { totalData: 2 },
    });
    expect(result.ok).toBe(true);
    expect(result.totalResults).toBe(2);
    expect(result.data).toEqual([1, 2]);
  });

  it('should return ok=false for invalid responses', () => {
    expect(service.handleResponse(null).ok).toBe(false);
    expect(service.handleResponse({ message: 'x' }).ok).toBe(false);
    expect(service.handleResponse({ data: 'not-array', meta: {} }).ok).toBe(false);
  });

  it('should report session presence', () => {
    expect(service.hasSession()).toBe(false);
    session.setTokens('token');
    expect(service.hasSession()).toBe(true);
  });
});
