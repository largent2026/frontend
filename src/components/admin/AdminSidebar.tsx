'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LocaleLink } from '@/components/LocaleLink';
import { cn } from '@/lib/utils';
import { adminAuthApi } from '@/lib/api';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/commandes', label: 'Commandes', icon: '🛒' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👥' },
  { href: '/admin/produits', label: 'Produits', icon: '📦' },
  { href: '/admin/faq', label: 'FAQ', icon: '❓' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🎫' },
  { href: '/admin/avis', label: 'Avis', icon: '⭐' },
  { href: '/admin/legal', label: 'Mentions légales', icon: '📄' },
];

export function AdminSidebar({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const locale = pathname.match(/^\/(fr|en|de)/)?.[1] ?? 'fr';

  const handleLogout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin_token');
    }
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 shadow-lg lg:hidden"
        aria-label="Menu"
      >
        {open ? '✕' : '☰'}
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 border-r border-zinc-700/50 bg-zinc-900 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center border-b border-zinc-700/50 px-4">
          <LocaleLink href="/admin" className="font-semibold text-zinc-100">
            Admin Panel
          </LocaleLink>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? currentPath === '/admin' || currentPath === '' || currentPath.endsWith('/admin')
                : currentPath === item.href || currentPath.startsWith(item.href + '/');
            return (
              <LocaleLink
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-700/80 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </LocaleLink>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-700/50 p-3 space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            Déconnexion
          </button>
          <LocaleLink
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            ← Retour au site
          </LocaleLink>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
