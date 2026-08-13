import { Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';
import { Response } from '../../../shared/interfaces/response.interface';
import { HttpClient } from '@angular/common/http';
import { ENVIROMENT } from '../../../../enviroments/enviroment';
import { User } from '../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService<User, Response<User[]>> {

  constructor(protected override http: HttpClient) {
    super(http, `${ENVIROMENT.urlApi}/users`);
  }


}
