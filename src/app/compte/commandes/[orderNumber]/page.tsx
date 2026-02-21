import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OrderDetailClient } from './OrderDetailClient';

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <OrderDetailClient orderNumber={orderNumber} />
      </main>
      <Footer />
    </div>
  );
}
