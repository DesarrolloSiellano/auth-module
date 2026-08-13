import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  map,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { Auth } from '../../features/auth/service/auth';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';
import { SessionStore } from './session.store';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private isRefreshing = false;
  private refreshSubject: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);

  constructor(
    private readonly auth: Auth,
    private readonly processAuthData: ProcessAuthData,
    private readonly session: SessionStore,
  ) {}

  refresh(): Observable<string> {
    const refreshToken = this.session.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.isRefreshing) {
      // Ya hay un refresh en curso: encolar hasta que emita el nuevo token
      return this.refreshSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
      );
    }

    this.isRefreshing = true;
    this.refreshSubject.next(null);

    return this.auth.refreshToken(refreshToken).pipe(
      switchMap((res) => {
        const newToken = res.accessToken;
        // Reprocesar identidad y perfil (modules/roles/permissions) antes de reintentar
        return this.processAuthData.proccesAuthData(newToken, refreshToken).pipe(
          map(() => newToken),
        );
      }),
      switchMap((newToken) => {
        this.isRefreshing = false;
        this.refreshSubject.next(newToken);
        return [newToken];
      }),
      catchError((err: unknown) => {
        this.isRefreshing = false;
        this.refreshSubject.error(err);
        this.refreshSubject = new BehaviorSubject<string | null>(null);
        return throwError(() => err);
      }),
    );
  }
}
