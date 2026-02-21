import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartPageClient } from './CartPageClient';

export default function PanierPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Panier</h1>
          <Link href="/produits" className="text-sm text-muted-foreground underline">
            Continuer mes achats
          </Link>
        </div>
        <CartPageClient />
      </main>
      <Footer />
    </div>
  );
}

