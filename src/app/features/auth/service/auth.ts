import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Response } from '../../../shared/interfaces/response.interface';
import { ProfileResponse } from '../../../shared/interfaces/profile.interface';
import { ENVIROMENT } from '../../../../enviroments/enviroment';

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
  isbrowser: boolean;
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
  constructor(private http: HttpClient) { }

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
    );
  }


  recoveryPassword(email: string, redirectUri?: any): Observable<Response<any>> {
    return this.http.post<Response<any>>(
      `${ENVIROMENT.urlApi}/auth/recovery-password/?redirectUri=${redirectUri}`,
      { email }
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post<any>(
      `${ENVIROMENT.urlApi}/auth/refresh`,
      { refreshToken }
    );
  }

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${ENVIROMENT.urlApi}/users/profile`);
  }
}
