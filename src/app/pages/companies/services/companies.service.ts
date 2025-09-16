import { Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';
import { Response } from '../../../shared/interfaces/response.interface';
import { HttpClient } from '@angular/common/http';
import { ENVIROMENT } from '../../../../enviroments/enviroment';
import { Companies } from '../interfaces/companies.interface';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService extends BaseService<Companies, Response<Companies>> {

  constructor(protected override http: HttpClient) {
    super(http, `${ENVIROMENT.urlApi}/companies`);
  }

}
