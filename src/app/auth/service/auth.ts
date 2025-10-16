import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Response } from '../../shared/interfaces/response.interface';
import { ENVIROMENT } from '../../../enviroments/enviroment';

export interface LoginRequest {
  email: string;
  password: string;
  redirectUri?: string;
  meta: Meta;
}

export interface Meta {
    os: string;
    os_version: string;
    browser: string;
    browser_version: string;
    istable: boolean;
    ismovil: boolean;
    isbrowser:boolean;
    user_agent: string;
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

  login(loginRequest: LoginRequest, redirectUri?: any): Observable<Response<any>> {

    return this.http.post<Response<any>>(
      `${ENVIROMENT.urlApi}/auth/login/?redirectUri=${redirectUri}`,
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
