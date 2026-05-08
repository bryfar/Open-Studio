'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const editorLoading = (
  <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
    <div className="h-8 w-8 animate-pulse rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)]" />
  </div>
);

const Editor = dynamic(
  () => import('@/features/editor/components').then((mod) => ({ default: mod.Editor })),
  { ssr: false, loading: () => editorLoading }
);

function EditorPageContent() {
  const params = useSearchParams();
  const projectId = params.get('projectId') ?? undefined;
  const mode = params.get('mode') ?? undefined;
  return <Editor projectId={projectId} mode={mode} />;
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
          <div className="h-8 w-8 animate-pulse rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)]" />
        </div>
      }
    >
      <EditorPageContent />
    </Suspense>
  );
}
