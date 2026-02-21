import Image from 'next/image';
import { LocaleLink } from '@/components/LocaleLink';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/api';

export function SimilarProducts({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <LocaleLink key={p._id} href={`/produits/${p.slug}`} className="group block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted/50">
            <Image
              src={p.images?.[0]?.url || 'https://placehold.co/400x300?text=Produit'}
              alt={p.name || ''}
              fill
              sizes="25vw"
              className="object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <h3 className="mt-2 font-medium line-clamp-2 group-hover:underline">{p.name}</h3>
          <p className="text-sm font-semibold">{formatPrice(p.price)}</p>
        </LocaleLink>
      ))}
    </div>
  );
}
