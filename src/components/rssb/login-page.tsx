'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import Image from 'next/image';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Check existing session
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setCurrentView('reception');
        }
      })
      .catch(() => {});
  }, [setUser, setCurrentView]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      setUser(data.user);
      setCurrentView('reception');
      toast.success(`Welcome, ${data.user.fullName}!`);
    } catch {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  }, [email, password, setUser, setCurrentView]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-navy-light p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Image src="/rssb-logo.png" alt="RSSB Logo" width={80} height={80} className="rounded-full" />
          </div>
          <CardTitle className="text-2xl text-navy font-bold">Invoice Reception System</CardTitle>
          <CardDescription className="text-muted-foreground">
            Rwanda Social Security Board — Pharmaceutical Invoices Verification Unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-navy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-navy"
              />
            </div>
            <Button type="submit" className="w-full bg-navy hover:bg-navy-light text-white" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-muted rounded-lg border">
            <p className="text-xs font-semibold text-navy mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-navy">Admin</p>
                <p>admin@rssb.local</p>
                <p>admin123</p>
              </div>
              <div>
                <p className="font-medium text-navy">Receptionist</p>
                <p>reception@rssb.local</p>
                <p>reception123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
