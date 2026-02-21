import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dyson Reconditionnés | Aspirateurs & soin premium',
  description: 'Dyson reconditionnés garantis. Performance et design premium à prix réduits.',
  openGraph: { title: 'Dyson Reconditionnés', description: 'Dyson reconditionnés garantis.' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased font-sans bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
