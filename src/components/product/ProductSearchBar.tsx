'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import { useRef } from 'react';

export function ProductSearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = (inputRef.current?.value ?? '').trim();
    const next = new URLSearchParams(searchParams.toString());
    if (q) {
      next.set('q', q);
      next.delete('page');
    } else {
      next.delete('q');
    }
    router.push(`/${locale}/produits?${next.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder={t('products.searchPlaceholder')}
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        aria-label={t('products.searchPlaceholder')}
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        {t('products.searchButton')}
      </button>
    </form>
  );
}
