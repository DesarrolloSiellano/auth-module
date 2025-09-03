import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class DataLoaderService {
  constructor(private messageService: MessageService) {}

  loadData(
    serviceMethod: (
      from: number,
      limit: number,
      global: string,
      filters: string,
      extraParams?: any
    ) => Observable<any>,
    event: any,
    extraParams: any = {}
  ): Observable<any> {
    const from = event.first ?? 0;
    const limit = event.rows ?? 10;
    const global = event.globalFilter || '';
    const filters = event.filters || {};

    return serviceMethod(
      from,
      limit,
      global,
      JSON.stringify(filters),
      extraParams
    );
  }

  handleResponse(response: any): any {
    console.log('data', response);
    if (response.message !== 'Token no válido') {
      return {
        ok: true,
        totalResults: response.meta.totalData,
        data: response.data,
      };
    } else {
      this.messageService.add({
        key: 'tl',
        severity: 'error',
        summary: 'Error',
        detail: 'Su sesión ha caducado',
      });
      localStorage.removeItem('token');
      return { ok: false };
    }
  }
}

