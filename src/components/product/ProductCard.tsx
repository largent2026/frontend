'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LocaleLink } from '@/components/LocaleLink';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/api';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { t } = useTranslation();
  const imageUrl = product.images?.[0]?.url || 'https://placehold.co/600x450?text=Produit';
  const hasPromo = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <LocaleLink href={`/produits/${product.slug}`} className="group block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted/50">
          <Image
            src={imageUrl}
            alt={product.name || 'Produit'}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {hasPromo && (
            <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
              Promo
            </span>
          )}
          {product.isRefurbished && (
            <span className="absolute right-3 top-3 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {t('products.refurbished')}
            </span>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="line-clamp-2 font-medium tracking-tight group-hover:underline">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatPrice(product.price)}</span>
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
          {product.warrantyMonths && (
            <p className="text-xs text-muted-foreground">{t('products.warranty', { months: product.warrantyMonths })}</p>
          )}
        </div>
      </LocaleLink>
    </motion.div>
  );
}
