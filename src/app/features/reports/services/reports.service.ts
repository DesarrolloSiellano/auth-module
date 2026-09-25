import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ENVIROMENT } from '../../../../environments/environment';
import {
  ApiResponse,
  ReportCatalogItem,
  ReportData,
  ReportDownload,
  ReportPreview,
} from '../interfaces/report.interface';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${ENVIROMENT.urlApi}/reports`;

  getCatalog(): Observable<ApiResponse<ReportCatalogItem[]>> {
    return this.http.get<ApiResponse<ReportCatalogItem[]>>(
      `${this.base}/catalog`,
    );
  }

  preview(
    id: string,
    filters: Record<string, unknown> = {},
    limit = 50,
  ): Observable<ApiResponse<ReportPreview>> {
    return this.http.post<ApiResponse<ReportPreview>>(
      `${this.base}/${encodeURIComponent(id)}/preview`,
      { filters, limit },
    );
  }

  data(
    id: string,
    filters: Record<string, unknown> = {},
    limit?: number,
  ): Observable<ApiResponse<ReportData>> {
    return this.http.post<ApiResponse<ReportData>>(
      `${this.base}/${encodeURIComponent(id)}/data`,
      { filters, ...(limit ? { limit } : {}) },
    );
  }

  export(
    id: string,
    filters: Record<string, unknown> = {},
    format: 'xlsx' | 'csv',
  ): Observable<ReportDownload> {
    return this.http
      .post(
        `${this.base}/${encodeURIComponent(id)}/export?format=${format}`,
        { filters },
        { observe: 'response', responseType: 'blob' },
      )
      .pipe(
        map((res) => ({
          blob: res.body as Blob,
          filename: this.filenameFrom(res.headers.get('Content-Disposition'), id, format),
        })),
      );
  }

  private filenameFrom(
    disposition: string | null,
    id: string,
    format: string,
  ): string {
    const match = /filename="?([^";]+)"?/i.exec(disposition || '');
    if (match && match[1]) return match[1];
    return `${id}_${new Date().toISOString().slice(0, 10)}.${format}`;
  }
}
