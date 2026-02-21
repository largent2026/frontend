'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { checkoutApi, type Order } from '@/lib/api';

export function TwintClient() {
  const router = useRouter();
  const params = useSearchParams();
  const orderNumber = params.get('orderNumber');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const poll = async () => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await checkoutApi.getOrder(orderNumber);
      setOrder(res.order);
      if (res.order.status === 'paid') {
        router.replace(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur commande');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  useEffect(() => {
    if (!orderNumber) return;
    const id = window.setInterval(() => {
      poll();
    }, 4000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  return (
    <div className="rounded-2xl border border-border p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Paiement TWINT</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Scanne le QR dans TWINT (ou valide dans l’app). Cette page se mettra à jour automatiquement.
      </p>

      {!orderNumber ? (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          Il manque `orderNumber` dans l’URL. Reviens au checkout et relance le paiement TWINT.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-border bg-muted/20">
              <div className="text-center">
                <div className="mx-auto h-28 w-28 rounded-xl border border-border bg-background" />
                <p className="mt-3 text-xs text-muted-foreground">QR à intégrer via ton PSP TWINT</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commande</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium">{order?.status || 'pending'}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={poll}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
                >
                  {loading ? 'Vérification…' : 'J’ai payé'}
                </button>
                <Link
                  href="/checkout?cancel=1"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium"
                >
                  Changer de moyen de paiement
                </Link>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <p className="mt-3 text-xs text-muted-foreground">
                Si le paiement est confirmé, tu seras redirigé automatiquement.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

