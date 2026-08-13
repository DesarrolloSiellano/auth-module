export function createToken(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}.signature`;
}

export const identityPayload = {
  _id: '64a1c875bde026ae38415338',
  name: 'Admin',
  lastName: 'Admin',
  email: 'admin@admin.com',
  username: 'admin',
  isActived: true,
  company: 'BPONET',
  tenantId: '0000000',
  isSuperAdmin: true,
  iat: 1786566079,
  exp: 1893456000,
};
