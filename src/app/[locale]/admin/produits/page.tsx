import { AdminProduitsClient } from '@/app/admin/produits/AdminProduitsClient';

export default function AdminProduitsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Produits</h1>
      <AdminProduitsClient />
    </div>
  );
}
