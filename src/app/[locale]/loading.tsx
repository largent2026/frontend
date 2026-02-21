export default function LocaleLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" aria-hidden />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
