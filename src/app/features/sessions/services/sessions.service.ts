import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIROMENT } from '../../../../environments/environment';
import { Response } from '../../../shared/interfaces/response.interface';
import { SessionItem } from '../interfaces/session.interface';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${ENVIROMENT.urlApi}/sessions`;

  findAll(params: {
    email?: string;
    userId?: string;
    from?: number;
    limit?: number;
  } = {}): Observable<Response<SessionItem[]>> {
    const query = [
      params.email ? `email=${encodeURIComponent(params.email)}` : '',
      params.userId ? `userId=${encodeURIComponent(params.userId)}` : '',
      params.from !== undefined ? `from=${params.from}` : '',
      params.limit !== undefined ? `limit=${params.limit}` : '',
    ]
      .filter(Boolean)
      .join('&');

    return this.http.get<Response<SessionItem[]>>(
      `${this.base}${query ? `?${query}` : ''}`,
    );
  }

  revoke(id: string): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(
      `${this.base}/${encodeURIComponent(id)}`,
    );
  }

  revokeByUser(userId: string): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(
      `${this.base}/user/${encodeURIComponent(userId)}`,
    );
  }

  revokeMany(ids: string[]): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(`${this.base}/revoke`, { ids });
  }

  revokeAll(): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(this.base);
  }

  // ---------------------------------------------------------- Autoservicio

  findMine(): Observable<Response<SessionItem[]>> {
    return this.http.get<Response<SessionItem[]>>(`${this.base}/mine`);
  }

  revokeMine(id: string): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(
      `${this.base}/mine/${encodeURIComponent(id)}`,
    );
  }

  revokeAllMine(): Observable<Response<unknown>> {
    return this.http.delete<Response<unknown>>(`${this.base}/mine`);
  }
}
