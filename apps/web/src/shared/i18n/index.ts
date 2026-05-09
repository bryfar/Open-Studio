import type { AppLocale } from './types';

export type { AppLocale } from './types';
/** @deprecated Use AppLocale */
export type Locale = AppLocale;

export { LocaleProvider, useLocale } from './LocaleProvider';
export { translate, type TranslationKey } from './ui-translations';
export { LOCALE_COOKIE_NAME, parseLocale, persistLocaleClient } from './locale-storage';

const legacyMessages = {
  en: {
    export: 'Export',
    exporting: 'Exporting...',
    save: 'Save',
    saving: 'Saving...',
    cloudSave: 'Cloud Save',
    cloudLoad: 'Cloud Load',
  },
  es: {
    export: 'Exportar',
    exporting: 'Exportando...',
    save: 'Guardar',
    saving: 'Guardando...',
    cloudSave: 'Guardar nube',
    cloudLoad: 'Cargar nube',
  },
} as const;

/** Idioma por defecto del servidor (env). Para UI reactiva usa `useLocale()`. */
export function getLocale(): AppLocale {
  const value = process.env.NEXT_PUBLIC_LOCALE;
  if (value === 'es') return 'es';
  return 'en';
}

/** Etiquetas legacy (export / guardado en nube). Prefer `useLocale().t` para UI nueva. */
export function t(key: keyof (typeof legacyMessages)['en']): string {
  const locale = getLocale();
  return legacyMessages[locale][key];
}
