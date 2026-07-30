import type { AppView } from '@/store/app-store';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'RECEPTIONIST';
}

export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}
