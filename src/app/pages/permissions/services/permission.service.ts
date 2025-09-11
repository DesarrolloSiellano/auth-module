import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ENVIROMENT } from '../../../../enviroments/enviroment';
import { BaseService } from '../../../shared/services/base.service';
import { Permission } from '../interfaces/permission.interface';
import { Response } from '../../../shared/interfaces/response.interface';/*  */


@Injectable({
  providedIn: 'root'
})

export class PermissionService extends BaseService<Permission, Response<Permission> > {
  constructor(protected override http: HttpClient) {
    super(http, `${ENVIROMENT.urlApi}/permissions`);
  }

}
