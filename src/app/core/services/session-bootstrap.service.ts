import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ProcessAuthData } from '../../features/auth/service/process-auth-data';
import { SessionStore } from './session.store';

@Injectable({
  providedIn: 'root',
})
export class SessionBootstrapService {
  constructor(
    private processAuthData: ProcessAuthData,
    private session: SessionStore,
    private router: Router,
  ) {}

  load(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      return Promise.resolve(true);
    }

    this.clearQueryParams();

    return new Promise<boolean>((resolve) => {
      this.processAuthData
        .proccesAuthData(accessToken, refreshToken || undefined)
        .subscribe({
          next: () => {
            this.router.navigate(['/pages/users']);
            resolve(true);
          },
          error: () => {
            this.session.clear();
            this.router.navigate(['/login']);
            resolve(false);
          },
        });
    });
  }

  private clearQueryParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('access_token');
    url.searchParams.delete('refresh_token');
    window.history.replaceState({}, document.title, url.toString());
  }
}
