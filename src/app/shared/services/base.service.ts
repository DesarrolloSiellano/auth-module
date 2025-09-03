import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export abstract class BaseService<TModel, TResponse> {
  protected headers: HttpHeaders;
  protected token: string = '';

  constructor(
    protected http: HttpClient,
    protected baseUrl: string  // URL base para las peticiones
  ) {
    this.token = localStorage.getItem('token') || '';  /// puedes pasar el token por parámetro si quieres
    this.headers = this.token ? new HttpHeaders().set('Authorization', `Bearer ${this.token}`) : new HttpHeaders();
  }

  findAll(): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}` , { headers: this.headers });
  }

  findByDocument(document: string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/${document}`, { headers: this.headers });
  }

  findById(id: string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  findByPage(
    from?: number,
    limit?: number,
    global?: any,
    filters?: string
  ): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/findByPage?from=${from}&limit=${limit}&global=${global}&filters=${filters}`, { headers: this.headers });
  }

  findByDate(dateIni?: string, dateEnd?: string): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/findByDate/?dateIni=${dateIni}&dateEnd=${dateEnd}`, { headers: this.headers });
  }

  create(item: TModel): Observable<TResponse> {
    return this.http.post<TResponse>(`${this.baseUrl}`, item, { headers: this.headers });
  }

  update(id: string, item: TModel): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.baseUrl}/${id}`, item, { headers: this.headers });
  }

  delete(id: string): Observable<TResponse> {
    return this.http.delete<TResponse>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }
}
