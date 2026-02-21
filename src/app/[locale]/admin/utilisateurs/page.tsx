import { AdminUtilisateursClient } from '@/app/admin/utilisateurs/AdminUtilisateursClient';

export default function AdminUtilisateursPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Utilisateurs</h1>
      <AdminUtilisateursClient />
    </div>
  );
}
