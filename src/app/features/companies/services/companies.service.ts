import { inject, Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';
import { Response } from '../../../shared/interfaces/response.interface';
import { HttpClient } from '@angular/common/http';
import { ENVIROMENT } from '../../../../environments/environment';
import { Companies } from '../interfaces/companies.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService extends BaseService<Companies, Response<Companies[]>> {

  constructor() {
    super(inject(HttpClient), `${ENVIROMENT.urlApi}/companies`);
  }

  findByAutoComplete(name: string): Observable<Response<Companies[]>> {
    return this.http.get<Response<Companies[]>>(`${ENVIROMENT.urlApi}/companies/findByAutoComplete?name=${encodeURIComponent(name)}`);
  }

  checkAvailability(params: {
    name?: string;
    id?: string;
    excludeId?: string;
  }): Observable<Response<{ nameExists: boolean; idExists: boolean }>> {
    const query = [
      params.name ? `name=${encodeURIComponent(params.name)}` : '',
      params.id ? `id=${encodeURIComponent(params.id)}` : '',
      params.excludeId
        ? `excludeId=${encodeURIComponent(params.excludeId)}`
        : '',
    ]
      .filter(Boolean)
      .join('&');

    return this.http.get<Response<{ nameExists: boolean; idExists: boolean }>>(
      `${this.baseUrl}/check-availability${query ? `?${query}` : ''}`,
    );
  }

  block(
    id: string,
    body: { reason?: string; until?: string } = {},
  ): Observable<Response<Companies>> {
    return this.http.patch<Response<Companies>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/block`,
      body,
    );
  }

  unblock(id: string): Observable<Response<Companies>> {
    return this.http.patch<Response<Companies>>(
      `${this.baseUrl}/${encodeURIComponent(id)}/unblock`,
      {},
    );
  }
}
