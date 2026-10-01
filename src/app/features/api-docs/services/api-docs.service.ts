import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIROMENT } from '../../../../environments/environment';
import { Response } from '../../../shared/interfaces/response.interface';
import { ApiRestDocs, ApiTcpDocs } from '../interfaces/api-docs.interface';

@Injectable({ providedIn: 'root' })
export class ApiDocsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${ENVIROMENT.urlApi}`;

  /** Catálogo de comandos TCP (endpoint informativo, público). */
  getTcpDocs(): Observable<Response<ApiTcpDocs>> {
    return this.http.get<Response<ApiTcpDocs>>(`${this.base}/tcp-docs`);
  }

  /** Catálogo de endpoints REST (endpoint informativo, público). */
  getRestDocs(): Observable<Response<ApiRestDocs>> {
    return this.http.get<Response<ApiRestDocs>>(`${this.base}/rest-docs`);
  }
}
