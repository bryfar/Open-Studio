import DashboardPage from './DashboardPageClient';

// Server default export avoids Next.js 16 async `params` / `searchParams` on client pages.
export default async function DashboardRoutePage() {
  return <DashboardPage />;
}
