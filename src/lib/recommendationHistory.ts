/**
 * Historique de navigation pour les recommandations (sessionStorage).
 * Derniers produits et catégories consultés.
 */

const KEY_PRODUCTS = 'rec_products';
const KEY_CATEGORIES = 'rec_categories';
const MAX_PRODUCTS = 10;
const MAX_CATEGORIES = 5;

function getStored(key: string, max: number): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, max) : [];
  } catch {
    return [];
  }
}

function setStored(key: string, value: string[], max: number) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value.slice(0, max)));
  } catch {}
}

export function getRecentProductIds(): string[] {
  return getStored(KEY_PRODUCTS, MAX_PRODUCTS);
}

export function getRecentCategoryIds(): string[] {
  return getStored(KEY_CATEGORIES, MAX_CATEGORIES);
}

export function pushProductView(productId: string, categoryId?: string | null) {
  if (!productId || typeof window === 'undefined') return;
  const products = getStored(KEY_PRODUCTS, MAX_PRODUCTS + 1);
  const next = [productId, ...products.filter((id) => id !== productId)].slice(0, MAX_PRODUCTS);
  setStored(KEY_PRODUCTS, next, MAX_PRODUCTS);
  if (categoryId) {
    const categories = getStored(KEY_CATEGORIES, MAX_CATEGORIES + 1);
    const nextCat = [categoryId, ...categories.filter((id) => id !== categoryId)].slice(0, MAX_CATEGORIES);
    setStored(KEY_CATEGORIES, nextCat, MAX_CATEGORIES);
  }
}

export function pushCategoryView(categoryId: string) {
  if (!categoryId || typeof window === 'undefined') return;
  const categories = getStored(KEY_CATEGORIES, MAX_CATEGORIES + 1);
  const next = [categoryId, ...categories.filter((id) => id !== categoryId)].slice(0, MAX_CATEGORIES);
  setStored(KEY_CATEGORIES, next, MAX_CATEGORIES);
}
