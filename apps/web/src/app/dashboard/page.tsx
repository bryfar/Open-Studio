import dynamic from 'next/dynamic';

/** Code-split: el dashboard arrastra el diálogo de proyecto (cadena del editor); carga aparte para evitar ChunkLoadError por timeout. */
const DashboardPage = dynamic(() => import('./DashboardPageClient'), {
  loading: () => (
    <div className="flex min-h-[50vh] w-full items-center justify-center bg-[var(--bg-primary)] px-4 text-sm text-[var(--os-text-secondary)]">
      Loading…
    </div>
  ),
});

// Server default export avoids Next.js 16 async `params` / `searchParams` on client pages.
export default async function DashboardRoutePage() {
  return <DashboardPage />;
}
