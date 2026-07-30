import type { SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: string;
  email?: string;
  fullName?: string;
  role?: 'ADMIN' | 'RECEPTIONIST';
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'rssb-invoice-secret-key-change-in-production-2024',
  cookieName: 'rssb-invoice-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  },
};
