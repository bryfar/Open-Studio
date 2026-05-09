import type { AppLocale } from './types';

export const LOCALE_COOKIE_NAME = 'opencut-language';

export function parseLocale(raw: string | undefined | null): AppLocale | null {
  if (raw === 'en' || raw === 'es') return raw;
  return null;
}

/** Persiste idioma para SSR (`html lang`) y almacenamiento local. Solo en cliente. */
export function persistLocaleClient(locale: AppLocale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
