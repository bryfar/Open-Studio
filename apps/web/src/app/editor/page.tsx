import EditorPage from './EditorPageClient';

// Server default export avoids Next.js 16 async `params` / `searchParams` on client pages.
export default async function EditorRoutePage() {
  return <EditorPage />;
}
