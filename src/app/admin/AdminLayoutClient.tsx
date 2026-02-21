'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') ?? localStorage.getItem('admin_token');
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const locale = pathname.match(/^\/(fr|en|de)/)?.[1] ?? 'fr';
  const path = pathname.replace(/^\/(fr|en|de)/, '') || '';
  const isLoginPage = path === '/admin/login' || path.endsWith('/admin/login');

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    const token = getAdminToken();
    if (!token) {
      router.replace(`/${locale}/admin/login`);
      return;
    }
    setChecked(true);
  }, [isLoginPage, locale, router]);

  if (isLoginPage) {
    return <div className="dark min-h-screen bg-zinc-950 text-zinc-100">{children}</div>;
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" aria-hidden />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      <AdminSidebar currentPath={path} />
      <main className="lg:ml-64 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
