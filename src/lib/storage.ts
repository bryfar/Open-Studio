import { get, set, del } from 'idb-keyval';
import type { Project, MediaFile } from '@/types';
import { supabase } from '@/lib/supabase';

const PROJECT_KEY = 'motion-editor:project';
const MEDIA_KEY = 'motion-editor:media';
const PROJECT_INDEX_KEY = 'motion-editor:projects:index';
const PROJECT_PREFIX = 'motion-editor:project:';
const MEDIA_PREFIX = 'motion-editor:media:';
const LS_FALLBACK_PREFIX = 'motion-editor:ls:';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function fallbackKey(key: string): string {
  return `${LS_FALLBACK_PREFIX}${key}`;
}

async function safeSet<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch (error) {
    if (!isBrowser()) throw error;
    window.localStorage.setItem(fallbackKey(key), JSON.stringify(value));
  }
}

async function safeGet<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch {
    if (!isBrowser()) return undefined;
    const raw = window.localStorage.getItem(fallbackKey(key));
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
}

async function safeDel(key: string): Promise<void> {
  try {
    await del(key);
  } catch {
    if (!isBrowser()) return;
    window.localStorage.removeItem(fallbackKey(key));
  }
}

export interface SavedState {
  project: Project | null;
  mediaFiles: MediaFile[];
  updatedAt: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  duration: number;
  updatedAt: number;
  createdAt: number;
}

export async function saveEditorState(
  project: Project | null,
  mediaFiles: MediaFile[]
): Promise<void> {
  const snapshot: SavedState = {
    project: project ? structuredClone(project) : null,
    mediaFiles: structuredClone(mediaFiles),
    updatedAt: Date.now(),
  };
  await Promise.all([safeSet(PROJECT_KEY, snapshot.project), safeSet(MEDIA_KEY, snapshot.mediaFiles)]);
}

export async function loadEditorState(): Promise<SavedState | null> {
  const [project, mediaFiles] = await Promise.all([
    safeGet<Project | null>(PROJECT_KEY),
    safeGet<MediaFile[]>(MEDIA_KEY),
  ]);
  if (!project && !mediaFiles) return null;
  return {
    project: project ?? null,
    mediaFiles: mediaFiles ?? [],
    updatedAt: Date.now(),
  };
}

export async function clearEditorState(): Promise<void> {
  await Promise.all([safeDel(PROJECT_KEY), safeDel(MEDIA_KEY)]);
}

