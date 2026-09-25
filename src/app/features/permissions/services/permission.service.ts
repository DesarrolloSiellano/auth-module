import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIROMENT } from '../../../../environments/environment';
import { BaseService } from '../../../shared/services/base.service';
import { Permission } from '../interfaces/permission.interface';
import { Response } from '../../../shared/interfaces/response.interface';

@Injectable({
  providedIn: 'root'
})

export class PermissionService extends BaseService<Permission, Response<Permission[]> > {
  constructor() {
    super(inject(HttpClient), `${ENVIROMENT.urlApi}/permissions`);
  }

}
