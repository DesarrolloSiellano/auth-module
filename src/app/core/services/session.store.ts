import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';

export const SESSION_KEYS = {
  token: 'token',
  refreshToken: 'refreshToken',
} as const;

@Injectable({
  providedIn: 'root',
})
export class SessionStore {
  readonly token = signal<string | null>(localStorage.getItem(SESSION_KEYS.token));
  readonly refreshToken = signal<string | null>(
    localStorage.getItem(SESSION_KEYS.refreshToken),
  );

  get accessToken(): string | null {
    return this.token();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(SESSION_KEYS.token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(SESSION_KEYS.refreshToken);
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(SESSION_KEYS.token, accessToken);
    this.token.set(accessToken);

    if (refreshToken) {
      localStorage.setItem(SESSION_KEYS.refreshToken, refreshToken);
      this.refreshToken.set(refreshToken);
    }
  }

  getClaims(): JwtPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.token.set(null);
    this.refreshToken.set(null);
  }
}
