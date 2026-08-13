import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export abstract class BaseService<TModel, TResponse> {
  constructor(
    protected http: HttpClient,
    protected baseUrl: string,
  ) {}

  findAll(): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}`);
  }

  findByDocument(document: string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/${encodeURIComponent(document)}`);
  }

  findById(id: string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  findByPage(
    from?: number,
    limit?: number,
    global?: string,
    filters?: string,
  ): Observable<TResponse> {
    const params = [
      from !== undefined ? `from=${encodeURIComponent(String(from))}` : '',
      limit !== undefined ? `limit=${encodeURIComponent(String(limit))}` : '',
      global ? `global=${encodeURIComponent(global)}` : '',
      filters ? `filters=${encodeURIComponent(filters)}` : '',
    ]
      .filter(Boolean)
      .join('&');

    return this.http.get<TResponse>(`${this.baseUrl}/findByPage${params ? `?${params}` : ''}`);
  }

  findByDate(startDate?: string, endDate?: string): Observable<TResponse> {
    const params = [
      startDate ? `startDate=${encodeURIComponent(startDate)}` : '',
      endDate ? `endDate=${encodeURIComponent(endDate)}` : '',
    ]
      .filter(Boolean)
      .join('&');

    return this.http.get<TResponse>(`${this.baseUrl}/findByDate${params ? `?${params}` : ''}`);
  }

  create(item: TModel): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.baseUrl}`, item);
  }

  update(id: string, item: TModel): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, item);
  }

  delete(id: string): Observable<TResponse> {
    return this.http.delete<TResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }
}
