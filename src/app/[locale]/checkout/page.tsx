import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CheckoutPageClient } from '@/app/checkout/CheckoutPageClient';

export default function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Chargement…</div>}>
          <CheckoutPageClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
