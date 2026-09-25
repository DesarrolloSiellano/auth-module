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

}
