'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['delivery', 'payment', 'warranty', 'products', 'returns'] as const;
const CATEGORY_KEYS: Record<string, string> = {
  delivery: 'faq.categoryDelivery',
  payment: 'faq.categoryPayment',
  warranty: 'faq.categoryWarranty',
  products: 'faq.categoryProducts',
  returns: 'faq.categoryReturns',
};

type FaqItem = { id: string | null; q: string; a: string; category?: string; slug?: string; order?: number };

export function FaqClient({ initialFaq }: { initialFaq: FaqItem[] }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const getItemKey = (item: FaqItem, index: number) => item.id ?? `s-${index}`;

  const filtered = useMemo(() => {
    let list = [...initialFaq];
    if (category !== 'all') {
      list = list.filter((item) => (item.category || 'products') === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return list;
  }, [initialFaq, category, search]);

  const firstKey = filtered.length ? getItemKey(filtered[0], 0) : null;
  const effectiveOpenId = openId !== null ? openId : firstKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder={t('faq.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-xs"
          aria-label={t('faq.searchPlaceholder')}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              category === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('faq.categoryAll')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t(CATEGORY_KEYS[cat])}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground" role="status">
          {t('faq.noResults')}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, index) => {
            const id = getItemKey(item, index);
            const isOpen = effectiveOpenId === id;
            return (
              <div
                key={id}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-xl"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="flex-1">{item.q}</span>
                  <span
                    className={`shrink-0 text-muted-foreground text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▼
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={`border-t border-border bg-muted/10 transition-all ${
                    isOpen ? 'block' : 'hidden'
                  }`}
                >
                  <div className="px-5 py-4 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
