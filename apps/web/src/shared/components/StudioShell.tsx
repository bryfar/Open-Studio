'use client';

/* eslint-disable @next/next/no-img-element -- logotipo local y avatares opcionales (URL externa) */
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Clapperboard, Cloud, Home, Monitor, Plus, RefreshCw, Settings, Sparkles, User } from 'lucide-react';
import { getDesktopBridge, isDesktopRuntime, resolveWebAccountLoginUrl } from '@/shared/platform/desktop';
import { useLocale } from '@/shared/i18n';
import { cn } from '@/shared/utils';

export type StudioShellActiveNav = 'dashboard' | 'clip-generator' | 'ai-shorts';

const navBtn =
  'w-full rounded-md text-left px-[10px] py-[8px] text-xs flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]';

export type StudioShellSidebarProfile = {
  displayName?: string;
  avatarUrl?: string | null;
  /** Texto bajo el nombre (p. ej. configuración de usuario). Por defecto «Configuración de usuario». */
  userConfigLabel?: string;
  /** Si se define, «Ajustes» va dentro de la tarjeta de perfil, debajo de la etiqueta de configuración. */
  onOpenSettings?: () => void;
  /** Escritorio: al pulsar «Sincronizar ahora» en el menú de cuenta (opcional). */
  onDesktopAccountSync?: () => void;
};

type StudioShellProps = {
  activeNav: StudioShellActiveNav;
  /** Perfil en la base del sidebar (avatar y nombre). Por defecto usuario local. */
  sidebarProfile?: StudioShellSidebarProfile;
  /** Pie del sidebar (p. ej. Novedades y Ajustes en el dashboard). */
  sidebarFooter?: ReactNode;
  children: ReactNode;
};

const defaultProfile: StudioShellSidebarProfile = {
  avatarUrl: null,
};

