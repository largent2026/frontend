import { AdminOrderDetailClient } from '@/app/admin/commandes/[id]/AdminOrderDetailClient';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div>
      <AdminOrderDetailClient orderId={id} />
    </div>
  );
}
