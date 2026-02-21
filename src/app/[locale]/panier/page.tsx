import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartPageClient } from '@/app/panier/CartPageClient';

export default function PanierPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <CartPageClient />
      </main>
      <Footer />
    </div>
  );
}
