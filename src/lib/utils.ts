import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number, currency = 'CHF'): string {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(value);
}
