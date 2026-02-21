const API_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:5000/api/v1';

type Query = Record<string, string | number | undefined>;

// --- Chatbot AI ---
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  message: string;
  locale?: 'fr' | 'en' | 'de';
  productIds?: string[];
  history?: { role: string; content?: string; text?: string }[];
}

export const chatApi = {
  chat: (body: ChatRequestBody, token?: string | null) =>
    fetchApi<{ success: boolean; response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    }),

  /**
   * Stream chat: SSE. onChunk(text), onDone(), onError(err).
   * Returns AbortController so caller can abort.
   */
  chatStream: (
    body: ChatRequestBody,
    callbacks: { onChunk: (text: string) => void; onDone: () => void; onError: (err: Error) => void },
    token?: string | null
  ): AbortController => {
    const controller = new AbortController();
    const url = `${API_URL}/ai/chat/stream`;
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string }).message || res.statusText);
        }
        const reader = res.body?.getReader();
        if (!reader) {
          callbacks.onDone();
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let eventLines: string[] = [];
        let stopped = false;
        const flushEvent = (): boolean => {
          if (eventLines.length === 0) return false;
          const data = eventLines.join('\n');
          eventLines = [];
          if (data === '[DONE]') {
            callbacks.onDone();
            return true;
          }
          if (data.startsWith('[ERROR]')) {
            callbacks.onError(new Error(data.slice(7).trim()));
            return true;
          }
          callbacks.onChunk(data);
          return false;
        };
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (stopped) break;
              if (line.startsWith('data: ')) {
                eventLines.push(line.slice(6));
              } else if (line.trim() === '' && eventLines.length > 0) {
                stopped = flushEvent();
              }
            }
          }
          if (!stopped && eventLines.length > 0) flushEvent();
        } finally {
          reader.releaseLock();
        }
        if (!stopped) callbacks.onDone();
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg === 'Failed to fetch' || msg.includes('NetworkError')) {
          callbacks.onError(new Error("Impossible de joindre l'API. Vérifiez que le backend tourne sur http://localhost:5000 (ou NEXT_PUBLIC_API_URL)."));
        } else {
          callbacks.onError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    return controller;
  },
};

function buildQuery(q: Query): string {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function fetchApi<T>(path: string, options?: RequestInit & { query?: Query }): Promise<T> {
  const { query, ...fetchOptions } = options || {};
  const baseUrl = API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api/v1';
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}${query ? buildQuery(query) : ''}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...fetchOptions.headers } as HeadersInit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('NetworkError')) {
      throw new Error(
        `Impossible de joindre l'API (backend). Vérifiez que le serveur tourne sur ${baseUrl.replace(/\/api\/v1$/, '')} ou définissez NEXT_PUBLIC_API_URL.`
      );
    }
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || res.statusText || 'Request failed');
  return data as T;
}

