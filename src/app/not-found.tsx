import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-semibold">404</h1>
          <p className="mt-2 text-muted-foreground">Page non trouvée.</p>
          <Link href="/produits" className="mt-6 inline-block text-sm font-medium underline">
            Voir les produits
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
