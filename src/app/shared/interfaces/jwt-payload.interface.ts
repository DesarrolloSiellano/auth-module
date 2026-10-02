export interface JwtPayload {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  username: string;
  isActived: boolean;
  company: string;
  tenantId: string;
  isSuperAdmin?: boolean;
  isTrial?: boolean;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  emailVerified?: boolean;
  iat: number;
  exp: number;
}
