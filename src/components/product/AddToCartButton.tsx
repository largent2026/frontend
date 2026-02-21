'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export function AddToCartButton({
  productId,
  variantId,
  disabled,
  className,
}: {
  productId: string;
  variantId?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const handleClick = async () => {
    setAdding(true);
    try {
      await addItem(productId, 1, variantId);
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || adding}
      className={cn(
        'w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50',
        className
      )}
    >
      {adding ? '…' : t('products.addToCart')}
    </button>
  );
}
