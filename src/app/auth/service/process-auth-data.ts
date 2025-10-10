import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';

@Injectable({
  providedIn: 'root',
})
export class ProcessAuthData {
  proccesAuthData(token: string) {
    try {
      localStorage.setItem('token', token);
      const decoded = jwtDecode<JwtPayload>(token);
      console.log(decoded);

      localStorage.setItem('date_joined', decoded.date_joined);
      localStorage.setItem('exp', String(decoded.exp));
      localStorage.setItem('iat', String(decoded.iat));
      localStorage.setItem('isActive', String(decoded.isActived));
      localStorage.setItem('isAdmin', String(decoded.isAdmin));
      localStorage.setItem('isSuperAdmin', String(decoded.isSuperAdmin));
      localStorage.setItem('isNewUser', String(decoded.isNewUser));
      localStorage.setItem('userName', decoded.name + ' ' + decoded.lastName);
      localStorage.setItem('email', decoded.email);
      localStorage.setItem('_id', decoded._id);
      this.saveModulesToLocalStorage(decoded.modules);
    } catch (error) {
      console.error(error);
    }
  }

  saveModulesToLocalStorage(modules: any[]) {
    modules.forEach((mod) => {
      localStorage.setItem(mod.name, JSON.stringify(mod));

    });
  }
}
