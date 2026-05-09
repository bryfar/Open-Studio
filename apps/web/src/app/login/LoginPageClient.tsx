'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Input } from '@/shared/components/ui';
import { cn } from '@/shared/utils';

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/dashboard';
    }, 800);
  };

  const labelClass =
    'mb-2 block text-[length:var(--os-text-sm)] font-medium text-[var(--os-text-primary)]';

  return (
    <div className="flex min-h-screen w-full bg-[var(--os-canvas-bg)] text-[var(--os-text-primary)]">
      {/* Panel izquierdo: marca y claim */}
      <aside className="relative hidden w-1/2 flex-col justify-between border-r border-[var(--os-border-default)] bg-[var(--os-bg-subtle)] p-10 md:flex lg:p-14">
        <Link href="/" className="inline-flex items-center gap-3 outline-none focus-visible:shadow-[var(--os-focus-ring)] rounded-sm">
          <Image
            src="/logotipo.svg"
            alt="Open Studio"
            width={180}
            height={34}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <p className="max-w-sm text-pretty font-[family-name:var(--font-inter)] text-lg leading-snug text-[var(--os-text-primary)] md:text-xl">
          Editor de video en el navegador, con línea de tiempo multitrack y exportación. Código abierto.
        </p>
      </aside>

      {/* Panel derecho: formulario */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex flex-col items-center text-center md:hidden">
            <Link href="/" className="mb-6 outline-none focus-visible:shadow-[var(--os-focus-ring)] rounded-sm">
              <Image
                src="/logotipo.svg"
                alt="Open Studio"
                width={160}
                height={30}
                priority
                className="h-7 w-auto"
              />
            </Link>
          </div>

          <div className="mb-8 hidden flex-col items-center text-center md:flex">
            <Image
              src="/logotipo.svg"
              alt=""
              width={140}
              height={26}
              className="mb-6 h-6 w-auto opacity-90"
              aria-hidden
            />
            <h1 className="font-[family-name:var(--font-inter)] text-2xl font-semibold tracking-tight text-[var(--os-text-primary)] sm:text-3xl">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-[var(--os-text-muted)]">
              Introduce tu correo y contraseña para acceder
            </p>
          </div>

          <div className="mb-8 md:hidden">
            <h1 className="text-center font-[family-name:var(--font-inter)] text-2xl font-semibold tracking-tight">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-center text-sm text-[var(--os-text-muted)]">
              Introduce tu correo y contraseña para acceder
            </p>
          </div>

          <button
            type="button"
            className={cn(
              'mb-6 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--os-button-radius)] border border-[var(--os-border-default)]',
              'bg-transparent font-medium text-[var(--os-text-primary)] transition-colors duration-[var(--os-duration-fast)]',
              'hover:bg-[var(--os-bg-hover)] outline-none focus-visible:shadow-[var(--os-focus-ring)]'
            )}
          >
            <GitHubMark className="h-5 w-5 shrink-0" />
            Continuar con GitHub
          </button>

          <p className="mb-6 text-center text-xs text-[var(--os-text-muted)]">O inicia sesión con correo</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Correo
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor="login-password" className={cn(labelClass, 'mb-0')}>
                  Contraseña
                </label>
                <Link
                  href="#"
                  className="text-xs text-[var(--os-text-secondary)] underline underline-offset-2 outline-none hover:text-[var(--os-text-primary)] focus-visible:shadow-[var(--os-focus-ring)] rounded-sm"
                >
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[var(--os-text-muted)] outline-none transition-colors hover:text-[var(--os-text-primary)] focus-visible:shadow-[var(--os-focus-ring)]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="h-11 w-full rounded-[var(--os-button-radius)] text-[13px] font-semibold"
            >
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--os-text-inverse)]/30 border-t-[var(--os-text-inverse)]" />
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          <div className="mt-10 flex flex-col gap-4 border-t border-[var(--os-border-default)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-[var(--os-text-muted)] sm:text-left">
              ¿No tienes cuenta?{' '}
              <Link
                href="#"
                className="font-medium text-[var(--os-text-primary)] underline underline-offset-2 outline-none focus-visible:shadow-[var(--os-focus-ring)] rounded-sm"
              >
                Registrarse
              </Link>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
              <span className="text-xs text-[var(--os-text-muted)]">Ayuda</span>
              <a
                href="https://github.com/bryfar/Open-Studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--os-text-secondary)] transition-colors hover:text-[var(--os-text-primary)] outline-none focus-visible:shadow-[var(--os-focus-ring)] rounded-sm"
                aria-label="Open Studio en GitHub"
              >
                <GitHubMark className="h-4 w-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--os-text-secondary)] transition-colors hover:text-[var(--os-text-primary)] outline-none focus-visible:shadow-[var(--os-focus-ring)] rounded-sm"
                aria-label="X"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--os-text-secondary)] transition-colors hover:text-[var(--os-text-primary)] outline-none focus-visible:shadow-[var(--os-focus-ring)] rounded-sm"
                aria-label="Discord"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
