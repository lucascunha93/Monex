import { Injectable, signal, computed } from '@angular/core';
import { AuthSession, AuthUser, LoginResult } from '../models/auth.models';

const USERS_KEY = 'monex_users';
const SESSION_KEY = 'monex_session';
const TOKEN_TTL_DAYS = 30;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(this.loadSession());

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  async login(email: string, password: string): Promise<LoginResult> {
    const users = this.loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'user_not_found' };
    }
    const hash = await this.hashPassword(password);
    if (hash !== user.passwordHash) {
      return { success: false, error: 'invalid_credentials' };
    }
    this.persistSession(user);
    this.currentUser.set(user);
    return { success: true, user };
  }

  async register(name: string, email: string, password: string): Promise<LoginResult> {
    const users = this.loadUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'email_taken' };
    }

    const passwordHash = await this.hashPassword(password);
    const user: AuthUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    this.persistSession(user);
    this.currentUser.set(user);
    return { success: true, user };
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
  }

  getUserId(): string {
    return this.currentUser()?.id ?? 'anonymous';
  }

  private persistSession(user: AuthUser): void {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);
    const session: AuthSession = {
      userId: user.id,
      token: btoa(`${user.id}:${Date.now()}`),
      expiresAt: expiresAt.toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private loadSession(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as AuthSession;
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      const users = this.loadUsers();
      return users.find((u) => u.id === session.userId) ?? null;
    } catch {
      return null;
    }
  }

  private loadUsers(): AuthUser[] {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as AuthUser[];
    } catch {
      return [];
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'monex_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
