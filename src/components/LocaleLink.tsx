'use client';

import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

type LocaleLinkProps = React.ComponentProps<typeof Link>;

export function LocaleLink({ href, ...rest }: LocaleLinkProps) {
  const locale = useLocale();
  const path = typeof href === 'string' ? href : href.pathname ?? '/';
  const localizedHref = path.startsWith('http') || path.startsWith('//') ? href : `/${locale}${path === '/' ? '' : path}`;
  return <Link href={localizedHref} {...rest} />;
}
