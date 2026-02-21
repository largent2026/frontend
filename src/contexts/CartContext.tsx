'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi, type CartResponse } from '@/lib/api';

const SESSION_KEY = 'cart_session_id';

type CartContextValue = {
  cartId: string | null;
  cart: CartResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemIndex: number, quantity: number) => Promise<void>;
  removeItem: (itemIndex: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
    if (typeof window !== 'undefined' && id) localStorage.setItem(SESSION_KEY, id);
  }, []);

  const refresh = useCallback(async () => {
    const sid = sessionId ?? getSessionId();
    if (!sessionId && typeof window !== 'undefined') setSessionIdState(sid);
    setLoading(true);
    setError(null);
    try {
      const res = await cartApi.getOrCreate(sid ?? undefined);
      setCartId(res.cart._id);
      setCart(res.cart);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur panier');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    setSessionIdState(getSessionId());
  }, []);

  useEffect(() => {
    if (sessionId != null) refresh();
  }, [sessionId]);

  const addItem = useCallback(
    async (productId: string, quantity = 1, variantId?: string) => {
      const sid = sessionId ?? getSessionId();
      const cid = cartId || (await cartApi.getOrCreate(sid ?? undefined).then((r) => r.cart._id));
      if (!cid) return;
      const res = await cartApi.addItem(cid, productId, quantity, variantId, sid ?? undefined);
      setCart(res.cart);
      if (!cartId) setCartId(res.cart._id);
    },
    [cartId, sessionId]
  );

  const updateQuantity = useCallback(
    async (itemIndex: number, quantity: number) => {
      if (!cartId) return;
      const sid = sessionId ?? getSessionId();
      const res = await cartApi.updateItem(cartId, itemIndex, quantity, sid ?? undefined);
      setCart(res.cart);
    },
    [cartId, sessionId]
  );

  const removeItem = useCallback(
    async (itemIndex: number) => {
      if (!cartId) return;
      const sid = sessionId ?? getSessionId();
      const res = await cartApi.removeItem(cartId, itemIndex, sid ?? undefined);
      setCart(res.cart);
    },
    [cartId, sessionId]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      if (!cartId) return;
      const sid = sessionId ?? getSessionId();
      const res = await cartApi.applyCoupon(cartId, code, sid ?? undefined);
      setCart(res.cart);
    },
    [cartId, sessionId]
  );

  const removeCoupon = useCallback(async () => {
    if (!cartId) return;
    const sid = sessionId ?? getSessionId();
    const res = await cartApi.removeCoupon(cartId, sid ?? undefined);
    setCart(res.cart);
  }, [cartId, sessionId]);

  const value = useMemo(
    () => ({
      cartId,
      cart,
      loading,
      error,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      sessionId,
      setSessionId,
    }),
    [cartId, cart, loading, error, refresh, addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, sessionId]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
