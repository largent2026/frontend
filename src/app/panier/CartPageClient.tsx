'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { LocaleLink } from '@/components/LocaleLink';
import { useCart } from '@/contexts/CartContext';
import { cartApi } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';

export function CartPageClient() {
  const { t } = useTranslation();
  const { cart, cartId, loading, error, updateQuantity, removeItem, applyCoupon, removeCoupon, sessionId } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [shippingOptionId, setShippingOptionId] = useState<string>('standard');
  const [pricing, setPricing] = useState<{ shippingCost: number; total: number } | null>(null);
  const [pricingBusy, setPricingBusy] = useState(false);

  const itemCount = cart?.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;

  const lines = useMemo(() => {
    return (cart?.items || []).map((item, index) => {
      const p = item.product;
      const name = typeof p?.name === 'string' ? p.name : (p?.name as Record<string, string>)?.fr ?? 'Produit';
      const unit = p?.price ?? 0;
      const imageUrl = p?.images?.[0]?.url ?? 'https://placehold.co/160x160?text=Produit';
      return { index, name, unit, qty: item.quantity, imageUrl };
    });
  }, [cart?.items]);

  const shippingOptions = cart?.shippingOptions || [];
  const shownShippingCost = pricing?.shippingCost ?? cart?.shippingCost ?? 0;
  const shownTotal = pricing?.total ?? cart?.total ?? 0;

  const refreshPricing = async (nextOptionId: string) => {
    if (!cartId) return;
    setPricingBusy(true);
    try {
      const totals = await cartApi.getTotals(cartId, nextOptionId, sessionId ?? undefined);
      setPricing({ shippingCost: totals.shippingCost, total: totals.total });
    } finally {
      setPricingBusy(false);
    }
  };

  const onApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      await applyCoupon(coupon.trim());
      setCoupon('');
      await refreshPricing(shippingOptionId);
    } finally {
      setCouponBusy(false);
    }
  };

  const onRemoveCoupon = async () => {
    setCouponBusy(true);
    try {
      await removeCoupon();
      await refreshPricing(shippingOptionId);
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !cart?.items?.length ? (
          <div className="rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground">{t('cart.empty')}</p>
            <LocaleLink
              href="/produits"
              className="mt-4 inline-block rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              {t('common.seeProducts')}
            </LocaleLink>
          </div>
        ) : (
          <ul className="space-y-4">
            {lines.map((line) => (
              <li key={line.index} className="flex gap-4 rounded-2xl border border-border p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{formatPrice(line.unit)} / unité</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-border bg-background">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm hover:bg-muted rounded-l-full"
                        onClick={() => updateQuantity(line.index, Math.max(0, line.qty - 1))}
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm hover:bg-muted rounded-r-full"
                        onClick={() => updateQuantity(line.index, line.qty + 1)}
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="text-sm text-muted-foreground underline" onClick={() => removeItem(line.index)}>
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">{formatPrice(line.unit * line.qty)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="lg:sticky lg:top-20 h-fit">
        <div className="rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Résumé</h2>
            <p className="text-sm text-muted-foreground">{itemCount} article(s)</p>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="tabular-nums">{formatPrice(cart?.subtotal ?? 0)}</span>
            </div>
            {(cart?.discount ?? 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Réduction</span>
                <span className="tabular-nums">−{formatPrice(cart?.discount ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span className={cn('tabular-nums', pricingBusy && 'opacity-60')}>{formatPrice(shownShippingCost)}</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className={cn('tabular-nums', pricingBusy && 'opacity-60')}>{formatPrice(shownTotal)}</span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium">Livraison</p>
            <div className="mt-2 space-y-2">
              {shippingOptions.map((opt) => (
                <label key={opt.id} className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
                  <span className="flex gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.id}
                      checked={shippingOptionId === opt.id}
                      onChange={async () => {
                        setShippingOptionId(opt.id);
                        await refreshPricing(opt.id);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">{opt.name}</span>
                      {(opt.minDays || opt.maxDays) && (
                        <span className="block text-xs text-muted-foreground">
                          {opt.minDays ? `${opt.minDays}` : ''}{opt.maxDays ? `–${opt.maxDays}` : ''} jours
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">{formatPrice(opt.price)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium">Code promo</p>
            <div className="mt-2 flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Ex: DYSON10"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <button
                type="button"
                disabled={couponBusy || !coupon.trim()}
                onClick={onApplyCoupon}
                className="h-10 shrink-0 rounded-xl bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
              >
                Appliquer
              </button>
            </div>
            {(cart?.couponCode || cart?.coupon?.code) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Code appliqué: <span className="font-medium">{cart?.couponCode || cart?.coupon?.code}</span>{' '}
                <button type="button" onClick={onRemoveCoupon} className="underline" disabled={couponBusy}>
                  Retirer
                </button>
              </p>
            )}
          </div>

          <LocaleLink
            href="/checkout"
            className={cn(
              'mt-6 inline-flex w-full items-center justify-center rounded-full bg-foreground py-3 text-sm font-medium text-background transition hover:opacity-90',
              !cart?.items?.length && 'pointer-events-none opacity-50'
            )}
          >
            {t('cart.checkout')}
          </LocaleLink>
        </div>
      </aside>
    </div>
  );
}

