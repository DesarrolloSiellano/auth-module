import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIROMENT } from '../../../../environments/environment';
import { Response } from '../../../shared/interfaces/response.interface';
import {
  PolicyDefinition,
  TenantConfig,
} from '../interfaces/tenant-config.interface';

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private readonly http = inject(HttpClient);
  private readonly base = `${ENVIROMENT.urlApi}/tenants`;

  getCatalog(all = false): Observable<Response<PolicyDefinition[]>> {
    return this.http.get<Response<PolicyDefinition[]>>(
      `${this.base}/policy-catalog${all ? '?all=true' : ''}`,
    );
  }

  createDefinition(
    dto: Partial<PolicyDefinition>,
  ): Observable<Response<PolicyDefinition>> {
    return this.http.post<Response<PolicyDefinition>>(
      `${this.base}/policy-definitions`,
      dto,
    );
  }

  updateDefinition(
    key: string,
    dto: Partial<PolicyDefinition>,
  ): Observable<Response<PolicyDefinition>> {
    return this.http.put<Response<PolicyDefinition>>(
      `${this.base}/policy-definitions/${encodeURIComponent(key)}`,
      dto,
    );
  }

  deleteDefinition(key: string): Observable<Response<PolicyDefinition>> {
    return this.http.delete<Response<PolicyDefinition>>(
      `${this.base}/policy-definitions/${encodeURIComponent(key)}`,
    );
  }

  listConfigs(): Observable<Response<TenantConfig[]>> {
    return this.http.get<Response<TenantConfig[]>>(`${this.base}`);
  }

  getConfigByTenant(
    tenantId: string,
    company?: string,
  ): Observable<Response<TenantConfig>> {
    const query = company ? `?company=${encodeURIComponent(company)}` : '';
    return this.http.get<Response<TenantConfig>>(
      `${this.base}/config/${encodeURIComponent(tenantId)}${query}`,
    );
  }

  /** Config resuelta del tenant del usuario autenticado (según su JWT). */
  getMyConfig(): Observable<Response<TenantConfig>> {
    return this.http.get<Response<TenantConfig>>(`${this.base}/config`);
  }

  upsertConfig(
    tenantId: string,
    body: { company?: string; isActive?: boolean; values?: Record<string, unknown> },
  ): Observable<Response<TenantConfig>> {
    return this.http.put<Response<TenantConfig>>(
      `${this.base}/config/${encodeURIComponent(tenantId)}`,
      body,
    );
  }

  patchValues(
    tenantId: string,
    values: Record<string, unknown>,
  ): Observable<Response<TenantConfig>> {
    return this.http.patch<Response<TenantConfig>>(
      `${this.base}/config/${encodeURIComponent(tenantId)}/values`,
      { values },
    );
  }
}
