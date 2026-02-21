import { Header } from '@/components/layout/Header';
import { AdminCommandesClient } from './AdminCommandesClient';

export const metadata = {
  title: 'Admin – Commandes',
  description: 'Gestion des commandes.',
};

export default function AdminCommandesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Commandes</h1>
        <AdminCommandesClient />
      </main>
    </div>
  );
}
