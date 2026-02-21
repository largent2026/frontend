import { Header } from '@/components/layout/Header';
import { AdminOrderDetailClient } from './AdminOrderDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <AdminOrderDetailClient orderId={id} />
      </main>
    </div>
  );
}
