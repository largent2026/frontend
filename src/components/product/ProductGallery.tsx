'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/api';

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : [{ url: 'https://placehold.co/800x800?text=Produit', order: 0 }];
  const [current, setCurrent] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/50">
        <Image
          src={images[current]?.url || images[0].url}
          alt={product.name || 'Produit'}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === current ? 'border-foreground' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
