'use client';

import { useEffect } from 'react';
import { pushProductView } from '@/lib/recommendationHistory';

/**
 * Enregistre la vue produit pour les recommandations (sessionStorage).
 * À placer sur la page produit avec l’id produit et l’id catégorie.
 */
export function RecommendationTracker({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId?: string | null;
}) {
  useEffect(() => {
    pushProductView(productId, categoryId ?? undefined);
  }, [productId, categoryId]);
  return null;
}
