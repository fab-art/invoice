'use client';

import { useAppStore } from '@/store/app-store';
import { LoginPage } from '@/components/rssb/login-page';
import { AppNavbar } from '@/components/rssb/app-navbar';
import { ReceptionPage } from '@/components/rssb/reception-page';
import { ReportsPage } from '@/components/rssb/reports-page';
import { AdminDashboard } from '@/components/rssb/admin-dashboard';
import { PharmaciesPage } from '@/components/rssb/pharmacies-page';

export default function HomePage() {
  const currentView = useAppStore((s) => s.currentView);
  const user = useAppStore((s) => s.user);

  // Show login if not authenticated
  if (!user || currentView === 'login') {
    return <LoginPage />;
  }

  // For admin-only views, check role
  if ((currentView === 'admin' || currentView === 'pharmacies') && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-navy mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppNavbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {currentView === 'reception' && <ReceptionPage />}
        {currentView === 'reports' && <ReportsPage />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'pharmacies' && <PharmaciesPage />}
      </main>
      <footer className="bg-navy text-white text-center py-4 mt-auto">
        <p className="text-xs text-navy-200">
          RSSB — Rwanda Social Security Board | Pharmaceutical Invoices Verification Unit
        </p>
        <p className="text-[10px] text-navy-300 mt-1">© {new Date().getFullYear()} All rights reserved</p>
      </footer>
    </div>
  );
}
