import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomeClient } from './HomeClient';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HomeClient />
      </main>
      <Footer />
    </div>
  );
}
