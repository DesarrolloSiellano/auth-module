import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Response } from '../../shared/interfaces/response.interface';
import { ENVIROMENT } from '../../../enviroments/enviroment';



export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  constructor(private http: HttpClient) { }

  login(loginRequest: LoginRequest): Observable<Response<any>> {
    console.log(loginRequest);

    return this.http.post<Response<any>>(`${ENVIROMENT.urlApi}/auth/login`, loginRequest);
  }

}
