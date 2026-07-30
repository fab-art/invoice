'use client';

import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  BarChart3,
  Shield,
  Building2,
  LogOut,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AppView } from '@/store/app-store';

const navItems: { view: AppView; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { view: 'reception', label: 'Reception', icon: <ClipboardList className="h-4 w-4" /> },
  { view: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
  { view: 'admin', label: 'Dashboard', icon: <Shield className="h-4 w-4" />, adminOnly: true },
  { view: 'pharmacies', label: 'Pharmacies', icon: <Building2 className="h-4 w-4" />, adminOnly: true },
];

export function AppNavbar() {
  const { currentView, setCurrentView, user, setUser } = useAppStore();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setCurrentView('login');
  };

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          <Image src="/rssb-logo.png" alt="RSSB" width={36} height={36} className="rounded-full border-2 border-gold" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold leading-tight">RSSB</h1>
            <p className="text-[10px] text-navy-200 leading-tight">Invoice Reception</p>
          </div>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
            .map((item) => (
              <Button
                key={item.view}
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView(item.view)}
                className={
                  currentView === item.view
                    ? 'bg-navy-light text-gold hover:bg-navy-light hover:text-gold'
                    : 'text-navy-100 hover:bg-navy-light/50 hover:text-white'
                }
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            ))}
        </nav>

        {/* Right: User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-navy-light/50">
              <Avatar className="h-7 w-7 mr-2 bg-gold">
                <AvatarFallback className="bg-gold text-navy-dark text-xs font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{user?.fullName}</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-gold font-semibold">{user?.role}</p>
            </div>
            <DropdownMenuSeparator />

            {/* Mobile nav */}
            <div className="md:hidden">
              {navItems
                .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
                .map((item) => (
                  <DropdownMenuItem key={item.view} onClick={() => setCurrentView(item.view)}>
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
            </div>

            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex border-t border-navy-light">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
          .map((item) => (
            <Button
              key={item.view}
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView(item.view)}
              className={`flex-1 h-12 rounded-none ${
                currentView === item.view
                  ? 'text-gold border-b-2 border-gold bg-navy-light/30'
                  : 'text-navy-200'
              }`}
            >
              {item.icon}
            </Button>
          ))}
      </div>
    </header>
  );
}
