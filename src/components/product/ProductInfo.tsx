'use client';

import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import type { Product } from '@/lib/api';

export function ProductInfo({ product }: { product: Product }) {
  const { t } = useTranslation();
  const hasPromo = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <div className="space-y-6">
      {product.categoryName && (
        <p className="text-sm text-muted-foreground">{product.categoryName}</p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {product.name}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
        {hasPromo && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice!)}
          </span>
        )}
        {product.isRefurbished && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {t('products.refurbished')}
          </span>
        )}
        {product.warrantyMonths && (
          <span className="text-sm text-muted-foreground">
            {t('products.warranty', { months: product.warrantyMonths })}
          </span>
        )}
      </div>

      {product.shortDescription && (
        <p className="text-muted-foreground">{product.shortDescription}</p>
      )}

      {product.description && (
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p>{product.description}</p>
        </div>
      )}

      {product.characteristics?.length ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          {product.characteristics.map((c, i) => (
            <div key={i} className="flex justify-between border-b border-border py-2">
              <dt className="text-muted-foreground">{c.key}</dt>
              <dd className="font-medium">{String(c.value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {product.inStock !== false ? (
        <AddToCartButton productId={product._id} disabled={false} />
      ) : (
        <p className="text-sm text-muted-foreground">Rupture de stock</p>
      )}
    </div>
  );
}