export function StudioShell({ activeNav, sidebarProfile, sidebarFooter, children }: StudioShellProps) {
  const router = useRouter();
  const { t } = useLocale();
  const profile = { ...defaultProfile, ...sidebarProfile };
  const displayName = profile.displayName ?? t('profile.localUser');
  const userConfigLabel = profile.userConfigLabel ?? t('profile.userConfig');
  const [desktopClient, setDesktopClient] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const accountCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setDesktopClient(isDesktopRuntime());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = accountCardRef.current;
      if (el && !el.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [accountMenuOpen]);

  async function openWebLoginInSystemBrowser() {
    const url = resolveWebAccountLoginUrl();
    const bridge = getDesktopBridge();
    if (typeof bridge?.openExternal === 'function') {
      const res = await bridge.openExternal(url);
      if (!res?.ok) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
    setAccountMenuOpen(false);
  }

  function openWebLoginInAppWindow() {
    router.push('/login');
    setAccountMenuOpen(false);
  }

  function handleDesktopSyncNow() {
    profile.onDesktopAccountSync?.();
    setSyncNote(t('studioShell.syncNote'));
    window.setTimeout(() => setSyncNote(null), 6500);
    setAccountMenuOpen(false);
  }

  const topBannerText = desktopClient ? t('studioShell.bannerDesktop') : t('studioShell.bannerWeb');

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--os-text-primary)]">
      <div className="flex h-8 shrink-0 items-center justify-center border-b border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 text-[11px] text-[var(--os-text-secondary)]">
        <span className="truncate" title={topBannerText}>
          {topBannerText}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-row">
        <aside
          className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] p-3"
          aria-label={t('studioShell.navMainAria')}
        >
          <div className="mb-[18px] mt-[10px] w-full min-w-0 px-[4px] text-center align-middle">
            <img
              src="/logotipo.svg?v=3"
              alt="Open Studio"
              className="block h-auto max-h-12 w-full max-w-full object-contain object-left"
            />
          </div>
          <div className="mt-4 space-y-1">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className={cn(
                navBtn,
                activeNav === 'dashboard'
                  ? 'h-fit bg-[var(--os-bg-hover)] font-medium text-[var(--os-text-primary)]'
                  : 'h-8 text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
              )}
            >
              <Home size={14} aria-hidden /> {t('studioShell.home')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/clip-generator')}
              className={cn(
                navBtn,
                activeNav === 'clip-generator'
                  ? 'h-fit bg-[var(--os-bg-hover)] font-medium text-[var(--os-text-primary)]'
                  : 'h-8 text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
              )}
            >
              <Clapperboard size={14} aria-hidden /> {t('studioShell.clipGenerator')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/ai-shorts')}
              className={cn(
                navBtn,
                activeNav === 'ai-shorts'
                  ? 'h-fit bg-[var(--os-bg-hover)] font-medium text-[var(--os-text-primary)]'
                  : 'h-8 text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
              )}
            >
              <Sparkles size={14} aria-hidden /> {t('studioShell.aiShorts')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/editor')}
              className={cn(navBtn, 'h-8 text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]')}
            >
              <Plus size={14} aria-hidden /> {t('studioShell.quickEditor')}
            </button>
          </div>

          <div className="mt-auto flex min-w-0 flex-col gap-3 border-t border-[var(--os-border-default)] pt-3">
            {sidebarFooter ? <div className="text-xs text-[var(--os-text-secondary)]">{sidebarFooter}</div> : null}
            <div
              ref={accountCardRef}
              className="relative flex min-w-0 flex-col gap-2 rounded-lg border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)]/80 px-2 py-[8px]"
            >
              {desktopClient ? (
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className="flex w-full min-w-0 flex-col gap-2 rounded-md text-left outline-none transition-colors hover:bg-[var(--os-bg-hover)]/60 focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label={t('studioShell.accountMenuAria')}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[var(--os-border-default)]"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--os-surface-1)] ring-1 ring-[var(--os-border-default)] text-[var(--os-text-secondary)]"
                        aria-hidden
                      >
                        <User size={16} strokeWidth={2} />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--os-text-primary)]">
                      {displayName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'shrink-0 text-[var(--os-text-muted)] transition-transform',
                        accountMenuOpen && 'rotate-180'
                      )}
                      aria-hidden
                    />
                  </div>
                  <p className="text-[10px] leading-snug text-[var(--os-text-muted)] pl-[calc(2.25rem+0.625rem)]">
                    {userConfigLabel} · {t('profile.tapAccountHint')}
                  </p>
                </button>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-2.5">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={displayName}
                        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[var(--os-border-default)]"
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--os-surface-1)] ring-1 ring-[var(--os-border-default)] text-[var(--os-text-secondary)]"
                        aria-hidden
                      >
                        <User size={16} strokeWidth={2} />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-left text-xs font-medium text-[var(--os-text-primary)]">
                      {displayName}
                    </span>
                  </div>
                  <p className="text-[10px] leading-snug text-[var(--os-text-muted)] pl-[calc(2.25rem+0.625rem)]">
                    {userConfigLabel}
                  </p>
                </>
              )}

              {desktopClient && accountMenuOpen ? (
                <div
                  className="absolute bottom-full left-0 right-0 z-30 mb-1 flex flex-col gap-1 rounded-lg border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-1.5 shadow-lg ring-1 ring-black/20"
                  role="menu"
                  aria-label={t('studioShell.desktopMenuTitle')}
                >
                  <p className="px-1.5 py-1 text-[10px] leading-snug text-[var(--os-text-muted)]">
                    {t('studioShell.desktopMenuHelp')}
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void openWebLoginInSystemBrowser()}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-medium text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]"
                  >
                    <Cloud size={14} className="shrink-0 text-[var(--os-text-secondary)]" aria-hidden />
                    {t('studioShell.openWebLoginBrowser')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openWebLoginInAppWindow}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-medium text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]"
                  >
                    <Monitor size={14} className="shrink-0 text-[var(--os-text-secondary)]" aria-hidden />
                    {t('studioShell.openWebLoginWindow')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDesktopSyncNow}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-medium text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]"
                  >
                    <RefreshCw size={14} className="shrink-0 text-[var(--os-text-secondary)]" aria-hidden />
                    {t('studioShell.syncNow')}
                  </button>
                </div>
              ) : null}

              {syncNote ? (
                <p className="rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-1.5 text-[10px] leading-snug text-[var(--os-text-secondary)]">
                  {syncNote}
                </p>
              ) : null}

              {profile.onOpenSettings ? (
                <button
                  type="button"
                  onClick={profile.onOpenSettings}
                  className="flex w-full items-center gap-2 rounded-md border border-[var(--os-border-default)]/80 bg-[var(--os-surface-1)] px-2 py-1.5 text-left text-[11px] font-medium text-[var(--os-text-primary)] hover:border-[var(--os-border-strong)] hover:bg-[var(--os-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]"
                >
                  <Settings size={13} strokeWidth={2} className="shrink-0 text-[var(--os-text-secondary)]" aria-hidden />
                  {t('studioShell.settings')}
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-auto p-6" aria-label={t('studioShell.mainAria')}>
          {children}
        </section>
      </div>
    </main>
  );
}

export function StudioShellFooterNav({ onNews }: { onNews: () => void }) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onNews}
      className="flex w-full items-center gap-2 rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-2 py-2 text-left text-xs font-medium text-[var(--os-text-primary)] hover:border-[var(--os-border-strong)] hover:bg-[var(--os-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:shadow-[var(--os-focus-ring)]"
    >
      <Bell size={14} strokeWidth={2} className="shrink-0 text-[var(--os-text-secondary)]" aria-hidden />
      {t('studioShell.news')}
    </button>
  );
}
