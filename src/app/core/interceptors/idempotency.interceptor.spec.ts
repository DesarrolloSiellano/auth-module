import { TestBed } from '@angular/core/testing';
import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { idempotencyInterceptor } from './idempotency.interceptor';

describe('idempotencyInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
  });

  const runWithSpy = (req: HttpRequest<unknown>, nextSpy: jasmine.Spy) =>
    TestBed.runInInjectionContext(() =>
      idempotencyInterceptor(req, nextSpy as any),
    );

  it('should not add the key to GET requests', () => {
    const req = new HttpRequest('GET', '/api/x');
    const nextSpy = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => {
      expect(r.headers.has('x-idempotency-key')).toBe(false);
      return of({});
    });

    runWithSpy(req, nextSpy).subscribe();
    expect(nextSpy).toHaveBeenCalled();
  });

  it('should add a uuid key to POST requests', () => {
    const req = new HttpRequest('POST', '/api/x', {});
    const nextSpy = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => {
      const key = r.headers.get('x-idempotency-key');
      expect(key).toBeTruthy();
      expect(key!.length).toBeGreaterThanOrEqual(10);
      return of({ key });
    });

    runWithSpy(req, nextSpy).subscribe();
    expect(nextSpy).toHaveBeenCalled();
  });

  it('should reuse the same key when the same request is retried', () => {
    const req = new HttpRequest('POST', '/api/x', {});
    const nextSpy = jasmine.createSpy('next').and.callFake((r: HttpRequest<unknown>) => {
      return of({ key: r.headers.get('x-idempotency-key') });
    });

    let firstKey: string | null = null;
    runWithSpy(req, nextSpy).subscribe((v: any) => (firstKey = v.key));

    // Reintento de la misma petición: el contexto conserva la clave original
    let secondKey: string | null = null;
    runWithSpy(req, nextSpy).subscribe((v: any) => (secondKey = v.key));

    expect(firstKey).toBeTruthy();
    expect(secondKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });
});
