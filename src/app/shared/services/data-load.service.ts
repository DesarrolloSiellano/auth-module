import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionStore } from '../../core/services/session.store';

export interface LoadResult<T> {
  ok: boolean;
  totalResults?: number;
  data?: T[];
}

@Injectable({
  providedIn: 'root',
})
export class DataLoaderService {
  constructor(private readonly session: SessionStore) {}

  loadData(
    serviceMethod: (
      from: number,
      limit: number,
      global: string,
      filters: string,
      extraParams?: any,
    ) => Observable<any>,
    event: any,
    extraParams: any = {},
  ): Observable<any> {
    const from = event.first ?? 0;
    const limit = event.rows ?? 10;
    const global = event.globalFilter || '';
    const filters = event.filters || {};

    return serviceMethod(from, limit, global, JSON.stringify(filters), extraParams);
  }

  handleResponse<T>(response: any): LoadResult<T> {
    if (!response || !response.meta || !Array.isArray(response.data)) {
      return { ok: false };
    }
    return {
      ok: true,
      totalResults: response.meta.totalData,
      data: response.data,
    };
  }

  hasSession(): boolean {
    return !!this.session.getAccessToken();
  }
}
