'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const { cart, loading, updateQuantity, removeItem, removeCoupon } = useCart();

  const itemCount = cart?.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;

  const goCheckout = () => {
    onClose();
    router.push(`/${locale}/checkout`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold">{t('cart.title')} ({itemCount})</h2>
              <button type="button" onClick={onClose} className="rounded p-2 hover:bg-muted">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-muted-foreground">Chargement…</p>
              ) : !cart?.items?.length ? (
                <p className="text-muted-foreground">{t('cart.empty')}</p>
              ) : (
                <ul className="space-y-4">
                  {cart.items.map((item, index) => {
                    const p = item.product;
                    const name = typeof p?.name === 'string' ? p.name : (p?.name as Record<string, string>)?.fr ?? 'Produit';
                    const price = p?.price ?? 0;
                    const imageUrl = p?.images?.[0]?.url ?? 'https://placehold.co/100x100?text=Produit';
                    return (
                      <li key={`${p?._id}-${index}`} className="flex gap-3 border-b border-border pb-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={imageUrl} alt="" fill className="object-cover" sizes="80px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{name}</p>
                          <p className="text-sm text-muted-foreground">{formatPrice(price)} × {item.quantity}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded border border-border px-2 py-0.5 text-xs"
                              onClick={() => updateQuantity(index, Math.max(0, item.quantity - 1))}
                            >
                              −
                            </button>
                            <span className="text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              className="rounded border border-border px-2 py-0.5 text-xs"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="ml-2 text-xs text-muted-foreground underline"
                              onClick={() => removeItem(index)}
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {cart?.items?.length ? (
              <div className="border-t border-border p-4 space-y-2">
                {cart.couponCode && (
                  <p className="text-sm text-muted-foreground">
                    Code promo: {cart.couponCode}
                    <button type="button" onClick={removeCoupon} className="ml-2 underline">Retirer</button>
                  </p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('cart.discount')}</span>
                    <span>−{formatPrice(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>{t('cart.total')}</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <button
                  type="button"
                  onClick={goCheckout}
                  className={cn('w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition hover:opacity-90')}
                >
                  {t('cart.checkout')}
                </button>
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
