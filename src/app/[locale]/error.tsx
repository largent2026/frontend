'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Locale error:', error);
  }, [error]);

  const message = typeof error?.message === 'string' ? error.message : 'Erreur inattendue.';

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Réessayer
        </button>
        <Link href="/" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
          Accueil
        </Link>
      </div>
    </div>
  );
}