function readProjectIndexFromLocalStorage(): ProjectSummary[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(fallbackKey(PROJECT_INDEX_KEY));
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as ProjectSummary[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function readProjectIndexFromIdb(): Promise<ProjectSummary[]> {
  try {
    const v = await get<ProjectSummary[]>(PROJECT_INDEX_KEY);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const idbList = await readProjectIndexFromIdb();
  const lsList = readProjectIndexFromLocalStorage();
  const merged = [...idbList, ...lsList];
  const deduped = dedupeProjectSummaries(merged);
  const sorted = deduped.slice().sort((a, b) => b.updatedAt - a.updatedAt);

  const idbIds = new Set(
    idbList.map((p) => (typeof p.id === 'string' ? p.id.trim() : '')).filter(Boolean)
  );
  const lsHasIdsNotInIdb = lsList.some(
    (p) => typeof p.id === 'string' && p.id.trim() !== '' && !idbIds.has(p.id.trim())
  );
  const needsPersist = deduped.length < merged.length || lsHasIdsNotInIdb;
  if (needsPersist) {
    await writeProjectIndex(sorted);
  }
  return sorted;
}

async function writeProjectIndex(list: ProjectSummary[]): Promise<void> {
  const normalized = dedupeProjectSummaries(list).sort((a, b) => b.updatedAt - a.updatedAt);
  try {
    await set(PROJECT_INDEX_KEY, normalized);
    if (isBrowser()) {
      window.localStorage.removeItem(fallbackKey(PROJECT_INDEX_KEY));
    }
  } catch (error) {
    if (!isBrowser()) throw error;
    window.localStorage.setItem(fallbackKey(PROJECT_INDEX_KEY), JSON.stringify(normalized));
  }
}

/**
 * Una sola fila por id (trim). Si hay colisión, gana el updatedAt más reciente.
 * Exportado para que la UI pueda normalizar estado aunque venga duplicado.
 */
export function normalizeProjectSummaries(list: ProjectSummary[]): ProjectSummary[] {
  return dedupeProjectSummaries(list);
}

function dedupeProjectSummaries(list: ProjectSummary[]): ProjectSummary[] {
  const byId = new Map<string, ProjectSummary>();
  for (const p of list) {
    if (!p || typeof p.id !== 'string') continue;
    const id = p.id.trim();
    if (!id) continue;
    const row: ProjectSummary = { ...p, id };
    const prev = byId.get(id);
    if (!prev || row.updatedAt >= prev.updatedAt) {
      byId.set(id, row);
    }
  }
  return Array.from(byId.values());
}

function summaryFromProject(project: Project, createdAt?: number): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    width: project.width,
    height: project.height,
    duration: project.duration,
    updatedAt: Date.now(),
    createdAt: createdAt ?? Date.now(),
  };
}

export async function saveProjectSnapshot(
  projectId: string,
  project: Project | null,
  mediaFiles: MediaFile[]
): Promise<void> {
  if (!project) return;
  const projectKey = `${PROJECT_PREFIX}${projectId}`;
  const mediaKey = `${MEDIA_PREFIX}${projectId}`;
  await Promise.all([
    safeSet(projectKey, structuredClone(project)),
    safeSet(mediaKey, structuredClone(mediaFiles)),
  ]);

  const list = await listProjects();
  const pid = projectId.trim();
  const existing = list.find((p) => p.id.trim() === pid);
  const nextSummary = summaryFromProject(project, existing?.createdAt);
  const next = [...list.filter((p) => p.id.trim() !== pid), nextSummary];
  await writeProjectIndex(next);
}

export async function loadProjectSnapshot(projectId: string): Promise<SavedState | null> {
  const projectKey = `${PROJECT_PREFIX}${projectId}`;
  const mediaKey = `${MEDIA_PREFIX}${projectId}`;
  const [project, mediaFiles] = await Promise.all([
    safeGet<Project | null>(projectKey),
    safeGet<MediaFile[]>(mediaKey),
  ]);
  if (!project && !mediaFiles) return null;
  return {
    project: project ?? null,
    mediaFiles: mediaFiles ?? [],
    updatedAt: Date.now(),
  };
}

export async function renameProject(projectId: string, name: string): Promise<void> {
  const state = await loadProjectSnapshot(projectId);
  if (!state?.project) return;
  state.project.name = name;
  await saveProjectSnapshot(projectId, state.project, state.mediaFiles);
}

export async function deleteProject(projectId: string): Promise<void> {
  await Promise.all([safeDel(`${PROJECT_PREFIX}${projectId}`), safeDel(`${MEDIA_PREFIX}${projectId}`)]);
  const list = await listProjects();
  const pid = projectId.trim();
  await writeProjectIndex(list.filter((p) => p.id.trim() !== pid));
}

type SaveCloudArgs =
  | [project: Project | null, mediaFiles: MediaFile[]]
  | [userId: string, project: Project | null, mediaFiles: MediaFile[]];

export async function saveEditorStateCloud(...args: SaveCloudArgs): Promise<void> {
  const hasUserId = typeof args[0] === 'string';
  const userId = hasUserId ? (args[0] as string) : null;
  const project = (hasUserId ? args[1] : args[0]) as Project | null;
  const mediaFiles = (hasUserId ? args[2] : args[1]) as MediaFile[];

  if (!supabase || !userId) {
    await saveEditorState(project, mediaFiles);
    return;
  }

  const payload: SavedState = {
    project: project ? structuredClone(project) : null,
    mediaFiles: structuredClone(mediaFiles),
    updatedAt: Date.now(),
  };

  const { error } = await supabase.from('editor_states').upsert(
    {
      user_id: userId,
      state: payload,
      updated_at: new Date(payload.updatedAt).toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    await saveEditorState(project, mediaFiles);
  }
}

export async function loadEditorStateCloud(userId?: string): Promise<SavedState | null> {
  if (!supabase || !userId) {
    return loadEditorState();
  }

  const { data, error } = await supabase
    .from('editor_states')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.state) {
    return loadEditorState();
  }

  const state = data.state as Partial<SavedState>;
  return {
    project: (state.project as Project | null) ?? null,
    mediaFiles: (state.mediaFiles as MediaFile[]) ?? [],
    updatedAt: typeof state.updatedAt === 'number' ? state.updatedAt : Date.now(),
  };
}

