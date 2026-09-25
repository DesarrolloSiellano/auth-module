import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIROMENT } from '../../../../environments/environment';
import { ApiResponse, AuditItem } from '../interfaces/report.interface';

export interface AuditQuery {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  action?: string;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly base = `${ENVIROMENT.urlApi}/audit`;

  mine(params: AuditQuery = {}): Observable<ApiResponse<AuditItem[]>> {
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    return this.http.get<ApiResponse<AuditItem[]>>(
      `${this.base}/mine${query ? `?${query}` : ''}`,
    );
  }
}
