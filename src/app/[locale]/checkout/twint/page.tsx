import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TwintClient } from '@/app/checkout/twint/twintClient';

export default function TwintPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Chargement…</div>}>
          <TwintClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
