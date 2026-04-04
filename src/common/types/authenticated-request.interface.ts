export interface AuthenticatedUser {
  id: string;
  sub: string;
  email?: string;
  apiKeyId?: string;
}
