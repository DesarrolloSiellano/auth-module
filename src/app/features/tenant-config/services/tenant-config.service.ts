import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIROMENT } from '../../../../environments/environment';
import { Response } from '../../../shared/interfaces/response.interface';
import {
  PolicyDefinition,
  TenantConfig,
  TenantUsage,
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
  ): Observable<Response<TenantConfig>> {
    return this.http.get<Response<TenantConfig>>(
      `${this.base}/config/${encodeURIComponent(tenantId)}`,
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

  listUsage(period?: string): Observable<Response<TenantUsage[]>> {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.http.get<Response<TenantUsage[]>>(
      `${this.base}/usage${query}`,
    );
  }

  getUsage(
    tenantId: string,
    period?: string,
  ): Observable<Response<TenantUsage[]>> {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.http.get<Response<TenantUsage[]>>(
      `${this.base}/usage/${encodeURIComponent(tenantId)}${query}`,
    );
  }

  /** Períodos con consumo del tenant (último año), solo los existentes. */
  listUsagePeriods(tenantId: string): Observable<Response<string[]>> {
    return this.http.get<Response<string[]>>(
      `${this.base}/usage/${encodeURIComponent(tenantId)}/periods`,
    );
  }
}
