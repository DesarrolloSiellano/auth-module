import { Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';
import { Rol } from '../interface/rol.interface';
import { Response } from '../../../shared/interfaces/response.interface';
import { HttpClient } from '@angular/common/http';
import { ENVIROMENT } from '../../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class RolesServices extends BaseService<Rol, Response<Rol> > {
  constructor(protected override http: HttpClient) {
    super(http, `${ENVIROMENT.urlApi}/roles`);
  }
}
