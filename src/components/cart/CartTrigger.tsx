'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CartDrawer } from './CartDrawer';

export function CartTrigger() {
  const [open, setOpen] = useState(false);
  const { cart } = useCart();
  const count = cart?.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded p-2 text-muted-foreground hover:text-foreground"
        aria-label="Ouvrir le panier"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
