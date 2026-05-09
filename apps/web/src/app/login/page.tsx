import LoginPage from './LoginPageClient';

// Server default export avoids Next.js 16 async `params` / `searchParams` on client pages.
export default async function LoginRoutePage() {
  return <LoginPage />;
}
