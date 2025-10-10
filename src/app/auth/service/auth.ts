import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Response } from '../../shared/interfaces/response.interface';
import { ENVIROMENT } from '../../../enviroments/enviroment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePassword {
  id: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private http: HttpClient) {}

  login(loginRequest: LoginRequest): Observable<Response<any>> {
    console.log(loginRequest);

    return this.http.post<Response<any>>(
      `${ENVIROMENT.urlApi}/auth/login`,
      loginRequest
    );
  }

  changePassword(changePassword: ChangePassword): Observable<Response<any>> {
    return this.http.post<Response<any>>(
      `${ENVIROMENT.urlApi}/auth/change-password`,
      changePassword,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
  }


  recoveryPassword(email: string): Observable<Response<any>> {
    return this.http.post<Response<any>>(
      `${ENVIROMENT.urlApi}/auth/recovery-password`,
      { email }
    );
  }
}
