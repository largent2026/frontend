'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useLocale } from '@/contexts/LocaleContext';
import { cartApi, checkoutApi, type CartTotals, type Order } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';

type PaymentProvider = 'stripe' | 'coinbase' | 'twint';

type Address = {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  street2?: string;
  city: string;
  postalCode: string;
  state?: string;
  country: string;
  phone: string;
};

function validateAddress(a: Address) {
  const errors: Partial<Record<keyof Address, string>> = {};
  if (!a.firstName.trim()) errors.firstName = 'Prénom requis';
  if (!a.lastName.trim()) errors.lastName = 'Nom requis';
  if (!a.street.trim()) errors.street = 'Adresse requise';
  if (!a.city.trim()) errors.city = 'Ville requise';
  if (!a.postalCode.trim()) errors.postalCode = 'Code postal requis';
  if (!a.country.trim()) errors.country = 'Pays requis';
  if (!a.phone.trim()) errors.phone = 'Téléphone requis';
  if (a.phone && a.phone.replace(/\D/g, '').length < 8) errors.phone = 'Téléphone invalide';
  return errors;
}

const stripePromise = (() => {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return pk ? loadStripe(pk) : null;
})();

export function CheckoutPageClient() {
  const router = useRouter();
  const locale = useLocale();
  const params = useSearchParams();
  const cancel = params.get('cancel');

  const { cart, cartId, loading, error, applyCoupon, removeCoupon, sessionId } = useCart();
  const [shippingOptionId, setShippingOptionId] = useState<string>('standard');
  const [pricing, setPricing] = useState<CartTotals | null>(null);
  const [pricingBusy, setPricingBusy] = useState(false);

  const [coupon, setCoupon] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  const [provider, setProvider] = useState<PaymentProvider>('stripe');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [address, setAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'CH',
    phone: '',
  });
  const addressErrors = useMemo(() => validateAddress(address), [address]);
  const isAddressValid = Object.keys(addressErrors).length === 0;

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeInitError, setStripeInitError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const shippingOptions = pricing?.shippingOptions || cart?.shippingOptions || [];
  const shownSubtotal = pricing?.subtotal ?? cart?.subtotal ?? 0;
  const shownDiscount = pricing?.discount ?? cart?.discount ?? 0;
  const shownShipping = pricing?.shippingCost ?? cart?.shippingCost ?? 0;
  const shownTotal = pricing?.total ?? cart?.total ?? 0;

  const refreshTotals = async (nextShippingOptionId: string) => {
    if (!cartId) return;
    setPricingBusy(true);
    try {
      const totals = await cartApi.getTotals(cartId, nextShippingOptionId, sessionId ?? undefined);
      setPricing(totals);
    } finally {
      setPricingBusy(false);
    }
  };

  useEffect(() => {
    if (cartId) refreshTotals(shippingOptionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  const onApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    setGlobalError(null);
    try {
      await applyCoupon(coupon.trim());
      setCoupon('');
      await refreshTotals(shippingOptionId);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Erreur code promo');
    } finally {
      setCouponBusy(false);
    }
  };

  const onRemoveCoupon = async () => {
    setCouponBusy(true);
    setGlobalError(null);
    try {
      await removeCoupon();
      await refreshTotals(shippingOptionId);
    } finally {
      setCouponBusy(false);
    }
  };

  const startPayment = async () => {
    if (!cartId) {
      setGlobalError('Panier introuvable');
      return;
    }
    if (!cart?.items?.length) {
      setGlobalError('Votre panier est vide');
      return;
    }
    if (!isAddressValid) {
      setGlobalError('Vérifie ton adresse de livraison');
      return;
    }
    if (!guestEmail.trim()) {
      setGlobalError('Email requis pour la confirmation');
      return;
    }

    setCreatingOrder(true);
    setGlobalError(null);
    setStripeInitError(null);
    try {
      const orderRes = await checkoutApi.createOrder(
        {
          cartId,
          shippingAddress: address as unknown as Record<string, string>,
          shippingOptionId,
          notes: notes.trim() || undefined,
          guestEmail: guestEmail.trim(),
          guestFirstName: address.firstName,
          guestLastName: address.lastName,
        },
        sessionId ?? undefined
      );
      setOrder(orderRes.order);

      const paymentRes = await checkoutApi.createPayment(orderRes.order._id, provider);
      if (provider === 'stripe') {
        if (!paymentRes.clientSecret) throw new Error('Stripe: clientSecret manquant');
        if (!stripePromise) throw new Error('Stripe: clé publique manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)');
        setStripeClientSecret(paymentRes.clientSecret);
        return;
      }

      const url = paymentRes.hostedUrl || paymentRes.paymentUrl;
      if (!url) throw new Error('URL de paiement manquante');
      window.location.href = url;
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Erreur checkout');
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        {cancel && (
          <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3 text-sm">
            Paiement annulé. Tu peux réessayer ou choisir un autre moyen.
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !cart?.items?.length ? (
          <div className="rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground">Votre panier est vide.</p>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/produits`)}
              className="mt-4 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background"
            >
              Voir les produits
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border p-5">
              <h2 className="text-lg font-semibold">Adresse de livraison</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Prénom" value={address.firstName} error={addressErrors.firstName} onChange={(v) => setAddress((a) => ({ ...a, firstName: v }))} />
                <Field label="Nom" value={address.lastName} error={addressErrors.lastName} onChange={(v) => setAddress((a) => ({ ...a, lastName: v }))} />
                <Field className="sm:col-span-2" label="Adresse" value={address.street} error={addressErrors.street} onChange={(v) => setAddress((a) => ({ ...a, street: v }))} />
                <Field className="sm:col-span-2" label="Complément (optionnel)" value={address.street2 || ''} onChange={(v) => setAddress((a) => ({ ...a, street2: v }))} />
                <Field label="Ville" value={address.city} error={addressErrors.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
                <Field label="Code postal" value={address.postalCode} error={addressErrors.postalCode} onChange={(v) => setAddress((a) => ({ ...a, postalCode: v }))} />
                <Field label="Pays" value={address.country} error={addressErrors.country} onChange={(v) => setAddress((a) => ({ ...a, country: v }))} />
                <Field label="Téléphone" value={address.phone} error={addressErrors.phone} onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Field label="Email (confirmation de commande)" value={guestEmail} onChange={setGuestEmail} />
                  <p className="mt-1 text-xs text-muted-foreground">Pas besoin de créer un compte — indiquez votre email pour recevoir le récapitulatif et suivre la commande.</p>
                </div>
                <Field label="Note (optionnel)" value={notes} onChange={setNotes} />
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h2 className="text-lg font-semibold">Livraison</h2>
              <div className="mt-3 space-y-2">
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
                          await refreshTotals(opt.id);
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
                    <span className={cn('text-sm tabular-nums', pricingBusy && 'opacity-60')}>{formatPrice(opt.price)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h2 className="text-lg font-semibold">Paiement</h2>
              <div className="mt-3 grid gap-2">
                <PayOption
                  selected={provider === 'stripe'}
                  title="Carte bancaire"
                  subtitle="Paiement sécurisé (3D Secure si nécessaire)"
                  onSelect={() => setProvider('stripe')}
                />
                <PayOption
                  selected={provider === 'coinbase'}
                  title="Crypto"
                  subtitle="Via Coinbase Commerce"
                  onSelect={() => setProvider('coinbase')}
                />
                <PayOption
                  selected={provider === 'twint'}
                  title="TWINT"
                  subtitle="QR / app (Suisse)"
                  onSelect={() => setProvider('twint')}
                />
              </div>

              <AnimatePresence>
                {provider === 'stripe' && stripeClientSecret && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mt-4 rounded-xl border border-border p-4"
                  >
                    <StripePayBox
                      clientSecret={stripeClientSecret}
                      orderNumber={order?.orderNumber || null}
                      onError={(msg) => setStripeInitError(msg)}
                    />
                    {stripeInitError && <p className="mt-2 text-sm text-red-600">{stripeInitError}</p>}
                    <button
                      type="button"
                      onClick={() => {
                        setStripeClientSecret(null);
                        setOrder(null);
                        setStripeInitError(null);
                      }}
                      className="mt-3 text-xs text-muted-foreground underline"
                    >
                      Recommencer (si tu as changé d’avis)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={startPayment}
                  disabled={creatingOrder || (provider === 'stripe' && !!stripeClientSecret) || !cart?.items?.length || !isAddressValid || !guestEmail.trim()}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
                >
                  {creatingOrder ? 'Préparation…' : provider === 'stripe' && stripeClientSecret ? 'Session prête' : 'Continuer'}
                </button>
                <p className="text-xs text-muted-foreground">
                  En cliquant, tu confirmes ta commande. Le débit dépend du moyen de paiement.
                </p>
              </div>
            </div>

            {globalError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {globalError}
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="lg:sticky lg:top-20 h-fit">
        <div className="rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold">Résumé commande</h2>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="tabular-nums">{formatPrice(shownSubtotal)}</span>
            </div>
            {shownDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Réduction</span>
                <span className="tabular-nums">−{formatPrice(shownDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span className={cn('tabular-nums', pricingBusy && 'opacity-60')}>{formatPrice(shownShipping)}</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className={cn('tabular-nums', pricingBusy && 'opacity-60')}>{formatPrice(shownTotal)}</span>
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
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20',
          error ? 'border-red-300' : 'border-border'
        )}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function PayOption({
  selected,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-xl border p-4 text-left transition',
        selected ? 'border-foreground bg-muted/30' : 'border-border hover:bg-muted/30'
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}

function StripePayBox({
  clientSecret,
  orderNumber,
  onError,
}: {
  clientSecret: string;
  orderNumber: string | null;
  onError: (msg: string) => void;
}) {
  if (!stripePromise) {
    return <p className="text-sm text-red-600">Stripe non configuré côté frontend.</p>;
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <StripeConfirm orderNumber={orderNumber} onError={onError} />
    </Elements>
  );
}

function StripeConfirm({ orderNumber, onError }: { orderNumber: string | null; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  const successPath = `/${locale}/checkout/success${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ''}`;

  const confirm = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    onError('');
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}${successPath}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Paiement refusé');
        return;
      }

      router.push(successPath);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Erreur Stripe');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <PaymentElement />
      <button
        type="button"
        onClick={confirm}
        disabled={!stripe || !elements || busy}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
      >
        {busy ? 'Paiement…' : 'Payer par carte'}
      </button>
      <p className="text-xs text-muted-foreground">Paiement sécurisé. Le débit peut nécessiter une vérification 3D Secure.</p>
    </div>
  );
}

