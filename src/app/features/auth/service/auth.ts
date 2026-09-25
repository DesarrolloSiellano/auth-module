import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Response } from '../../../shared/interfaces/response.interface';
import { ProfileResponse } from '../../../shared/interfaces/profile.interface';
import { ENVIROMENT } from '../../../../environments/environment';

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

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);

  login(
    loginRequest: LoginRequest,
    redirectUri?: string | null,
  ): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(
      `${ENVIROMENT.urlApi}/auth/login/?redirectUri=${redirectUri}`,
      loginRequest
    );
  }

  changePassword(changePassword: ChangePassword): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(
      `${ENVIROMENT.urlApi}/auth/change-password`,
      changePassword,
    );
  }

  setPasswordWithToken(
    token: string,
    password: string,
  ): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(
      `${ENVIROMENT.urlApi}/auth/set-password-token`,
      { token, password },
    );
  }


  recoveryPassword(
    email: string,
    redirectUri?: string | null,
  ): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(
      `${ENVIROMENT.urlApi}/auth/recovery-password/?redirectUri=${redirectUri}`,
      { email }
    );
  }

  logout(refreshToken?: string | null): Observable<Response<unknown>> {
    return this.http.post<Response<unknown>>(
      `${ENVIROMENT.urlApi}/auth/logout`,
      { refreshToken }
    );
  }

  refreshToken(refreshToken: string): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(
      `${ENVIROMENT.urlApi}/auth/refresh`,
      { refreshToken }
    );
  }

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${ENVIROMENT.urlApi}/users/profile`);
  }
}
