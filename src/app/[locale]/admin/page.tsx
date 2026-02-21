import { AdminDashboardClient } from '@/app/admin/dashboard/AdminDashboardClient';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Dashboard</h1>
      <AdminDashboardClient />
    </div>
  );
}
