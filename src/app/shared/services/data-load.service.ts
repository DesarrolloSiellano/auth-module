import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionStore } from '../../core/services/session.store';

export interface LoadResult<T> {
  ok: boolean;
  totalResults?: number;
  data?: T[];
}

export type ServiceMethod = (
  from: number,
  limit: number,
  global: string,
  filters: string,
  extraParams?: unknown,
) => Observable<unknown>;

export interface LazyLoadEventLike {
  first?: number | null;
  rows?: number | null;
  globalFilter?: string | string[] | null;
  filters?: unknown;
}

interface ResponseLike<T> {
  meta?: { totalData?: number } | null;
  data?: T[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class DataLoaderService {
  private readonly session = inject(SessionStore);

  loadData(
    serviceMethod: ServiceMethod,
    event: LazyLoadEventLike,
    extraParams: unknown = {},
  ): Observable<unknown> {
    const from = event.first ?? 0;
    const limit = event.rows ?? 10;
    const rawGlobal = event.globalFilter;
    const global = Array.isArray(rawGlobal) ? rawGlobal.join(',') : rawGlobal || '';
    const filters = event.filters || {};

    return serviceMethod(from, limit, global, JSON.stringify(filters), extraParams);
  }

  handleResponse<T>(response: unknown): LoadResult<T> {
    const res = response as ResponseLike<T> | null;
    if (!res || !res.meta || !Array.isArray(res.data)) {
      return { ok: false };
    }
    return {
      ok: true,
      totalResults: res.meta.totalData,
      data: res.data,
    };
  }

  hasSession(): boolean {
    return !!this.session.getAccessToken();
  }
}
