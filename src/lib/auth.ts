/**
 * Récupère le token d'accès (client-side).
 * À adapter selon votre stratégie (cookie, localStorage, contexte React).
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') ?? localStorage.getItem('auth_token');
}
