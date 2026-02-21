import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MesCommandesClient } from './MesCommandesClient';

export const metadata = {
  title: 'Mes commandes',
  description: 'Consultez l’historique et le suivi de vos commandes.',
};

export default function MesCommandesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mes commandes</h1>
        <p className="mt-1 text-muted-foreground">
          Historique et suivi de vos commandes.
        </p>
        <MesCommandesClient />
      </main>
      <Footer />
    </div>
  );
}
