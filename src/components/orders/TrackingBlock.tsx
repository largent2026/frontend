'use client';

import type { ShipmentWithTracking } from '@/lib/api';

interface TrackingBlockProps {
  shipment: ShipmentWithTracking;
}

const TRACKING_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  label_created: 'Étiquette créée',
  in_transit: 'En transit',
  out_for_delivery: 'En livraison',
  delivered: 'Livré',
  exception: 'Exception',
};

export function TrackingBlock({ shipment }: TrackingBlockProps) {
  const events = shipment.tracking?.events ?? [];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{shipment.carrier}</span>
        {shipment.carrierService && (
          <span className="text-sm text-muted-foreground">{shipment.carrierService}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {TRACKING_STATUS_LABELS[shipment.status] ?? shipment.status}
        </span>
      </div>
      {shipment.trackingNumber && (
        <p className="mt-2 font-mono text-sm">
          <span className="text-muted-foreground">N° de suivi :</span>{' '}
          <span className="font-semibold">{shipment.trackingNumber}</span>
        </p>
      )}
      {shipment.shippedAt && (
        <p className="mt-1 text-sm text-muted-foreground">
          Expédié le{' '}
          {new Date(shipment.shippedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      {sortedEvents.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dernières mises à jour
          </p>
          <ul className="space-y-2">
            {sortedEvents.slice(0, 5).map((ev, i) => (
              <li key={i} className="flex flex-col text-sm">
                <span className="text-foreground">{ev.description ?? ev.status ?? '—'}</span>
                <span className="text-muted-foreground">
                  {new Date(ev.date).toLocaleString('fr-FR')}
                  {ev.location ? ` · ${ev.location}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
