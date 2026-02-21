import { AdminCommandesClient } from '@/app/admin/commandes/AdminCommandesClient';

export default function AdminCommandesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Commandes</h1>
      <AdminCommandesClient />
    </div>
  );
}
