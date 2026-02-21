'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { adminAuthApi } from '@/lib/api';

const ADMIN_TOKEN_KEY = 'adminToken';

export function AdminLoginClient() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const locale = (pathname.match(/^\/(fr|en|de)/)?.[1]) || 'fr';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminAuthApi.login(email, password);
      if (res.accessToken) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADMIN_TOKEN_KEY, res.accessToken);
          localStorage.setItem('admin_token', res.accessToken);
        }
        router.push(`/${locale}/admin`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">
      <h1 className="mb-6 text-center text-xl font-semibold text-zinc-100">Admin — Connexion</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className="mb-1 block text-sm text-zinc-400">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="mb-1 block text-sm text-zinc-400">
            Mot de passe
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
        </div>
        {error && (
          <p className="rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-700 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link href={`/${locale}`} className="hover:text-zinc-300">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
