import { inject, Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';
import { Response } from '../../../shared/interfaces/response.interface';
import { HttpClient } from '@angular/common/http';
import { ENVIROMENT } from '../../../../environments/environment';
import {
  AvailabilityResult,
  BulkUserAction,
  CustomFieldDefinition,
  MassiveUploadReport,
  SavedFilter,
  User,
} from '../interfaces/user.interface';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService<User, Response<User[]>> {

  constructor() {
    super(inject(HttpClient), `${ENVIROMENT.urlApi}/users`);
  }

  uploadMassive(file: File): Observable<Response<MassiveUploadReport>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Response<MassiveUploadReport>>(
      `${this.baseUrl}/massive-upload`,
      formData,
    );
  }

  checkAvailability(params: {
    email?: string;
    username?: string;
    excludeId?: string;
  }): Observable<Response<AvailabilityResult>> {
    const query = [
      params.email ? `email=${encodeURIComponent(params.email)}` : '',
      params.username ? `username=${encodeURIComponent(params.username)}` : '',
      params.excludeId
        ? `excludeId=${encodeURIComponent(params.excludeId)}`
        : '',
    ]
      .filter(Boolean)
      .join('&');

    return this.http.get<Response<AvailabilityResult>>(
      `${this.baseUrl}/check-availability${query ? `?${query}` : ''}`,
    );
  }

  private toQuery(filters: Record<string, unknown>): string {
    return Object.entries(filters || {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
  }

  exportData(
    filters: Record<string, unknown>,
    limit?: number,
  ): Observable<
    Response<{
      columns: { key: string; label: string; type?: string; align?: string }[];
      rows: Record<string, unknown>[];
      total: number;
      truncated: boolean;
    }>
  > {
    const query = this.toQuery({ ...filters, ...(limit ? { limit } : {}) });
    return this.http.get<
      Response<{
        columns: { key: string; label: string; type?: string; align?: string }[];
        rows: Record<string, unknown>[];
        total: number;
        truncated: boolean;
      }>
    >(`${this.baseUrl}/export-data${query ? `?${query}` : ''}`);
  }

  exportUsers(
    filters: Record<string, unknown>,
    format: 'xlsx' | 'csv',
  ): Observable<{ blob: Blob; filename: string }> {
    const query = this.toQuery({ ...filters, format });
    return this.http
      .get(`${this.baseUrl}/export?${query}`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((res) => {
          const disposition = res.headers.get('Content-Disposition') || '';
          const match = /filename="?([^";]+)"?/i.exec(disposition);
          return {
            blob: res.body as Blob,
            filename:
              match?.[1] ||
              `usuarios_${new Date().toISOString().slice(0, 10)}.${format}`,
          };
        }),
      );
  }

  bulk(
    action: BulkUserAction,
    ids: string[],
    payload: Record<string, unknown> = {},
  ): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(`${this.baseUrl}/bulk`, {
      action,
      ids,
      payload,
    });
  }

  resendInvite(id: string): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/resend-invite`,
      {},
    );
  }

  block(
    id: string,
    body: { reason?: string; until?: string } = {},
  ): Observable<Response<unknown>> {
    return this.http.patch<Response<unknown>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/block`,
      body,
    );
  }

  unblock(id: string): Observable<Response<unknown>> {
    return this.http.patch<Response<unknown>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/unblock`,
      {},
    );
  }

  setTagsGroups(
    id: string,
    body: { tags?: string[]; groups?: string[] },
  ): Observable<Response<unknown>> {
    return this.http.patch<Response<unknown>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/tags`,
      body,
    );
  }

  hardDelete(id: string): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/hard`,
    );
  }

  listSavedFilters(): Observable<Response<SavedFilter[]>> {
    return this.http.get<Response<SavedFilter[]>>(
      `${this.baseUrl}/saved-filters`,
    );
  }

  createSavedFilter(body: {
    name: string;
    filters: Record<string, unknown>;
    isShared?: boolean;
  }): Observable<Response<SavedFilter>> {
    return this.http.post<Response<SavedFilter>>(
      `${this.baseUrl}/saved-filters`,
      body,
    );
  }

  deleteSavedFilter(id: string): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(
      `${this.baseUrl}/saved-filters/${encodeURIComponent(id)}`,
    );
  }

  listCustomFields(company?: string): Observable<
    Response<CustomFieldDefinition[]>
  > {
    const suffix = company ? `?company=${encodeURIComponent(company)}` : '';
    return this.http.get<Response<CustomFieldDefinition[]>>(
      `${this.baseUrl}/custom-fields${suffix}`,
    );
  }

  createCustomField(
    body: Partial<CustomFieldDefinition>,
  ): Observable<Response<CustomFieldDefinition>> {
    return this.http.post<Response<CustomFieldDefinition>>(
      `${this.baseUrl}/custom-fields`,
      body,
    );
  }

  updateCustomField(
    id: string,
    body: Partial<CustomFieldDefinition>,
  ): Observable<Response<CustomFieldDefinition>> {
    return this.http.put<Response<CustomFieldDefinition>>(
      `${this.baseUrl}/custom-fields/${encodeURIComponent(id)}`,
      body,
    );
  }

  deleteCustomField(id: string): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(
      `${this.baseUrl}/custom-fields/${encodeURIComponent(id)}`,
    );
  }
}
