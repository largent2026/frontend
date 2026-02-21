import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SuccessClient } from '@/app/checkout/success/SuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Chargement…</div>}>
          <SuccessClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