/** Token CSRF pour routes protégées (auth admin). */
export async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API_URL}/csrf-token`, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'CSRF token failed');
  return (data as { csrfToken?: string }).csrfToken ?? '';
}

export const adminAuthApi = {
  login: async (email: string, password: string) => {
    const csrfToken = await getCsrfToken();
    return fetchApi<{ success: boolean; admin: { email: string }; accessToken: string; expiresIn: string }>(
      '/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'X-CSRF-Token': csrfToken } as HeadersInit,
      }
    );
  },
  logout: async () => {
    const csrfToken = await getCsrfToken();
    await fetchApi<{ success: boolean }>('/admin/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'X-CSRF-Token': csrfToken } as HeadersInit,
    });
  },
};

// Products
export const productsApi = {
  list: (query?: Query) => fetchApi<{ success: boolean; products: Product[]; pagination: Pagination }>('/products', { query }),
  /** Recherche en langage naturel (Gemini → MongoDB). Cache côté backend. Fallback recherche classique si IA indisponible. */
  search: (q: string, params?: { locale?: string; page?: number; limit?: number; sort?: string }) =>
    fetchApi<{ success: boolean; products: Product[]; pagination: Pagination; fromCache?: boolean; usedFallback?: boolean }>(
      '/products/search',
      { query: { q, ...params } as Query }
    ),
  getBySlug: (slug: string, locale?: string) =>
    fetchApi<{ success: boolean; product: Product }>(`/products/slug/${slug}`, { query: { locale } }),
  getSimilar: (slug: string, locale?: string) =>
    fetchApi<{ success: boolean; products: Product[] }>(`/products/similar/${slug}`, { query: { locale } }),
};

// FAQ dynamique (base + Gemini, multilingue)
export interface FaqItem {
  id: string | null;
  q: string;
  a: string;
  source?: string;
  category?: string;
  slug?: string;
  order?: number;
}

export const faqApi = {
  list: (locale?: string) =>
    fetchApi<{ success: boolean; faq: FaqItem[] }>('/faq', { query: { locale: locale ?? 'fr' } }),
  answer: (body: { question: string; locale?: string; saveAsLearned?: boolean }) =>
    fetchApi<{ success: boolean; answer: string; source: string; entryId: string | null }>('/faq/answer', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// Admin FAQ
const adminFaqHeaders = (token: string) => ({
  'Content-Type': 'application/json' as const,
  Authorization: `Bearer ${token}`,
});

export interface FaqEntry {
  _id: string;
  question: { fr?: string; en?: string; de?: string };
  answer: { fr?: string; en?: string; de?: string };
  category?: string;
  slug?: string;
  order?: number;
  seo?: { title?: Record<string, string>; description?: Record<string, string> };
  source: string;
  hitCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const adminFaqApi = {
  listEntries: (params?: { page?: number; limit?: number; source?: string }, token?: string) =>
    fetchApi<{ success: boolean; entries: FaqEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/admin/faq',
      { query: params as Query, headers: token ? adminFaqHeaders(token) : {}, credentials: 'include' }
    ),
  frequent: (params?: { limit?: number; locale?: string }, token?: string) =>
    fetchApi<{ success: boolean; questions: { question: string; locale: string; count: number }[] }>(
      '/admin/faq/frequent',
      { query: params as Query, headers: token ? adminFaqHeaders(token) : {}, credentials: 'include' }
    ),
  create: (body: { question: Record<string, string>; answer: Record<string, string>; category?: string; slug?: string; order?: number; seo?: Record<string, unknown>; source?: string }, token?: string) =>
    fetchApi<{ success: boolean; entry: FaqEntry }>('/admin/faq', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? adminFaqHeaders(token) : {},
      credentials: 'include',
    }),
  update: (id: string, body: Partial<FaqEntry>, token?: string) =>
    fetchApi<{ success: boolean; entry: FaqEntry }>(`/admin/faq/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: token ? adminFaqHeaders(token) : {},
      credentials: 'include',
    }),
  delete: (id: string, token?: string) =>
    fetchApi<{ success: boolean }>(`/admin/faq/${id}`, {
      method: 'DELETE',
      headers: token ? adminFaqHeaders(token) : {},
      credentials: 'include',
    }),
  generateAnswer: (id: string, body: { locale?: string }, token?: string) =>
    fetchApi<{ success: boolean; answer: string; locale: string }>(`/admin/faq/${id}/generate-answer`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? adminFaqHeaders(token) : {},
      credentials: 'include',
    }),
};

// Legal (mentions légales) - public
export interface LegalData {
  companyName: string;
  legalForm: string;
  address: string;
  email: string;
  publicationManager: string;
  host: string;
  vatNumber: string;
  intellectualProperty: string;
  liability: string;
}

export const legalApi = {
  get: (locale?: string) =>
    fetchApi<{ success: boolean; legal: LegalData | null }>('/legal', { query: { locale: locale ?? 'fr' } }),
};

// Admin Legal
export const contactApi = {
  submit: (body: { firstName: string; lastName?: string; email: string; message: string; website?: string }) =>
    fetchApi<{ success: boolean; message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const adminLegalApi = {
  get: (token: string) =>
    fetchApi<{ success: boolean; legal: Record<string, unknown> }>('/admin/legal', {
      headers: adminFaqHeaders(token),
      credentials: 'include',
    }),
  update: (body: Record<string, unknown>, token: string) =>
    fetchApi<{ success: boolean; legal: Record<string, unknown> }>('/admin/legal', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: adminFaqHeaders(token),
      credentials: 'include',
    }),
};

// Recommendations (historique navigation + achats + Gemini)
const recommendationHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json' as const,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const recommendationsApi = {
  getRecommendations: (
    params: { locale?: string; limit?: number; recentProductIds?: string[]; recentCategoryIds?: string[] },
    token?: string | null
  ) => {
    const query: Query = {
      locale: params.locale ?? 'fr',
      limit: params.limit ?? 12,
    };
    if (params.recentProductIds?.length) query.recentProductIds = params.recentProductIds.join(',');
    if (params.recentCategoryIds?.length) query.recentCategoryIds = params.recentCategoryIds.join(',');
    return fetchApi<{ success: boolean; products: Product[] }>('/recommendations', {
      query,
      headers: recommendationHeaders(token),
      credentials: 'include',
    });
  },
};

