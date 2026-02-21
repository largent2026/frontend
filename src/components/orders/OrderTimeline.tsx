'use client';

import { cn } from '@/lib/utils';
import type { OrderStatusEvent } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Commande créée',
  paid: 'Paiement reçu',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

interface OrderTimelineProps {
  statusHistory?: OrderStatusEvent[] | null;
  currentStatus: string;
  className?: string;
}

export function OrderTimeline({ statusHistory, currentStatus, className }: OrderTimelineProps) {
  const events = (statusHistory && statusHistory.length > 0)
    ? [...statusHistory].sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
      )
    : [{ status: currentStatus, at: new Date().toISOString() }];

  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, i) => (
        <div key={`${event.status}-${event.at}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
          {i < events.length - 1 && (
            <span
              className="absolute left-[11px] top-6 h-full w-0.5 bg-border"
              aria-hidden
            />
          )}
          <span
            className={cn(
              'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background text-xs font-medium',
              event.status === currentStatus && 'border-primary bg-primary text-primary-foreground'
            )}
          >
            {i + 1}
          </span>
          <div className="flex-1 pt-0.5">
            <p className="font-medium text-foreground">
              {STATUS_LABELS[event.status] ?? event.status}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {event.note && (
              <p className="mt-1 text-sm text-muted-foreground italic">{event.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
