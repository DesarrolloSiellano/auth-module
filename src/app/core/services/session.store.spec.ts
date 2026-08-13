import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session.store';
import { createToken, identityPayload } from '../testing/jwt.util';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(SessionStore);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should set tokens and persist them in localStorage', () => {
    store.setTokens('access-token', 'refresh-token');

    expect(store.getAccessToken()).toBe('access-token');
    expect(store.getRefreshToken()).toBe('refresh-token');
    expect(localStorage.getItem('token')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(store.accessToken).toBe('access-token');
  });

  it('should decode claims from the access token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGExIiwiZXhwIjoxOTk5OTk5OTk5fQ.sign';
    store.setTokens(token);

    const claims = store.getClaims();
    expect(claims?._id).toBe('64a1');
  });

  it('should return null claims when there is no token', () => {
    expect(store.getClaims()).toBeNull();
  });

  it('should clear tokens, localStorage and sessionStorage', () => {
    localStorage.setItem('someKey', 'value');
    sessionStorage.setItem('other', '1');
    store.setTokens('access', 'refresh');

    store.clear();

    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('should expose identity payload claims', () => {
    store.setTokens(createToken(identityPayload));
    const claims = store.getClaims();
    expect(claims?._id).toBe(identityPayload._id);
    expect(claims?.email).toBe(identityPayload.email);
  });
});
