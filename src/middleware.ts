import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale, COOKIE_LOCALE, COOKIE_MAX_AGE } from '@/i18n/config';

const localePrefix = `/(${locales.join('|')})`;

function getLocaleFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_LOCALE}=([^;]+)`));
  const value = match?.[1]?.trim();
  return value && isValidLocale(value) ? value : null;
}

function getLocaleFromAcceptLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage) return defaultLocale;
  const parts = acceptLanguage.split(',').map((s) => {
    const [code, q = 'q=1'] = s.trim().split(';');
    const lang = code.split('-')[0].toLowerCase();
    const weight = parseFloat(q.replace(/q=/, '')) || 1;
    return { lang, weight };
  });
  parts.sort((a, b) => b.weight - a.weight);
  for (const { lang } of parts) {
    if (lang === 'fr' || lang === 'en' || lang === 'de') return lang;
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isLocalePath = new RegExp(`^${localePrefix}(/|$)`).test(pathname);
  if (isLocalePath) {
    const locale = pathname.slice(1).split('/')[0];
    const response = NextResponse.next();
    response.cookies.set(COOKIE_LOCALE, locale, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return response;
  }

  const locale =
    getLocaleFromCookie(request.cookies.get(COOKIE_LOCALE)?.value ?? null) ??
    getLocaleFromAcceptLanguage(request.headers.get('accept-language'));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)',
  ],
};