// Categories
export const categoriesApi = {
  list: (locale?: string) => fetchApi<{ success: boolean; categories: Category[] }>('/categories', { query: { locale } }),
};

// Reviews
export const reviewsApi = {
  listByProduct: (productId: string, query?: Query) =>
    fetchApi<{ success: boolean; reviews: Review[]; pagination: Pagination; stats: { average: number; count: number } }>(
      `/reviews/product/${productId}`,
      { query }
    ),
};

// Cart & Checkout
const cartHeaders = (sessionId?: string, token?: string) => {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (sessionId) (h as Record<string, string>)['X-Session-Id'] = sessionId;
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
};

export interface CartItem {
  product: Product & { _id: string };
  variant?: string;
  quantity: number;
}

export interface CartTotals {
  items: { productId: string; variantId?: string; sku: string; name: string; quantity: number; unitPrice: number; totalPrice: number; imageUrl?: string }[];
  subtotal: number;
  discount: number;
  afterDiscount: number;
  shippingCost: number;
  shippingOptions: { id: string; name: string; price: number; minDays?: number; maxDays?: number }[];
  total: number;
  couponCode?: string;
}

export interface CartResponse {
  _id: string;
  items: CartItem[];
  coupon?: { code: string } | null;
  subtotal: number;
  discount: number;
  afterDiscount: number;
  shippingCost: number;
  shippingOptions: CartTotals['shippingOptions'];
  total: number;
  couponCode?: string;
}

