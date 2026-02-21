'use client';

import { useState } from 'react';
import type { Review } from '@/lib/api';

export function ReviewsSection({
  productId,
  initialReviews,
  initialStats,
}: {
  productId: string;
  initialReviews: Review[];
  initialStats: { average: number; count: number };
}) {
  const [reviews] = useState(initialReviews);
  const [stats] = useState(initialStats);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Avis clients</h2>
      {stats.count > 0 && (
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= Math.round(stats.average) ? 'text-foreground' : 'text-muted'}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {stats.average.toFixed(1)} ({stats.count} avis)
          </span>
        </div>
      )}
      {reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-lg border border-border p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
                <span className="text-sm text-muted-foreground">{r.userName}</span>
                {r.isVerifiedPurchase && (
                  <span className="text-xs text-muted-foreground">Achat vérifié</span>
                )}
              </div>
              {r.title && <p className="font-medium">{r.title}</p>}
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Aucun avis pour le moment.</p>
      )}
    </div>
  );
}
