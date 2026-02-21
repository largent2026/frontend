'use client';

/**
 * Boundary d'erreur global — remplace tout le layout en cas d'erreur.
 * Doit inclure ses propres balises <html> et <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#18181b', color: '#fafafa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>Une erreur est survenue</h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>
            {error?.message || 'Erreur inattendue.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: '8px 16px', fontSize: 14, background: '#3f3f46', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{ padding: '8px 16px', fontSize: 14, color: '#d4d4d8', border: '1px solid #52525b', borderRadius: 8, textDecoration: 'none' }}
            >
              Accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