export const cartApi = {
  getOrCreate: (sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; cart: CartResponse }>('/cart', {
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  addItem: (cartId: string, productId: string, quantity?: number, variantId?: string, sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; cart: CartResponse }>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ cartId, productId, quantity: quantity ?? 1, variantId }),
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  updateItem: (cartId: string, itemIndex: number, quantity: number, sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; cart: CartResponse }>('/cart/items', {
      method: 'PATCH',
      body: JSON.stringify({ cartId, itemIndex, quantity }),
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  removeItem: (cartId: string, itemIndex: number, sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; cart: CartResponse }>(`/cart/items/${itemIndex}`, {
      method: 'DELETE',
      body: JSON.stringify({ cartId }),
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  applyCoupon: (cartId: string, code: string, sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; cart: CartResponse }>('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ cartId, code }),
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  removeCoupon: (cartId: string, sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; cart: CartResponse }>('/cart/coupon', {
      method: 'DELETE',
      body: JSON.stringify({ cartId }),
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  getTotals: (cartId: string, shippingOptionId?: string, sessionId?: string, token?: string) =>
    fetchApi<CartTotals & { success: boolean }>('/cart/totals', {
      method: 'GET',
      query: { cartId, shippingOptionId },
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
};

export interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  shippingAddress: Record<string, string>;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number; imageUrl?: string; sku?: string }[];
  createdAt?: string;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
}

export interface OrderStatusEvent {
  status: string;
  at: string;
  note?: string;
}

export interface TrackingEvent {
  date: string;
  location?: string;
  description?: string;
  status?: string;
}

export interface ShipmentWithTracking {
  _id: string;
  order: string;
  carrier: string;
  carrierService?: string;
  trackingNumber?: string;
  status: string;
  shippedAt?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  tracking?: {
    _id: string;
    events: TrackingEvent[];
    lastEventAt?: string;
    lastStatus?: string;
  } | null;
}

export interface OrderDetail extends Order {
  statusHistory?: OrderStatusEvent[];
  shipments?: ShipmentWithTracking[];
  returns?: OrderReturn[];
}

export interface OrderReturn {
  _id: string;
  order: string;
  returnNumber: string;
  status: string;
  reason?: string;
  customerComment?: string;
  adminNotes?: string;
  refundAmount?: number;
  refundedAt?: string;
  requestedAt?: string;
  processedAt?: string;
}

export const checkoutApi = {
  createOrder: (body: { cartId: string; shippingAddress: Record<string, string>; shippingOptionId?: string; notes?: string; guestEmail?: string; guestFirstName?: string; guestLastName?: string }, sessionId?: string, token?: string) =>
    fetchApi<{ success: boolean; order: Order }>('/checkout/order', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: cartHeaders(sessionId, token),
      credentials: 'include',
    }),
  createPayment: (orderId: string, provider: 'stripe' | 'coinbase' | 'twint', token?: string) =>
    fetchApi<{ success: boolean; clientSecret?: string; hostedUrl?: string; paymentUrl?: string }>('/checkout/payment', {
      method: 'POST',
      body: JSON.stringify({ orderId, provider }),
      headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' },
      credentials: 'include',
    }),
  getOrder: (orderNumber: string, token?: string) =>
    fetchApi<{ success: boolean; order: Order }>(`/checkout/order/${orderNumber}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    }),
};

const orderHeaders = (token?: string) => ({
  'Content-Type': 'application/json' as const,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const ordersApi = {
  listMyOrders: (params?: { page?: number; limit?: number }, token?: string) =>
    fetchApi<{ success: boolean; orders: Order[]; total: number; page: number; limit: number; totalPages: number }>('/orders', {
      query: params as Query,
      headers: orderHeaders(token),
      credentials: 'include',
    }),
  getMyOrder: (orderNumber: string, token?: string, guestEmail?: string) =>
    fetchApi<{ success: boolean; order: OrderDetail }>(
      `/orders/${encodeURIComponent(orderNumber)}${guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : ''}`,
      { headers: orderHeaders(token), credentials: 'include' }
    ),
  trackOrder: (orderNumber: string, email: string) =>
    fetchApi<{ success: boolean; order: OrderDetail }>('/orders/track', {
      query: { orderNumber, email },
      credentials: 'include',
    }),
};

const adminOrderHeaders = (token: string) => ({
  'Content-Type': 'application/json' as const,
  Authorization: `Bearer ${token}`,
});

export const adminOrdersApi = {
  list: (params?: { page?: number; limit?: number; status?: string }, token?: string) =>
    fetchApi<{
      success: boolean;
      orders: Order[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/admin/orders', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  get: (orderId: string, token?: string) =>
    fetchApi<{ success: boolean; order: OrderDetail & { returns?: OrderReturn[] } }>(
      `/admin/orders/${orderId}`,
      { headers: token ? adminOrderHeaders(token) : {}, credentials: 'include' }
    ),
  updateStatus: (orderId: string, status: string, note?: string, token?: string) =>
    fetchApi<{ success: boolean; order: Order }>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  addShipment: (
    orderId: string,
    body: { carrier?: string; carrierService?: string; trackingNumber?: string; estimatedDeliveryAt?: string; shippedAt?: string },
    token?: string
  ) =>
    fetchApi<{ success: boolean; shipment: ShipmentWithTracking }>(
      `/admin/orders/${orderId}/shipments`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: token ? adminOrderHeaders(token) : {},
        credentials: 'include',
      }
    ),
  cancel: (orderId: string, token?: string) =>
    fetchApi<{ success: boolean; order: Order }>(`/admin/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  refund: (orderId: string, amount?: number, token?: string) =>
    fetchApi<{ success: boolean; order: Order }>(`/admin/orders/${orderId}/refund`, {
      method: 'POST',
      body: JSON.stringify(amount != null ? { amount } : {}),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  listReturns: (orderId: string, token?: string) =>
    fetchApi<{ success: boolean; returns: OrderReturn[] }>(`/admin/orders/${orderId}/returns`, {
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  createReturn: (
    orderId: string,
    body: { reason?: string; customerComment?: string; items?: unknown[] },
    token?: string
  ) =>
    fetchApi<{ success: boolean; return: OrderReturn }>(`/admin/orders/${orderId}/returns`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  updateReturnStatus: (
    orderId: string,
    returnId: string,
    body: { status: string; adminNotes?: string; refundAmount?: number },
    token?: string
  ) =>
    fetchApi<{ success: boolean; return: OrderReturn }>(
      `/admin/orders/${orderId}/returns/${returnId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: token ? adminOrderHeaders(token) : {},
        credentials: 'include',
      }
    ),
};

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category?: { _id: string; name?: Record<string, string> } | string;
  categoryName?: string;
  images: { url: string; publicId?: string; alt?: Record<string, string>; order?: number }[];
  characteristics?: { key: string; value: unknown }[];
  variants?: { _id: string; sku: string; price: number; compareAtPrice?: number; stock: number }[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  totalStock?: number;
  sku?: string;
  inStock?: boolean;
  status?: string;
  isRefurbished?: boolean;
  warrantyMonths?: number;
  seo?: { metaTitle?: Record<string, string>; metaDescription?: Record<string, string> };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
}

export interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  userName: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
  status?: string;
  product?: { _id: string; name?: Record<string, string> };
}

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number | null;
  usedCount: number;
  maxUsesPerUser?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt?: string;
}

// Admin Dashboard
export const adminDashboardApi = {
  stats: (params?: { from?: string; to?: string }, token?: string) =>
    fetchApi<{
      success: boolean;
      revenue: number;
      ordersCount: number;
      productsSold: number;
      usersCount: number;
      reviewsCount: number;
      couponsCount: number;
      period: { from: string; to: string };
      dailyData: { _id: string; revenue: number; orders: number }[];
    }>('/admin/dashboard/stats', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  exportCsv: (params?: { from?: string; to?: string }, token?: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/dashboard/export${params?.from || params?.to ? `?from=${params.from || ''}&to=${params.to || ''}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    }),
  insights: (params?: { from?: string; to?: string }, token?: string) =>
    fetchApi<{ success: boolean; report: string; period: { from: string; to: string } }>('/admin/dashboard/insights', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
};

// Admin Users
export const adminUsersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isActive?: string }, token?: string) =>
    fetchApi<{ success: boolean; users: AdminUser[]; pagination: Pagination }>('/admin/users', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  get: (id: string, token?: string) =>
    fetchApi<{ success: boolean; user: AdminUser }>(`/admin/users/${id}`, {
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  update: (id: string, body: Partial<AdminUser>, token?: string) =>
    fetchApi<{ success: boolean; user: AdminUser }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  toggleActive: (id: string, token?: string) =>
    fetchApi<{ success: boolean; user: AdminUser }>(`/admin/users/${id}/toggle-active`, {
      method: 'POST',
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
};

// Admin Products (products/admin)
export const adminProductsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; category?: string }, token?: string) =>
    fetchApi<{ success: boolean; products: Product[]; pagination: Pagination }>('/products/admin', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  get: (id: string, token?: string) =>
    fetchApi<{ success: boolean; product: Product }>(`/products/admin/${id}`, {
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  create: (body: Record<string, unknown>, token?: string) =>
    fetchApi<{ success: boolean; product: Product }>('/products/admin', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  update: (id: string, body: Record<string, unknown>, token?: string) =>
    fetchApi<{ success: boolean; product: Product }>(`/products/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  updateStock: (id: string, body: { quantity: number; variantId?: string }, token?: string) =>
    fetchApi<{ success: boolean; product: Product }>(`/products/admin/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
};

// Génération IA description produit (admin)
export const aiProductDescriptionApi = {
  generate: (body: { name?: { fr?: string; en?: string; de?: string }; categoryName?: string }, token?: string) =>
    fetchApi<{
      success: boolean;
      description: { fr: string; en: string; de: string };
      shortDescription: { fr: string; en: string; de: string };
      seo: { metaTitle: { fr: string; en: string; de: string }; metaDescription: { fr: string; en: string; de: string } };
      bulletPoints: { fr: string[]; en: string[]; de: string[] };
    }>('/ai/product-description', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
};

// Admin Coupons
export const adminCouponsApi = {
  list: (params?: { page?: number; limit?: number; isActive?: string; search?: string }, token?: string) =>
    fetchApi<{ success: boolean; coupons: Coupon[]; pagination: Pagination }>('/admin/coupons', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  get: (id: string, token?: string) =>
    fetchApi<{ success: boolean; coupon: Coupon }>(`/admin/coupons/${id}`, {
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  create: (body: Partial<Coupon>, token?: string) =>
    fetchApi<{ success: boolean; coupon: Coupon }>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  update: (id: string, body: Partial<Coupon>, token?: string) =>
    fetchApi<{ success: boolean; coupon: Coupon }>(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  delete: (id: string, token?: string) =>
    fetchApi<{ success: boolean }>(`/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
};

// Admin Reviews
export const adminReviewsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; productId?: string }, token?: string) =>
    fetchApi<{ success: boolean; reviews: Review[]; pagination: Pagination }>('/reviews/admin', {
      query: params as Query,
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  setStatus: (id: string, status: 'approved' | 'rejected', token?: string) =>
    fetchApi<{ success: boolean; review: Review }>(`/reviews/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
  generateReply: (reviewId: string, params?: { locale?: string }, token?: string) =>
    fetchApi<{ success: boolean; reply: string }>(`/reviews/admin/${reviewId}/generate-reply`, {
      method: 'POST',
      body: JSON.stringify({ locale: params?.locale ?? 'fr' }),
      headers: token ? adminOrderHeaders(token) : {},
      credentials: 'include',
    }),
};
