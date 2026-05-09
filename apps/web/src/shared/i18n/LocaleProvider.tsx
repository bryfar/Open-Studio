'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AppLocale } from './types';
import { parseLocale, persistLocaleClient } from './locale-storage';
import { translate, type TranslationKey } from './ui-translations';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const fromStorage =
        typeof window !== 'undefined' ? parseLocale(window.localStorage.getItem('opencut:language')) : null;
      if (fromStorage && fromStorage !== initialLocale) {
        setLocaleState(fromStorage);
        persistLocaleClient(fromStorage);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [initialLocale]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setLocaleState(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('opencut:language', next);
        persistLocaleClient(next);
        router.refresh();
      }
    },
    [router]
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'opencut:language') return;
      const parsed = parseLocale(e.newValue);
      if (parsed) {
        setLocaleState(parsed);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = parsed;
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
