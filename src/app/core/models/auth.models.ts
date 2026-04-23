export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string;
}

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: 'invalid_credentials' | 'user_not_found' | 'email_taken' };
