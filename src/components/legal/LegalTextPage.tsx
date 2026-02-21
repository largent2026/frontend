import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function LegalTextPage({ title, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** Render i18n content string with \n\n as paragraphs */
export function LegalContent({ content }: { content: string }) {
  const paragraphs = (content || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-muted-foreground leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}
