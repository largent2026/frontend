import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SuiviClient } from './SuiviClient';

export const metadata = {
  title: 'Suivi de commande',
  description: 'Suivez votre colis avec le numéro de commande et votre email.',
};

export default function SuiviPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Suivi de commande</h1>
        <p className="mt-1 text-muted-foreground">
          Entrez le numéro de commande et l’email utilisé pour la commande.
        </p>
        <SuiviClient />
      </main>
      <Footer />
    </div>
  );
}
