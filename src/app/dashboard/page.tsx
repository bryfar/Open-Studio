'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import {
  deleteProject,
  listProjects,
  normalizeProjectSummaries,
  renameProject,
  saveProjectSnapshot,
  type ProjectSummary,
} from '@/lib/storage';
import {
  Bell,
  BellRing,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Globe,
  HardDrive,
  Home,
  Megaphone,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Project } from '@/types';
import { generateId } from '@/lib/utils';

interface WorkspaceItem {
  id: string;
  name: string;
  createdAt: number;
}

const WORKSPACES_KEY = 'opencut:workspaces';
const WORKSPACE_ASSIGNMENTS_KEY = 'opencut:workspaceAssignments';
const DEFAULT_WORKSPACE_ID = 'all';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showNewsPanel, setShowNewsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'editor' | 'privacy'>('general');
  const [newsTab, setNewsTab] = useState<'feed' | 'changelog'>('feed');
  const [notificationDesktop, setNotificationDesktop] = useState(true);
  const [notificationProductUpdates, setNotificationProductUpdates] = useState(true);
  const [notificationSecurity, setNotificationSecurity] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [autoOpenEditorAfterCreate, setAutoOpenEditorAfterCreate] = useState(true);
  const [compactProjectCards, setCompactProjectCards] = useState(false);
  const [rememberLastSearch, setRememberLastSearch] = useState(true);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [defaultLanguage, setDefaultLanguage] = useState<'es' | 'en'>('es');
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([
    { id: DEFAULT_WORKSPACE_ID, name: 'All projects', createdAt: Date.now() },
  ]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [workspaceAssignments, setWorkspaceAssignments] = useState<Record<string, string>>({});
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'modified-desc' | 'modified-asc' | 'name-asc' | 'name-desc'>(
    'modified-desc'
  );
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list'>('grid');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameTitleId = useId();

  const filteredProjects = useMemo(() => {
    const filtered = projects
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .filter((p) => {
        if (selectedWorkspaceId === DEFAULT_WORKSPACE_ID) return true;
        return workspaceAssignments[p.id] === selectedWorkspaceId;
      });
    const normalized = normalizeProjectSummaries(filtered);
    return normalized.sort((a, b) => {
      switch (sortMode) {
        case 'modified-asc':
          return a.updatedAt - b.updatedAt;
        case 'name-asc':
          return a.name.localeCompare(b.name, 'es');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'es');
        case 'modified-desc':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [projects, search, selectedWorkspaceId, workspaceAssignments, sortMode]);

  const allVisibleSelected =
    filteredProjects.length > 0 && filteredProjects.every((project) => selectedProjectIds.includes(project.id));

  const userProfile = useMemo(() => {
    const total = projects.length;
    const totalDuration = projects.reduce((acc, p) => acc + p.duration, 0);
    const latest = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return {
      name: 'Bryan',
      plan: 'Creator',
      totalProjects: total,
      totalMinutes: Math.round(totalDuration / 60),
      lastProject: latest?.name ?? 'Sin actividad reciente',
    };
  }, [projects]);

  async function refresh() {
    try {
      const data = await listProjects();
      setProjects(normalizeProjectSummaries(data));
    } catch (error) {
      console.error('Error loading projects', error);
      setToast({
        type: 'error',
        message: 'No se pudieron cargar proyectos. Revisa permisos de almacenamiento del navegador.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((data) => {
        if (!cancelled) setProjects(normalizeProjectSummaries(data));
      })
      .catch((error) => {
        console.error('Error loading projects', error);
        if (!cancelled) {
          setToast({
            type: 'error',
            message:
              'No se pudieron cargar proyectos. Revisa permisos de almacenamiento del navegador.',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = window.localStorage.getItem('opencut:onboarding:done');
    if (!done) queueMicrotask(() => setShowOnboarding(true));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.localStorage.getItem('opencut:prefersReducedMotion');
    const autoOpen = window.localStorage.getItem('opencut:autoOpenEditorAfterCreate');
    const compactCards = window.localStorage.getItem('opencut:compactProjectCards');
    const rememberSearch = window.localStorage.getItem('opencut:rememberLastSearch');
    const telemetry = window.localStorage.getItem('opencut:telemetryEnabled');
    const lang = window.localStorage.getItem('opencut:language');
    const savedSearch = window.localStorage.getItem('opencut:lastSearch');
    const notifyDesktop = window.localStorage.getItem('opencut:notifyDesktop');
    const notifyProduct = window.localStorage.getItem('opencut:notifyProductUpdates');
    const notifySecurity = window.localStorage.getItem('opencut:notifySecurity');
    if (reducedMotion !== null) {
      queueMicrotask(() => setPrefersReducedMotion(reducedMotion === '1'));
    }
    if (autoOpen !== null) {
      queueMicrotask(() => setAutoOpenEditorAfterCreate(autoOpen === '1'));
    }
    if (compactCards !== null) {
      queueMicrotask(() => setCompactProjectCards(compactCards === '1'));
    }
    if (rememberSearch !== null) {
      queueMicrotask(() => setRememberLastSearch(rememberSearch === '1'));
    }
    if (telemetry !== null) {
      queueMicrotask(() => setTelemetryEnabled(telemetry === '1'));
    }
    if (lang === 'en' || lang === 'es') {
      queueMicrotask(() => setDefaultLanguage(lang));
    }
    if (notifyDesktop !== null) {
      queueMicrotask(() => setNotificationDesktop(notifyDesktop === '1'));
    }
    if (notifyProduct !== null) {
      queueMicrotask(() => setNotificationProductUpdates(notifyProduct === '1'));
    }
    if (notifySecurity !== null) {
      queueMicrotask(() => setNotificationSecurity(notifySecurity === '1'));
    }
    if (savedSearch) {
      queueMicrotask(() => setSearch(savedSearch));
    }
    const savedWorkspaces = window.localStorage.getItem(WORKSPACES_KEY);
    const savedAssignments = window.localStorage.getItem(WORKSPACE_ASSIGNMENTS_KEY);
    if (savedWorkspaces) {
      try {
        const parsed = JSON.parse(savedWorkspaces) as WorkspaceItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.some((w) => w.id === DEFAULT_WORKSPACE_ID)
            ? parsed
            : [{ id: DEFAULT_WORKSPACE_ID, name: 'All projects', createdAt: Date.now() }, ...parsed];
          queueMicrotask(() => setWorkspaces(normalized));
        }
      } catch {
        // ignore invalid workspace payload
      }
    }
    if (savedAssignments) {
      try {
        const parsed = JSON.parse(savedAssignments) as Record<string, string>;
        if (parsed && typeof parsed === 'object') {
          queueMicrotask(() => setWorkspaceAssignments(parsed));
        }
      } catch {
        // ignore invalid mapping payload
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (rememberLastSearch) {
      window.localStorage.setItem('opencut:lastSearch', search);
    }
  }, [rememberLastSearch, search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACE_ASSIGNMENTS_KEY, JSON.stringify(workspaceAssignments));
  }, [workspaceAssignments]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!renameOpen) return;
    const t = window.requestAnimationFrame(() => renameInputRef.current?.focus());
    return () => window.cancelAnimationFrame(t);
  }, [renameOpen]);

  const onboardingSteps = [
    {
      title: 'Bienvenido a Open Studio',
      description:
        'Editor de video con foco en privacidad, rapidez y herramientas de creación.',
    },
    {
      title: 'Dashboard de proyectos',
      description:
        'Crea, renombra, elimina y abre proyectos desde un solo lugar. Al crear, configuras primero formato y plantilla.',
    },
    {
      title: 'Editor modular',
      description:
        'Explora secciones de multimedia, efectos, transiciones, filtros, subtítulos y recursos avanzados.',
    },
    {
      title: 'Listo para empezar',
      description:
        'Usa «Nuevo proyecto» para elegir nombre, formato, FPS y plantilla o lienzo en blanco.',
    },
  ];

  async function handleCreateProject(project: Project) {
    await saveProjectSnapshot(project.id, project, []);
    setToast({ type: 'success', message: 'Proyecto creado correctamente.' });
    if (autoOpenEditorAfterCreate) {
      router.push(`/editor?projectId=${project.id}`);
      return;
    }
    await refresh();
  }

  async function openProject(projectId: string) {
    try {
      setToast({ type: 'success', message: 'Abriendo proyecto…' });
      router.push(`/editor?projectId=${projectId}`);
    } catch (error) {
      console.error('No se pudo abrir snapshot.', error);
      setToast({
        type: 'error',
        message: 'No se pudo abrir el proyecto.',
      });
    }
  }

  function openRename(projectId: string, currentName: string) {
    setRenameTarget({ id: projectId, name: currentName });
    setRenameValue(currentName);
    setRenameOpen(true);
  }

  async function submitRename() {
    if (!renameTarget) return;
    const next = renameValue.trim();
    if (!next) {
      setToast({ type: 'error', message: 'El nombre no puede estar vacío.' });
      return;
    }
    await renameProject(renameTarget.id, next);
    setRenameOpen(false);
    setRenameTarget(null);
    await refresh();
    setToast({ type: 'success', message: 'Nombre actualizado.' });
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    await deleteProject(deleteConfirmId);
    setWorkspaceAssignments((prev) => {
      const next = { ...prev };
      delete next[deleteConfirmId];
      return next;
    });
    setDeleteConfirmId(null);
    await refresh();
    setToast({ type: 'success', message: 'Proyecto eliminado.' });
  }

  function handleCreateWorkspace() {
    const nextName = newWorkspaceName.trim();
    if (!nextName) {
      setToast({ type: 'error', message: 'Escribe un nombre para el espacio de trabajo.' });
      return;
    }
    const alreadyExists = workspaces.some(
      (workspace) => workspace.name.trim().toLowerCase() === nextName.toLowerCase()
    );
    if (alreadyExists) {
      setToast({ type: 'error', message: 'Ya existe un espacio con ese nombre.' });
      return;
    }
    const created: WorkspaceItem = {
      id: `ws_${generateId()}`,
      name: nextName,
      createdAt: Date.now(),
    };
    setWorkspaces((prev) => [...prev, created]);
    setSelectedWorkspaceId(created.id);
    setNewWorkspaceName('');
    setToast({ type: 'success', message: 'Espacio de trabajo creado.' });
  }

  function assignProjectToWorkspace(projectId: string, workspaceId: string) {
    setWorkspaceAssignments((prev) => ({
      ...prev,
      [projectId]: workspaceId,
    }));
  }

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  }

  function toggleSelectAllVisibleProjects() {
    if (filteredProjects.length === 0) return;
    if (allVisibleSelected) {
      setSelectedProjectIds((prev) => prev.filter((id) => !filteredProjects.some((p) => p.id === id)));
      return;
    }
    setSelectedProjectIds((prev) => {
      const set = new Set(prev);
      for (const project of filteredProjects) set.add(project.id);
      return Array.from(set);
    });
  }

  function completeOnboarding() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('open-studio:onboarding:done', '1');
    }
    setShowOnboarding(false);
  }

  return (
    <main className="h-screen overflow-auto bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="h-8 bg-[#111a2b] text-[11px] text-center text-[var(--text-secondary)] flex items-center justify-center border-b border-[var(--border-default)]">
        Open Studio — tus proyectos se guardan localmente en este navegador
      </div>
      <div className="flex min-h-[calc(100vh-2rem)]">
        <aside className="w-64 border-r border-[var(--border-default)] bg-[#0f1522] p-3 flex flex-col" aria-label="Navegación principal">
          <div className="font-semibold text-lg flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#00b8d9]" aria-hidden />
            <span>Open Studio</span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full justify-center"
            onClick={() => setNewProjectOpen(true)}
          >
            Nuevo proyecto
          </Button>
          <button
            type="button"
            onClick={() => router.push('/editor')}
            className="mt-2 h-8 rounded-lg border border-[var(--border-default)] bg-[#121827] text-[var(--text-secondary)] text-xs font-medium hover:bg-[#182034] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            Editor sin proyecto guardado
          </button>
          <div className="mt-2 space-y-1">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full h-8 rounded-md bg-[#182034] text-left px-2 text-xs font-medium flex items-center gap-2 text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <Home size={14} aria-hidden /> Inicio
            </button>
            <button
              type="button"
              onClick={() => router.push('/editor')}
              className="w-full h-8 rounded-md hover:bg-[#182034] text-left px-2 text-xs flex items-center gap-2 text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <Plus size={14} aria-hidden /> Editor rápido
            </button>
          </div>
          <div className="mt-auto pt-4 border-t border-[var(--border-default)] text-xs text-[var(--text-secondary)] space-y-2">
            <button
              type="button"
              onClick={() => setShowNewsPanel(true)}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#182034] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <Bell size={13} aria-hidden /> Novedades
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsPanel(true)}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#182034] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <Settings size={13} aria-hidden /> Ajustes
            </button>
          </div>
        </aside>

        <section className="flex-1 p-6" aria-label="Contenido del dashboard">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form
                className="relative w-full min-w-[200px] max-w-md"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center text-[#8d9bbb]"
                  aria-hidden
                >
                  <Search size={14} className="shrink-0" strokeWidth={2} />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ui-input w-full"
                  style={{ paddingLeft: '44px', paddingRight: search ? '64px' : '10px' }}
                  placeholder="Buscar proyectos…"
                  type="search"
                  aria-label="Buscar proyectos por nombre"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-2 my-auto h-6 rounded px-2 text-[11px] text-[#9fb2d9] hover:bg-[#151b2a] hover:text-white"
                  >
                    Limpiar
                  </button>
                ) : null}
              </form>
              <Button type="button" variant="primary" size="sm" onClick={() => setNewProjectOpen(true)}>
                Nuevo proyecto
              </Button>
            </div>

            <div className="surface-elevated p-6 text-center">
              <h1 className="text-4xl font-semibold tracking-tight">Dashboard de Open Studio</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xl mx-auto">
                Crea videos y ediciones listas para exportar. Cada proyecto nuevo pasa por un asistente:
                nombre, formato (16:9, vertical, 4:5…), plantilla o lienzo en blanco, FPS y duración.
              </p>
            </div>

            <section className="rounded-2xl border border-[#1f2a3f] bg-[#080c14] p-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              <div className="mb-4 rounded-xl border border-[#1a2438] bg-[#0b1220] px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#9fb0d6]">
                    <span className="text-[#7991c8]">Home</span> <span className="px-1 text-[#5f739d]">›</span>{' '}
                    <span className="font-semibold text-[#f5f8ff]">
                    {workspaces.find((workspace) => workspace.id === selectedWorkspaceId)?.name ?? 'All projects'}
                    </span>
                  </div>
                  <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[220px_220px_auto]">
                    <select
                      className="ui-select w-full"
                      value={selectedWorkspaceId}
                      onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                      aria-label="Seleccionar espacio de trabajo"
                    >
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="ui-input w-full"
                      placeholder="Nuevo espacio de trabajo"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      aria-label="Nombre del nuevo espacio"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={handleCreateWorkspace}>
                      Crear espacio
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1a2438] bg-[#0b1220] px-3 py-2.5">
                <div className="flex items-center gap-3 text-xs text-[#9fb0d6]">
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-md px-1 py-1 hover:bg-[#121b2d]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#2a3348] bg-[#111827] text-[#3b82f6]"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisibleProjects}
                    />
                    Seleccionar todo
                  </label>
                  <span className="text-[#2a3348]">|</span>
                  <select
                    className="rounded-md bg-[#111827] px-2 py-1 text-xs text-[#d0dcf6] outline-none ring-1 ring-[#22314d]"
                    value={sortMode}
                    onChange={(e) =>
                      setSortMode(
                        e.target.value as 'modified-desc' | 'modified-asc' | 'name-asc' | 'name-desc'
                      )
                    }
                    aria-label="Ordenar proyectos"
                  >
                    <option value="modified-desc">Modificado ↓</option>
                    <option value="modified-asc">Modificado ↑</option>
                    <option value="name-asc">Nombre A-Z</option>
                    <option value="name-desc">Nombre Z-A</option>
                  </select>
                </div>
                <div className="inline-flex rounded-xl border border-[#2a3348] bg-[#0d1728] p-1">
                  <button
                    type="button"
                    onClick={() => setProjectViewMode('grid')}
                    className={`rounded-md px-2 py-1 ${
                      projectViewMode === 'grid' ? 'bg-[#1c2a43] text-white' : 'text-[#9fb0d6]'
                    }`}
                    aria-label="Vista de cuadrícula"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectViewMode('list')}
                    className={`rounded-md px-2 py-1 ${
                      projectViewMode === 'list' ? 'bg-[#1c2a43] text-white' : 'text-[#9fb0d6]'
                    }`}
                    aria-label="Vista de lista"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-[#f4f7ff]">Todos los proyectos</h2>
                <span className="text-xs text-[#8fa1c7]">{filteredProjects.length} elementos</span>
              </div>
              {loading ? (
                <p className="text-xs text-[#8894b5]" aria-live="polite">
                  Cargando…
                </p>
              ) : filteredProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#2a3348] p-8 text-center">
                  <p className="text-sm text-[#8894b5]">
                    {search.trim()
                      ? `No hay resultados para «${search}».`
                      : 'Aún no hay proyectos. Crea uno con el asistente.'}
                  </p>
                  {search.trim() ? (
                    <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setSearch('')}>
                      Limpiar búsqueda
                    </Button>
                  ) : (
                    <Button type="button" variant="primary" size="sm" className="mt-3" onClick={() => setNewProjectOpen(true)}>
                      Nuevo proyecto
                    </Button>
                  )}
                </div>
              ) : (
                <ul
                  className={`list-none p-0 m-0 ${
                    projectViewMode === 'grid'
                      ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-3'
                      : 'flex flex-col gap-2'
                  }`}
                >
                  {filteredProjects.map((p, index) => (
                    <li key={`${p.id}-${index}`}>
                      <article
                        className={`rounded-xl border transition-all cursor-pointer ${
                          selectedProjectIds.includes(p.id)
                            ? 'border-sky-400/70 bg-[#0a1322] shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_10px_24px_rgba(2,8,23,0.55)]'
                            : 'border-[#1c2131] bg-black hover:border-[#2a3f5c]'
                        } ${projectViewMode === 'list' ? 'flex items-start gap-3 p-3' : 'flex flex-col h-full'} ${
                          compactProjectCards ? 'p-2' : 'p-3'
                        }`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button,select,input,label')) return;
                          toggleProjectSelection(p.id);
                        }}
                      >
                        <label
                          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] ${
                            selectedProjectIds.includes(p.id)
                              ? 'border-sky-500/60 bg-sky-500/15 text-sky-100'
                              : 'border-[#25314a] bg-[#0f1626] text-[#aab9d9]'
                          } ${projectViewMode === 'list' ? 'mt-0.5' : 'mb-2 w-fit'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(p.id)}
                            onChange={() => toggleProjectSelection(p.id)}
                            className="h-4 w-4 rounded border-[#2a3348] accent-sky-500"
                            aria-label={`Seleccionar proyecto ${p.name}`}
                          />
                          {selectedProjectIds.includes(p.id) ? 'Seleccionado' : 'Seleccionar'}
                        </label>
                        <div
                          className={`${
                            projectViewMode === 'list'
                              ? 'h-20 w-36 rounded-lg bg-[#02040a] border border-[#121726] shrink-0'
                              : 'h-26 rounded-lg bg-[#02040a] border border-[#121726] mb-2 shrink-0'
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium truncate">{p.name}</h3>
                            {selectedProjectIds.includes(p.id) ? (
                              <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-100">
                                Activo
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-[#7e8aa9] mt-1">
                            {p.width}×{p.height} · {Math.round(p.duration)}s
                          </p>
                          <p className="text-[11px] text-[#6f7f9e] mt-1">
                            Created {new Date(p.createdAt).toISOString().slice(0, 10)}
                          </p>
                        </div>
                        <div className={`${projectViewMode === 'list' ? 'w-56' : 'mt-2'}`}>
                          <label className="sr-only" htmlFor={`workspace-${p.id}`}>
                            Espacio de trabajo
                          </label>
                          <select
                            id={`workspace-${p.id}`}
                            className="ui-select h-8 text-[11px]"
                            value={workspaceAssignments[p.id] ?? DEFAULT_WORKSPACE_ID}
                            onChange={(e) => assignProjectToWorkspace(p.id, e.target.value)}
                          >
                            {workspaces.map((workspace) => (
                              <option key={workspace.id} value={workspace.id}>
                                {workspace.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={`${projectViewMode === 'list' ? 'ml-auto flex gap-2' : 'mt-3 flex flex-wrap gap-2'}`}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-[11px] h-8"
                            onClick={() => openProject(p.id)}
                          >
                            Abrir
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-[11px] h-8"
                            onClick={() => openRename(p.id, p.name)}
                          >
                            Renombrar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            className="text-[11px] h-8"
                            onClick={() => setDeleteConfirmId(p.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </div>

      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onComplete={async (project) => {
          try {
            await handleCreateProject(project);
          } catch (error) {
            console.error(error);
            setToast({
              type: 'error',
              message: 'No se pudo guardar el proyecto. Revisa el almacenamiento del navegador.',
            });
            throw error;
          }
        }}
      />

      {renameOpen && renameTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setRenameOpen(false);
              setRenameTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={renameTitleId}
            className="w-full max-w-md rounded-xl border border-[#2a3348] bg-[#0f1522] p-5 shadow-xl"
          >
            <h2 id={renameTitleId} className="text-sm font-semibold text-[#eef3ff]">
              Renombrar proyecto
            </h2>
            <label htmlFor="rename-input" className="sr-only">
              Nuevo nombre
            </label>
            <input
              ref={renameInputRef}
              id="rename-input"
              className="ui-input mt-3"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={120}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRenameOpen(false);
                  setRenameTarget(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => void submitRename()}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-xl border border-[#2a3348] bg-[#0f1522] p-5 shadow-xl"
          >
            <h2 id="delete-project-title" className="text-sm font-semibold text-[#eef3ff]">
              ¿Eliminar proyecto?
            </h2>
            <p className="text-xs text-[#8ea1c9] mt-2">Esta acción no se puede deshacer.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={() => void confirmDelete()}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-xl border border-[#2a3348] bg-[#0f1522] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#eef3ff]">
                {onboardingSteps[onboardingStep].title}
              </h3>
              <span className="text-xs text-[#8ea1c9]">
                {onboardingStep + 1}/{onboardingSteps.length}
              </span>
            </div>
            <p className="text-sm text-[#aeb9d6]">{onboardingSteps[onboardingStep].description}</p>
            <div className="mt-4 h-1.5 rounded-full bg-[#1b2436]" aria-hidden>
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
              />
            </div>
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                className="px-3 py-2 rounded-lg border border-[#2a3348] bg-[#121827] text-xs hover:bg-[#1a2438] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                onClick={completeOnboarding}
              >
                Saltar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-[#2a3348] bg-[#121827] text-xs hover:bg-[#1a2438] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                  disabled={onboardingStep === 0}
                  onClick={() => setOnboardingStep((s) => Math.max(0, s - 1))}
                >
                  Atrás
                </button>
                {onboardingStep < onboardingSteps.length - 1 ? (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-[#2f9fe8] hover:bg-[#45b4ff] text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                    onClick={() => setOnboardingStep((s) => Math.min(onboardingSteps.length - 1, s + 1))}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-[#2f9fe8] hover:bg-[#45b4ff] text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                    onClick={completeOnboarding}
                  >
                    Empezar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50" role="status" aria-live="polite">
          <div
            className={`px-3 py-2 rounded-lg text-xs shadow-lg border ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {showNewsPanel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowNewsPanel(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-panel-title"
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#2a3348] bg-[#0f1522] shadow-xl"
          >
            <div className="grid md:grid-cols-[220px_1fr]">
              <aside className="border-b border-[#1f2a3f] bg-[#0b0f17] p-4 md:border-b-0 md:border-r">
                <h2 id="news-panel-title" className="flex items-center gap-2 text-sm font-semibold text-[#eef3ff]">
                  <BellRing size={15} /> Notificaciones
                </h2>
                <p className="mt-1 text-xs text-[#8ea3ce]">Controla alertas y revisa el historial reciente.</p>
                <div className="mt-4 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewsTab('feed')}
                    className={`w-full rounded-lg px-3 py-2 text-left transition flex items-center justify-between ${
                      newsTab === 'feed'
                        ? 'bg-[#28395a] text-white shadow-[inset_0_0_0_1px_rgba(150,180,255,0.24)]'
                        : 'text-[#a7bbdf] hover:bg-[#172338]'
                    }`}
                  >
                    <span>Centro de notificaciones</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsTab('changelog')}
                    className={`w-full rounded-lg px-3 py-2 text-left transition flex items-center justify-between ${
                      newsTab === 'changelog'
                        ? 'bg-[#28395a] text-white shadow-[inset_0_0_0_1px_rgba(150,180,255,0.24)]'
                        : 'text-[#a7bbdf] hover:bg-[#172338]'
                    }`}
                  >
                    <span>Historial y changelog</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </aside>
              <section className="p-5">
                {newsTab === 'feed' ? (
                  <>
                    <div className="rounded-xl border border-[#26324a] bg-gradient-to-br from-[#141d2e] to-[#0f1522] p-4">
                      <p className="text-sm font-semibold text-[#eef3ff]">Preferencias de notificación</p>
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center justify-between rounded-lg border border-[#25324b] bg-[#101827] px-3 py-2">
                          <span className="text-xs text-[#d3def6]">Alertas dentro del dashboard</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={notificationDesktop}
                            onClick={() => {
                              const next = !notificationDesktop;
                              setNotificationDesktop(next);
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem('opencut:notifyDesktop', next ? '1' : '0');
                              }
                            }}
                            className={`relative h-6 w-11 rounded-full transition ${
                              notificationDesktop ? 'bg-[#3b82f6]' : 'bg-[#2a3348]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                notificationDesktop ? 'left-[22px]' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </label>
                        <label className="flex items-center justify-between rounded-lg border border-[#25324b] bg-[#101827] px-3 py-2">
                          <span className="text-xs text-[#d3def6]">Novedades de producto</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={notificationProductUpdates}
                            onClick={() => {
                              const next = !notificationProductUpdates;
                              setNotificationProductUpdates(next);
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem('opencut:notifyProductUpdates', next ? '1' : '0');
                              }
                            }}
                            className={`relative h-6 w-11 rounded-full transition ${
                              notificationProductUpdates ? 'bg-[#3b82f6]' : 'bg-[#2a3348]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                notificationProductUpdates ? 'left-[22px]' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </label>
                        <label className="flex items-center justify-between rounded-lg border border-[#25324b] bg-[#101827] px-3 py-2">
                          <span className="text-xs text-[#d3def6]">Alertas de seguridad</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={notificationSecurity}
                            onClick={() => {
                              const next = !notificationSecurity;
                              setNotificationSecurity(next);
                              if (typeof window !== 'undefined') {
                                window.localStorage.setItem('opencut:notifySecurity', next ? '1' : '0');
                              }
                            }}
                            className={`relative h-6 w-11 rounded-full transition ${
                              notificationSecurity ? 'bg-[#3b82f6]' : 'bg-[#2a3348]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                notificationSecurity ? 'left-[22px]' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </label>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-[#c4d0ec]">
                      <li className="rounded-lg border border-[#24314b] bg-[#111827] p-3">
                        <p className="font-medium text-[#e6eeff] flex items-center gap-2">
                          <Megaphone size={14} /> Dashboard actualizado
                        </p>
                        <p className="mt-1 text-[#9fb0d6]">
                          Búsqueda reconstruida, sidebar optimizado y mejor flujo de creación.
                        </p>
                      </li>
                      <li className="rounded-lg border border-[#24314b] bg-[#111827] p-3">
                        <p className="font-medium text-[#e6eeff] flex items-center gap-2">
                          <Zap size={14} /> Productividad
                        </p>
                        <p className="mt-1 text-[#9fb0d6]">
                          Ajustes y notificaciones persistentes para personalizar tu espacio.
                        </p>
                      </li>
                    </ul>
                  </>
                ) : (
                  <ul className="space-y-2 text-xs text-[#c4d0ec]">
                    <li className="rounded-lg border border-[#24314b] bg-[#111827] p-3">
                      <p className="font-medium text-[#e6eeff] flex items-center gap-2">
                        <Clock3 size={14} /> v0.1.9
                      </p>
                      <p className="mt-1 text-[#9fb0d6]">Centro de notificaciones renovado y nuevos toggles.</p>
                    </li>
                    <li className="rounded-lg border border-[#24314b] bg-[#111827] p-3">
                      <p className="font-medium text-[#e6eeff] flex items-center gap-2">
                        <Clock3 size={14} /> v0.1.8
                      </p>
                      <p className="mt-1 text-[#9fb0d6]">Ajustes avanzados y panel de usuario renovado.</p>
                    </li>
                  </ul>
                )}
                <div className="mt-4 flex justify-end">
                  <Button type="button" variant="primary" size="sm" onClick={() => setShowNewsPanel(false)}>
                    Cerrar
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowSettingsPanel(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-panel-title"
            className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#2a3348] bg-[#0f1522] shadow-xl"
          >
            <div className="grid md:grid-cols-[220px_1fr]">
              <aside className="border-b border-[#1f2a3f] bg-[#0b0f17] p-4 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between">
                  <h2 id="settings-panel-title" className="text-2xl font-semibold tracking-tight text-white">
                    General
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowSettingsPanel(false)}
                    className="rounded-md p-1 text-[#9fb0d6] transition hover:bg-[#1b2538] hover:text-white"
                    aria-label="Cerrar panel de ajustes"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-5 space-y-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setSettingsTab('general')}
                    className={`w-full rounded-lg px-3 py-2 text-left transition flex items-center justify-between ${
                      settingsTab === 'general'
                        ? 'bg-[#28395a] text-white shadow-[inset_0_0_0_1px_rgba(150,180,255,0.24)]'
                        : 'text-[#a7bbdf] hover:bg-[#172338]'
                    }`}
                  >
                    <span className="flex items-center gap-2"><Settings size={14} /> General</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('editor')}
                    className={`w-full rounded-lg px-3 py-2 text-left transition flex items-center justify-between ${
                      settingsTab === 'editor'
                        ? 'bg-[#28395a] text-white shadow-[inset_0_0_0_1px_rgba(150,180,255,0.24)]'
                        : 'text-[#a7bbdf] hover:bg-[#172338]'
                    }`}
                  >
                    <span className="flex items-center gap-2"><Sparkles size={14} /> Editor</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('privacy')}
                    className={`w-full rounded-lg px-3 py-2 text-left transition flex items-center justify-between ${
                      settingsTab === 'privacy'
                        ? 'bg-[#28395a] text-white shadow-[inset_0_0_0_1px_rgba(150,180,255,0.24)]'
                        : 'text-[#a7bbdf] hover:bg-[#172338]'
                    }`}
                  >
                    <span className="flex items-center gap-2"><Shield size={14} /> Privacidad</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </aside>
              <section className="p-5">
                <div className="rounded-xl border border-[#2a3348] bg-[#101826] p-4">
                  <p className="text-lg font-semibold text-white">Secure your account</p>
                  <p className="mt-1 text-sm text-[#d8e4ff]">
                    Activa MFA para proteger tu cuenta cuando inicias sesión.
                  </p>
                  <div className="mt-3">
                    <Button type="button" variant="secondary" size="sm">
                      Set up MFA
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                {settingsTab === 'general' && (
                  <>
                    <label className="flex items-center justify-between rounded-lg border border-[#24314b] bg-[#111827] px-3 py-3">
                      <div>
                        <p className="text-sm text-[#f0f5ff]">Idioma principal</p>
                        <p className="text-[11px] text-[#8ea3ce]">Idioma base de la interfaz del dashboard.</p>
                      </div>
                      <select
                        className="ui-select h-8 text-xs w-32"
                        value={defaultLanguage}
                        onChange={(e) => {
                          const next = e.target.value as 'es' | 'en';
                          setDefaultLanguage(next);
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('opencut:language', next);
                          }
                        }}
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-[#24314b] bg-[#111827] px-3 py-3">
                      <div>
                        <p className="text-sm text-[#f0f5ff]">Recordar última búsqueda</p>
                        <p className="text-[11px] text-[#8ea3ce]">Mantiene el filtro activo al volver al dashboard.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={rememberLastSearch}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setRememberLastSearch(next);
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('opencut:rememberLastSearch', next ? '1' : '0');
                            if (!next) window.localStorage.removeItem('opencut:lastSearch');
                          }
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-[#24314b] bg-[#111827] px-3 py-3">
                      <div>
                        <p className="text-sm text-[#f0f5ff]">Abrir editor al crear proyecto</p>
                        <p className="text-[11px] text-[#8ea3ce]">Salta directo al timeline tras crear un proyecto.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoOpenEditorAfterCreate}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setAutoOpenEditorAfterCreate(next);
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('opencut:autoOpenEditorAfterCreate', next ? '1' : '0');
                          }
                        }}
                      />
                    </label>
                  </>
                )}
                {settingsTab === 'editor' && (
                  <>
                    <label className="flex items-center justify-between rounded-lg border border-[#24314b] bg-[#111827] px-3 py-3">
                      <div>
                        <p className="text-sm text-[#f0f5ff]">Reducir animaciones</p>
                        <p className="text-[11px] text-[#8ea3ce]">Disminuye transiciones para mejorar enfoque y rendimiento.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefersReducedMotion}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setPrefersReducedMotion(next);
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('opencut:prefersReducedMotion', next ? '1' : '0');
                          }
                          setToast({
                            type: 'success',
                            message: next ? 'Animaciones reducidas activadas.' : 'Animaciones reducidas desactivadas.',
                          });
                        }}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-[#24314b] bg-[#111827] px-3 py-3">
                      <div>
                        <p className="text-sm text-[#f0f5ff]">Tarjetas de proyecto compactas</p>
                        <p className="text-[11px] text-[#8ea3ce]">Muestra más proyectos por pantalla en el grid.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={compactProjectCards}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setCompactProjectCards(next);
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('opencut:compactProjectCards', next ? '1' : '0');
                          }
                        }}
                      />
                    </label>
                  </>
                )}
                {settingsTab === 'privacy' && (
                  <>
                    <label className="flex items-center justify-between rounded-lg border border-[#24314b] bg-[#111827] px-3 py-3">
                      <div>
                        <p className="text-sm text-[#f0f5ff]">Telemetría anónima</p>
                        <p className="text-[11px] text-[#8ea3ce]">Ayuda a mejorar el producto con métricas no personales.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={telemetryEnabled}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setTelemetryEnabled(next);
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('opencut:telemetryEnabled', next ? '1' : '0');
                          }
                        }}
                      />
                    </label>
                    <div className="rounded-lg border border-[#24314b] bg-[#111827] p-3 text-xs text-[#9fb0d6]">
                      Tus proyectos se guardan localmente en este navegador mediante IndexedDB/localStorage.
                    </div>
                  </>
                )}
                  </div>
                  <aside className="rounded-xl border border-[#24314b] bg-[#111827] p-3">
                    <h3 className="text-xs font-semibold text-[#e6eeff] flex items-center gap-2">
                      <User size={14} /> Perfil de usuario
                    </h3>
                    <div className="mt-3 space-y-2 text-xs text-[#a9bbdf]">
                      <p><span className="text-[#dbe6ff]">Nombre:</span> {userProfile.name}</p>
                      <p><span className="text-[#dbe6ff]">Plan:</span> {userProfile.plan}</p>
                      <p><span className="text-[#dbe6ff]">Proyectos:</span> {userProfile.totalProjects}</p>
                      <p><span className="text-[#dbe6ff]">Minutos editados:</span> {userProfile.totalMinutes}</p>
                      <p className="truncate"><span className="text-[#dbe6ff]">Último proyecto:</span> {userProfile.lastProject}</p>
                    </div>
                    <div className="mt-3 space-y-2 text-[11px]">
                      <div className="rounded-md border border-[#2a3a58] bg-[#152038] px-2 py-1.5 text-[#b8c9ee] flex items-center gap-2">
                        <CheckCircle2 size={13} /> Sincronización local activa
                      </div>
                      <div className="rounded-md border border-[#2a3a58] bg-[#152038] px-2 py-1.5 text-[#b8c9ee] flex items-center gap-2">
                        <HardDrive size={13} /> Almacenamiento del navegador
                      </div>
                      <div className="rounded-md border border-[#2a3a58] bg-[#152038] px-2 py-1.5 text-[#b8c9ee] flex items-center gap-2">
                        <Shield size={13} /> Preferencias protegidas localmente
                      </div>
                      <div className="rounded-md border border-[#2a3a58] bg-[#152038] px-2 py-1.5 text-[#b8c9ee] flex items-center gap-2">
                        <Globe size={13} /> Idioma actual: {defaultLanguage === 'es' ? 'Español' : 'English'}
                      </div>
                      <div className="rounded-md border border-[#2a3a58] bg-[#152038] px-2 py-1.5 text-[#b8c9ee] flex items-center gap-2">
                        <Bell size={13} /> Alertas activas: {notificationDesktop || notificationProductUpdates || notificationSecurity ? 'Sí' : 'No'}
                      </div>
                    </div>
                </aside>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowSettingsPanel(false)}>
                  Cancelar
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => setShowSettingsPanel(false)}>
                  Guardar y cerrar
                </Button>
              </div>
            </section>
          </div>
        </div>
        </div>
      )}
    </main>
  );
}
