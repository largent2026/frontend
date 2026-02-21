'use client';

import { CartProvider } from '@/contexts/CartContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CookieConsentProvider>{children}</CookieConsentProvider>
    </CartProvider>
  );
}
