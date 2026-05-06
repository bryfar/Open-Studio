export type Locale = 'en' | 'es';

const messages = {
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

export function getLocale(): Locale {
  const value = process.env.NEXT_PUBLIC_LOCALE;
  if (value === 'es') return 'es';
  return 'en';
}

export function t(key: keyof (typeof messages)['en']): string {
  const locale = getLocale();
  return messages[locale][key];
}
