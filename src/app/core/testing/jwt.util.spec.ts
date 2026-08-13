import { jwtDecode } from 'jwt-decode';
import { createToken, identityPayload } from './jwt.util';

describe('jwt.util', () => {
  it('should create a decodable JWT with the given payload', () => {
    const token = createToken(identityPayload);
    const decoded = jwtDecode<typeof identityPayload>(token);

    expect(decoded._id).toBe(identityPayload._id);
    expect(decoded.email).toBe(identityPayload.email);
    expect(decoded.isActived).toBe(true);
  });

  it('should preserve extra payload fields', () => {
    const token = createToken({ custom: 'value', exp: 1 });
    const decoded = jwtDecode<{ custom: string; exp: number }>(token);
    expect(decoded.custom).toBe('value');
  });

  it('should expose a valid identity payload with future expiration', () => {
    expect(identityPayload._id).toBeTruthy();
    expect(identityPayload.isActived).toBe(true);
    expect(identityPayload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
