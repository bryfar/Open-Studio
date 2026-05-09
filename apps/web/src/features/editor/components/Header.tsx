'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, MoreHorizontal } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/Button';
import { icons } from '@/shared/components/icons';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { screenRecorder } from '@/features/editor/lib/recorder';
import {
  loadFFmpeg,
  exportClipSegmentToMp4,
  exportTimelineToMp4,
  convertToMp4,
  convertToGif,
  convertToWebM,
  exportFrameImage,
  mergeAudioTrackIntoVideo,
} from '@/features/editor/lib/ffmpeg';
import {
  saveEditorState,
  saveProjectSnapshot,
  clearEditorState,
  renameProject,
  deleteProject,
} from '@/core/lib/storage';
import { NewProjectDialog } from '@/shared/components/NewProjectDialog';
import type { Project, Clip, MediaFile, SocialExportPlatform } from '@/shared/types';
import { scheduleMediaFileMetadataProbe } from '@/features/editor/lib/scheduleMediaProbe';
import { renderCompositedWebM } from '@/features/editor/lib/exportCompositor';
import { SOCIAL_VARIANTS_BY_PLATFORM, resolveSocialProfile } from '@/features/editor/lib/socialExport';
import { exportProjectBridge, importProjectBridge } from '@/features/editor/lib/interchange';
import { saveBlobWithPlatform, saveTextWithPlatform } from '@/shared/platform/fileSave';
import { cn } from '@/shared/utils';

/** «none» = export genérico; el resto coincide con `SocialExportPlatform` en el proyecto. */
type SocialPlatform = 'none' | SocialExportPlatform;

/** Mismo aspecto «pill» para todos los disparadores de menú del header. */
const HDR_DROP_TRIGGER =
  'h-8 shrink-0 gap-1 rounded-[var(--os-radius-md)] border border-[var(--os-border-default)]/80 bg-[var(--os-surface-1)]/45 px-2.5 text-[var(--os-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[var(--os-bg-hover)]/50';

/** Superficie común de paneles (listas y diálogo de exportación). */
const HDR_DROP_PANEL =
  'absolute z-[110] min-w-[13rem] max-w-[min(calc(100vw-2rem),18rem)] top-[calc(100%+6px)] rounded-lg border border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] shadow-xl';

const hdrDropPanelAlign = (side: 'start' | 'end') => (side === 'start' ? 'left-0' : 'right-0');

const HDR_MENU_ITEM =
  'flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]';

const hdrChevron = (open: boolean) =>
  cn('shrink-0 text-[var(--os-text-secondary)] transition-transform', open && 'rotate-180');

export function Header() {
  const exportFieldId = useId();
  const selPlatformId = `${exportFieldId}-platform`;
  const selPresetId = `${exportFieldId}-preset`;
  const selFileId = `${exportFieldId}-file`;

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get('projectId');
  const { project, mediaFiles, isRecording, dispatch, ffmpegLoaded, selectedClipId } =
    useEditorStore();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState<'none' | 'system' | 'microphone'>('none');
  const [recordingMic, setRecordingMic] = useState(false);
  const [recordingCamera, setRecordingCamera] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showRecordingSetup, setShowRecordingSetup] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm' | 'gif' | 'png' | 'webp' | 'jpg' | 'avif'>('mp4');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const interchangeInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [projectMenuOpen]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!fileMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [fileMenuOpen]);

  useEffect(() => {
    if (!exportOptionsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [exportOptionsOpen]);

  useEffect(() => {
    if (
      !showShortcuts &&
      !showRecordingSetup &&
      !fileMenuOpen &&
      !moreMenuOpen &&
      !exportOptionsOpen &&
      !projectMenuOpen
    )
      return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowRecordingSetup(false);
        setFileMenuOpen(false);
        setMoreMenuOpen(false);
        setExportOptionsOpen(false);
        setProjectMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showShortcuts, showRecordingSetup, fileMenuOpen, moreMenuOpen, exportOptionsOpen, projectMenuOpen]);

  const socialPlatform: SocialPlatform = project?.socialExport?.platform ?? 'none';
  const socialVariantId =
    socialPlatform === 'none'
      ? ''
      : project?.socialExport?.variantId ??
        SOCIAL_VARIANTS_BY_PLATFORM[socialPlatform][0]?.id ??
        'vertical';

  const socialVariants =
    socialPlatform !== 'none' ? SOCIAL_VARIANTS_BY_PLATFORM[socialPlatform] : [];

  const socialPlatformShortLabel =
    socialPlatform === 'none'
      ? 'Genérico'
      : (
          {
            tiktok: 'TikTok',
            facebook: 'Facebook',
            instagram: 'Instagram',
            youtube: 'YouTube',
            linkedin: 'LinkedIn',
            x: 'X',
          } as Record<SocialExportPlatform, string>
        )[socialPlatform];
  const presetShortLabel =
    socialPlatform === 'none'
      ? ''
      : (socialVariants.find((v) => v.id === socialVariantId)?.label ?? '');
  const exportConfigTitle = [
    `Tipo: ${exportFormat.toUpperCase()}`,
    `Plataforma: ${socialPlatformShortLabel}`,
    presetShortLabel ? `Preset: ${presetShortLabel}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const exportPanelId = `${exportFieldId}-export-panel`;

  const handleNewProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleNewProjectComplete = async (newProject: Project) => {
    const dirty =
      project &&
      (mediaFiles.length > 0 || project.tracks.some((t) => t.clips.length > 0));
    if (dirty) {
      const ok = window.confirm(
        'El proyecto actual tiene pistas o multimedia. Si no lo guardaste, puedes perder cambios al abrir uno nuevo. ¿Continuar?'
      );
      if (!ok) return false;
    }
    await saveProjectSnapshot(newProject.id, newProject, []);
    await clearEditorState().catch(() => {});
    dispatch({
      type: 'REPLACE_SNAPSHOT',
      payload: { project: newProject, mediaFiles: [] },
    });
    router.push(`/editor?projectId=${newProject.id}`);
  };

  const handleImportMedia = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const payload: MediaFile = {
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        type: file.type,
        url,
        thumbnail: url,
      };
      dispatch({ type: 'ADD_MEDIA_FILE', payload });
      scheduleMediaFileMetadataProbe(dispatch, payload);
    }

    e.target.value = '';
  };

  const handleRecord = async () => {
    if (isRecording) {
      const result = await screenRecorder.stop();
      dispatch({ type: 'SET_RECORDING', payload: false });

      const url = URL.createObjectURL(result.blob);
      dispatch({
        type: 'ADD_MEDIA_FILE',
        payload: {
          id: Math.random().toString(36).substring(2, 15),
          name: `Recording ${new Date().toLocaleTimeString()}`,
          type: 'video/webm',
          url,
          duration: result.duration,
          width: result.width,
          height: result.height,
          thumbnail: url,
        },
      });
    } else {
      try {
        const audioMode = recordingMic ? 'microphone' : recordingAudio;
        await screenRecorder.start({ audio: audioMode });
        dispatch({ type: 'SET_RECORDING', payload: true });
        setShowRecordingSetup(false);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };


  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      if (urlProjectId) {
        await saveProjectSnapshot(urlProjectId, project, mediaFiles);
      } else {
        await saveEditorState(project, mediaFiles);
      }
      setExportMessage('Proyecto guardado.');
      window.setTimeout(() => setExportMessage((m) => (m === 'Proyecto guardado.' ? null : m)), 2000);
    } catch (err) {
      console.error('Failed to save project', err);
      setExportMessage('No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const goToDashboard = () => {
    setProjectMenuOpen(false);
    router.push('/dashboard');
  };

  const beginProjectNameEdit = () => {
    if (!project) return;
    setProjectMenuOpen(false);
    setProjectNameDraft(project.name);
    setEditingProjectName(true);
    requestAnimationFrame(() => {
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    });
  };

  const cancelProjectNameEdit = () => {
    if (project) setProjectNameDraft(project.name);
    setEditingProjectName(false);
  };

  const commitProjectNameEdit = async () => {
    if (!project) {
      setEditingProjectName(false);
      return;
    }
    const name = projectNameDraft.trim();
    if (!name) {
      setProjectNameDraft(project.name);
      setEditingProjectName(false);
      return;
    }
    if (name === project.name) {
      setEditingProjectName(false);
      return;
    }
    try {
      if (urlProjectId) {
        await renameProject(urlProjectId, name);
      }
      dispatch({ type: 'UPDATE_PROJECT', payload: { name } });
      if (!urlProjectId) {
        const { project: p, mediaFiles: m } = useEditorStore.getState();
        if (p) await saveEditorState(p, m);
      }
    } catch (err) {
      console.error(err);
      setExportMessage('No se pudo renombrar.');
      setProjectNameDraft(project.name);
    } finally {
      setEditingProjectName(false);
    }
  };

  const handleDeleteFromMenu = async () => {
    if (!urlProjectId) return;
    if (!window.confirm('¿Eliminar este proyecto del almacenamiento local? No se puede deshacer.')) {
      setProjectMenuOpen(false);
      return;
    }
    try {
      await deleteProject(urlProjectId);
      setProjectMenuOpen(false);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setExportMessage('No se pudo eliminar el proyecto.');
      setProjectMenuOpen(false);
    }
  };


  const handleExport = async () => {
    if (!project) {
      alert('No project to export.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage(null);

    try {
      if (!ffmpegLoaded) {
        const ok = await loadFFmpeg((p) => setExportProgress(Math.round(p)));
        if (!ok) {
          setExportMessage('FFmpeg no pudo cargarse. Revisa conexión/red y vuelve a intentar.');
          return;
        }
        dispatch({ type: 'SET_FFMPEG_LOADED', payload: true });
      }

      const videoTrack = project.tracks.find((t) => t.type === 'video');
      const videoClips = videoTrack?.clips.filter((c) => c.mediaUrl) ?? [];
      const hasOverlayClips = project.tracks.some(
        (t) => (t.type === 'text' || t.type === 'image') && t.clips.length > 0
      );

      let output: Blob | null = null;

      if (hasOverlayClips && project.duration <= 120) {
        setExportMessage('Compositing overlays frame-by-frame...');
        const webm = await renderCompositedWebM(project, mediaFiles, (p) =>
          setExportProgress(Math.round(p * 0.6))
        );
        if (webm) {
          output = await convertToMp4(webm, (p) =>
            setExportProgress(Math.round(60 + p * 0.4))
          );
        }
      } else if (videoClips.length <= 1 && videoClips.length > 0) {
        const targetClip: Clip | undefined =
          (selectedClipId &&
            videoClips.find((c) => c.id === selectedClipId && c.mediaUrl)) ||
          videoClips[0];

        if (!targetClip || !targetClip.mediaUrl) {
          alert('No video clip with media to export.');
          return;
        }

        const response = await fetch(targetClip.mediaUrl);
        const sourceBlob = await response.blob();

        output = await exportClipSegmentToMp4(targetClip, sourceBlob, (p) =>
          setExportProgress(Math.round(p))
        );
      } else if (videoClips.length > 1) {
        output = await exportTimelineToMp4(project, mediaFiles, (p) =>
          setExportProgress(Math.round(p))
        );
      } else {
        setExportMessage('No hay clips de video exportables en el timeline.');
        return;
      }
      if (!output) {
        setExportMessage('Export failed. See console for details.');
        return;
      }
      if (exportFormat === 'mp4' || exportFormat === 'webm') {
        output = await mergeAudioTrackIntoVideo(output, project, mediaFiles, (p) =>
          setExportProgress(Math.max(70, Math.round(p)))
        );
      }
      if (!output) {
        setExportMessage('Export failed while mixing audio.');
        return;
      }

      if (exportFormat === 'gif') {
        output = await convertToGif(output, 720, (p) => setExportProgress(Math.max(80, Math.round(p))));
      } else if (exportFormat === 'webm') {
        output = await convertToWebM(output, true, (p) => setExportProgress(Math.max(80, Math.round(p))));
      } else if (exportFormat === 'png' || exportFormat === 'webp' || exportFormat === 'jpg' || exportFormat === 'avif') {
        output = await exportFrameImage(output, exportFormat, (p) => setExportProgress(Math.max(80, Math.round(p))));
      } else {
        const profile =
          socialPlatform === 'none'
            ? null
            : resolveSocialProfile(socialPlatform, socialVariantId);
        if (profile) {
          setExportMessage(`Optimizando: ${profile.label}…`);
        }
        output = await convertToMp4(
          output,
          (p) => setExportProgress(Math.max(80, Math.round(p))),
          profile
            ? {
                width: profile.width,
                height: profile.height,
                fps: profile.fps,
                videoBitrate: profile.videoBitrate,
                maxRate: profile.maxRate,
                bufSize: profile.bufferSize,
                audioBitrate: profile.audioBitrate,
                crf: profile.crf,
                preset: profile.preset,
              }
            : undefined
        );
      }

      if (!output) {
        setExportMessage('Export conversion failed.');
        return;
      }

      const saved = await saveBlobWithPlatform(
        output,
        `${project.name || 'open-studio-export'}.${exportFormat}`,
        [{ name: exportFormat.toUpperCase(), extensions: [exportFormat] }]
      );
      setExportMessage(saved ? 'Export completed successfully.' : 'Export canceled.');
    } catch (error) {
      console.error('Export failed:', error);
      setExportMessage('Export failed. See console for details.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportInterchange = async () => {
    if (!project) return;
    const bridge = exportProjectBridge(project);
    const base = project.name || 'openstudio';
    const otioSaved = await saveTextWithPlatform(bridge.otioJson, `${base}.otio.json`, [
      { name: 'OpenTimelineIO', extensions: ['json', 'otio'] },
    ]);
    const mltSaved = await saveTextWithPlatform(bridge.mltXml, `${base}.mlt.xml`, [
      { name: 'MLT XML', extensions: ['xml', 'mlt'] },
    ]);
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        interchange: {
          otioJson: bridge.otioJson,
          mltXml: bridge.mltXml,
          lastExportedAt: Date.now(),
        },
      },
    });
    setExportMessage(otioSaved || mltSaved ? 'Interchange OTIO/MLT exportado.' : 'Export cancelado.');
  };

  const handleImportInterchange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    const raw = await file.text();
    const imported = importProjectBridge(raw, `${project.name} (importado)`);
    if (!imported) {
      setExportMessage('No se pudo importar OTIO/MLT.');
      return;
    }
    dispatch({ type: 'UPDATE_PROJECT', payload: imported });
    setExportMessage('Interchange importado.');
    e.target.value = '';
  };

  return (
    <header className="editor-header relative z-[100] flex h-[52px] shrink-0 items-center gap-3 overflow-visible border-b border-[var(--os-border-default)] px-4 shadow-[0_4px_28px_rgba(0,0,0,0.35)]">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]"
          onClick={goToDashboard}
          aria-label="Ir al inicio"
        >
          <Home size={18} strokeWidth={2} aria-hidden />
        </Button>
        <div className="h-5 w-px shrink-0 bg-[var(--os-border-default)]" aria-hidden />

        <div className="flex shrink-0 items-center gap-2">
          <img
            src="/logotipo.svg?v=3"
            alt="Open Studio"
            className="h-7 w-auto max-w-[200px] object-contain object-left"
          />
        </div>

        <div className="h-5 w-px shrink-0 bg-[var(--os-border-default)]" aria-hidden />

        <div className="relative flex min-w-0 max-w-[220px] shrink-0 flex-col" ref={projectMenuRef}>
          {editingProjectName && project ? (
            <input
              ref={projectNameInputRef}
              type="text"
              className="h-8 min-w-0 w-full rounded-[var(--os-radius-md)] border border-[var(--os-border-default)]/80 bg-[var(--os-media-card-bg)] px-2 text-xs font-medium text-[var(--os-text-primary)] outline-none focus-visible:border-[var(--os-border-accent)] focus-visible:shadow-[var(--os-focus-ring)]"
              value={projectNameDraft}
              onChange={(e) => setProjectNameDraft(e.target.value)}
              onBlur={() => void commitProjectNameEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void commitProjectNameEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelProjectNameEdit();
                }
              }}
              aria-label="Nombre del proyecto"
            />
          ) : (
            <div className={cn('flex min-w-0 items-stretch overflow-hidden', HDR_DROP_TRIGGER, 'p-0')}>
              <span
                role="button"
                tabIndex={0}
                className="flex min-w-0 flex-1 cursor-text items-center truncate border-0 bg-transparent px-2 text-left text-xs font-medium text-[var(--os-text-primary)] outline-none hover:bg-[var(--os-bg-hover)]/40 focus-visible:shadow-[var(--os-focus-ring)]"
                title="Doble clic para renombrar"
                onDoubleClick={(e) => {
                  e.preventDefault();
                  beginProjectNameEdit();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    beginProjectNameEdit();
                  }
                }}
              >
                {project?.name ?? 'Sin proyecto'}
              </span>
              <button
                type="button"
                className="flex shrink-0 items-center justify-center border-l border-[var(--os-border-default)]/50 px-2 text-[var(--os-text-primary)] outline-none hover:bg-[var(--os-bg-hover)]/40 focus-visible:shadow-[var(--os-focus-ring)] disabled:opacity-40"
                onClick={() => setProjectMenuOpen((o) => !o)}
                disabled={!project}
                aria-label="Menú del proyecto"
                aria-expanded={projectMenuOpen}
              >
                <icons.chevronDown size={14} className={hdrChevron(projectMenuOpen)} />
              </button>
            </div>
          )}
          {projectMenuOpen && !editingProjectName && project && (
            <div
              className={cn(HDR_DROP_PANEL, hdrDropPanelAlign('start'), 'py-1')}
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className={HDR_MENU_ITEM}
                onClick={goToDashboard}
              >
                <icons.layoutGrid size={14} className="text-[var(--os-text-secondary)]" />
                Mis proyectos
              </button>
              <button type="button" role="menuitem" className={HDR_MENU_ITEM} onClick={beginProjectNameEdit}>
                <icons.pencil size={14} className="text-[var(--os-text-secondary)]" />
                Renombrar…
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!urlProjectId}
                className={cn(HDR_MENU_ITEM, 'text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40')}
                onClick={handleDeleteFromMenu}
              >
                <icons.trash size={14} />
                Eliminar proyecto
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px shrink-0 bg-[var(--os-border-default)]" aria-hidden />

        <div className="relative shrink-0" ref={fileMenuRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={HDR_DROP_TRIGGER}
            aria-expanded={fileMenuOpen}
            aria-haspopup="menu"
            aria-label="Archivo: nuevo proyecto, importar multimedia o guardar"
            onClick={() => setFileMenuOpen((o) => !o)}
          >
            <icons.folder size={16} aria-hidden />
            <span className="text-xs">Archivo</span>
            <icons.chevronDown size={14} className={hdrChevron(fileMenuOpen)} aria-hidden />
          </Button>
          {fileMenuOpen && (
            <div
              className={cn(HDR_DROP_PANEL, hdrDropPanelAlign('start'), 'py-1')}
              role="menu"
              aria-label="Acciones de archivo"
            >
              <button
                type="button"
                role="menuitem"
                className={HDR_MENU_ITEM}
                onClick={() => {
                  setFileMenuOpen(false);
                  handleNewProject();
                }}
              >
                <icons.plus size={14} className="text-[var(--os-text-secondary)]" aria-hidden />
                Nuevo proyecto…
              </button>
              <button
                type="button"
                role="menuitem"
                className={HDR_MENU_ITEM}
                onClick={() => {
                  setFileMenuOpen(false);
                  handleImportMedia();
                }}
              >
                <icons.folder size={14} className="text-[var(--os-text-secondary)]" aria-hidden />
                Importar multimedia…
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!project || isSaving}
                className={cn(HDR_MENU_ITEM, 'disabled:cursor-not-allowed disabled:opacity-40')}
                onClick={() => {
                  setFileMenuOpen(false);
                  void handleSave();
                }}
              >
                <icons.save size={14} className="text-[var(--os-text-secondary)]" aria-hidden />
                {isSaving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 py-0.5">
        <Button
          variant={isRecording ? 'danger' : 'secondary'}
          size="sm"
          onClick={() => (isRecording ? handleRecord() : setShowRecordingSetup(true))}
          className="h-8 shrink-0"
        >
          <icons.screen size={16} aria-hidden />
          <span className="ml-1 text-xs">{isRecording ? 'Stop' : 'Record'}</span>
        </Button>

        <div className="relative shrink-0" ref={exportMenuRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(HDR_DROP_TRIGGER, 'max-w-[11rem]')}
            aria-expanded={exportOptionsOpen}
            aria-haspopup="dialog"
            aria-controls={exportPanelId}
            title={exportConfigTitle}
            aria-label={`Exportación: ${exportConfigTitle}. Abrir opciones.`}
            onClick={() => setExportOptionsOpen((o) => !o)}
          >
            <icons.layers size={16} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left text-xs">Exportación</span>
            <icons.chevronDown size={14} className={hdrChevron(exportOptionsOpen)} aria-hidden />
          </Button>
          {exportOptionsOpen && (
            <div
              id={exportPanelId}
              role="dialog"
              aria-label="Opciones de exportación"
              className={cn(HDR_DROP_PANEL, hdrDropPanelAlign('end'), 'p-3')}
            >
              <p className="mb-3 text-[11px] leading-snug text-[var(--os-text-muted)]">
                {socialPlatform === 'none'
                  ? 'Export genérico: elige formato. Presets de red solo con MP4.'
                  : 'Preset de red: ajusta tamaño y FPS del proyecto (MP4).'}
              </p>
              <fieldset className="m-0 min-w-0 space-y-3 border-0 p-0">
                <legend className="sr-only">Opciones de exportación</legend>
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor={selPlatformId}
                    className="text-[11px] font-medium leading-none text-[var(--os-text-secondary)]"
                  >
                    Plataforma
                  </label>
                  <select
                    id={selPlatformId}
                    className="ui-select h-8 w-full min-w-0 py-0 text-xs"
                    value={socialPlatform}
                    onChange={(e) => {
                      const next = e.target.value as SocialPlatform;
                      if (next === 'none') {
                        dispatch({ type: 'UPDATE_PROJECT', payload: { socialExport: undefined } });
                        return;
                      }
                      const firstId = SOCIAL_VARIANTS_BY_PLATFORM[next][0]?.id ?? 'vertical';
                      if (exportFormat !== 'mp4') setExportFormat('mp4');
                      const profile = resolveSocialProfile(next, firstId);
                      if (!profile) return;
                      dispatch({
                        type: 'UPDATE_PROJECT',
                        payload: {
                          socialExport: { platform: next, variantId: firstId },
                          width: profile.width,
                          height: profile.height,
                          fps: profile.fps,
                        },
                      });
                    }}
                    title="Destino para dimensiones recomendadas (solo con MP4)"
                  >
                    <option value="none">Sin optimizar</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="x">X</option>
                  </select>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor={selPresetId}
                    className={cn(
                      'text-[11px] font-medium leading-none',
                      socialPlatform === 'none'
                        ? 'text-[var(--os-text-muted)]'
                        : 'text-[var(--os-text-secondary)]'
                    )}
                  >
                    Preset de formato
                  </label>
                  <select
                    id={selPresetId}
                    className="ui-select h-8 w-full min-w-0 py-0 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                    value={socialPlatform === 'none' ? '' : socialVariantId}
                    disabled={socialPlatform === 'none'}
                    aria-disabled={socialPlatform === 'none'}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (socialPlatform === 'none') return;
                      const profile = resolveSocialProfile(socialPlatform, id);
                      if (!profile) return;
                      dispatch({
                        type: 'UPDATE_PROJECT',
                        payload: {
                          socialExport: { platform: socialPlatform, variantId: id },
                          width: profile.width,
                          height: profile.height,
                          fps: profile.fps,
                        },
                      });
                    }}
                    title="Relación de aspecto y resolución del preset"
                  >
                    {socialPlatform === 'none' ? (
                      <option value="">Elige plataforma primero</option>
                    ) : (
                      socialVariants.map((v) => (
                        <option key={v.id} value={v.id} title={v.label}>
                          {v.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor={selFileId}
                    className="text-[11px] font-medium leading-none text-[var(--os-text-secondary)]"
                  >
                    Tipo de archivo
                  </label>
                  <select
                    id={selFileId}
                    className="ui-select h-8 w-full min-w-0 py-0 text-xs"
                    value={exportFormat}
                    onChange={(e) => {
                      const nextFormat = e.target.value as
                        | 'mp4'
                        | 'webm'
                        | 'gif'
                        | 'png'
                        | 'webp'
                        | 'jpg'
                        | 'avif';
                      setExportFormat(nextFormat);
                      if (nextFormat !== 'mp4' && socialPlatform !== 'none') {
                        dispatch({ type: 'UPDATE_PROJECT', payload: { socialExport: undefined } });
                      }
                    }}
                    title="Contenedor o imagen de salida"
                  >
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                    <option value="gif">GIF</option>
                    <option value="png">PNG</option>
                    <option value="webp">WEBP</option>
                    <option value="jpg">JPG</option>
                    <option value="avif">AVIF</option>
                  </select>
                </div>
              </fieldset>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setExportOptionsOpen(false);
            void handleExport();
          }}
          disabled={isExporting}
          className="h-8 min-w-[6.5rem] shrink-0 px-3"
        >
          <icons.download size={16} aria-hidden />
          <span className="ml-1">
            {isExporting
              ? exportProgress !== null
                ? `${exportProgress}%`
                : '…'
              : 'Export'}
          </span>
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
          <div className="relative shrink-0" ref={moreMenuRef}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={HDR_DROP_TRIGGER}
              aria-expanded={moreMenuOpen}
              aria-haspopup="menu"
              aria-label="Más opciones: intercambio y atajos"
              onClick={() => setMoreMenuOpen((o) => !o)}
            >
              <MoreHorizontal size={16} strokeWidth={2} className="shrink-0 text-[var(--os-text-secondary)]" aria-hidden />
              <span className="text-xs">Más</span>
              <icons.chevronDown size={14} className={hdrChevron(moreMenuOpen)} aria-hidden />
            </Button>
            {moreMenuOpen && (
              <div className={cn(HDR_DROP_PANEL, hdrDropPanelAlign('end'), 'py-1')} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={cn(HDR_MENU_ITEM, 'disabled:cursor-not-allowed disabled:opacity-40')}
                  disabled={!project || isExporting}
                  onClick={() => {
                    setMoreMenuOpen(false);
                    void handleExportInterchange();
                  }}
                >
                  <icons.folder size={14} className="text-[var(--os-text-secondary)]" aria-hidden />
                  Exportar OTIO/MLT
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={cn(HDR_MENU_ITEM, 'disabled:cursor-not-allowed disabled:opacity-40')}
                  disabled={!project || isExporting}
                  onClick={() => {
                    setMoreMenuOpen(false);
                    interchangeInputRef.current?.click();
                  }}
                >
                  <icons.upload size={14} className="text-[var(--os-text-secondary)]" aria-hidden />
                  Importar OTIO/MLT
                </button>
                <div className="my-0.5 h-px bg-[var(--os-border-default)]/80" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  className={HDR_MENU_ITEM}
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setShowShortcuts(true);
                  }}
                >
                  <icons.keyboard size={14} className="text-[var(--os-text-secondary)]" aria-hidden />
                  Atajos de teclado
                </button>
              </div>
            )}
          </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={interchangeInputRef}
        type="file"
        accept=".json,.otio,.xml,.mlt"
        className="hidden"
        onChange={(e) => void handleImportInterchange(e)}
      />

      {exportMessage && (
        <div className="absolute inset-x-0 top-14 flex justify-center pointer-events-none">
          <div className="bg-[var(--os-media-card-bg)]/95 border border-[var(--os-border-default)] rounded-[10px] px-3 py-1 text-xs text-[var(--os-text-primary)] pointer-events-auto shadow-lg">
            {exportMessage}
          </div>
        </div>
      )}

      {showShortcuts &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] isolate flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowShortcuts(false);
            }}
          >
            <div className="my-auto w-full max-w-5xl overflow-hidden rounded-xl border border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="px-4 pt-4 text-lg font-semibold text-[var(--os-text-primary)]">Atajos de teclado</h2>
                <button
                  className="mr-4 mt-4 text-[var(--os-text-secondary)] hover:text-[var(--os-text-primary)]"
                  onClick={() => setShowShortcuts(false)}
                >
                  <icons.close size={16} />
                </button>
              </div>
              <div className="px-4 pb-4">
                <div className="overflow-hidden rounded-lg border border-[var(--os-border-default)]">
                  <div className="grid grid-cols-3 border-b border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-3 py-2 text-xs font-semibold text-[var(--os-text-secondary)]">
                    <span>Comandos</span>
                    <span>Windows</span>
                    <span>macOS</span>
                  </div>
                  <div className="divide-y divide-[var(--os-border-default)] text-xs text-[var(--os-text-primary)]">
                    {[
                      ['Reproducir / Pausar', 'Espacio', 'Espacio'],
                      ['Detener y volver al inicio', 'K', 'K'],
                      ['Fotograma anterior / siguiente', '← / →', '← / →'],
                      ['Partir clip en el cabezal', 'S', 'S'],
                      ['Agregar introducción / cierre', 'I / O', 'I / O'],
                      ['Ocultar / mostrar timeline', 'T', 'T'],
                      ['Silenciar pista objetivo', 'M', 'M'],
                      ['Zoom timeline', '+ / -', '+ / -'],
                      ['Deshacer / Rehacer', 'Ctrl+Z / Ctrl+Shift+Z', 'Cmd+Z / Cmd+Shift+Z'],
                      ['Eliminar clips seleccionados', 'Supr / Retroceso', 'Supr / Retroceso'],
                      ['Selección múltiple timeline', 'Ctrl + clic', 'Cmd + clic'],
                    ].map(([label, win, mac]) => (
                      <div key={label} className="grid grid-cols-3 px-3 py-2">
                        <span>{label}</span>
                        <span className="font-mono text-[var(--os-text-secondary)]">{win}</span>
                        <span className="font-mono text-[var(--os-text-secondary)]">{mac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      {showRecordingSetup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowRecordingSetup(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-xl border border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-[var(--os-text-primary)] font-semibold">Recording Setup</h3>
              <button className="text-[var(--os-text-secondary)]" onClick={() => setShowRecordingSetup(false)}>
                <icons.close size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--os-text-muted)] mt-1">
              Configure your capture before sharing the screen.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] p-3 text-left"
                onClick={() => setRecordingCamera((v) => !v)}
              >
                <p className="text-xs text-[var(--os-text-primary)]">Camera</p>
                <p className="text-[11px] text-[var(--os-text-muted)]">{recordingCamera ? 'On' : 'Off'}</p>
              </button>
              <button
                className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] p-3 text-left"
                onClick={() => setRecordingMic((v) => !v)}
              >
                <p className="text-xs text-[var(--os-text-primary)]">Microphone</p>
                <p className="text-[11px] text-[var(--os-text-muted)]">{recordingMic ? 'On' : 'Off'}</p>
              </button>
            </div>
            <div className="mt-3">
              <label className="text-xs text-[var(--os-text-secondary)]">System Audio</label>
              <select
                className="mt-1 ui-select"
                value={recordingAudio}
                onChange={(e) =>
                  setRecordingAudio(e.target.value as 'none' | 'system' | 'microphone')
                }
              >
                <option value="none">None</option>
                <option value="system">System audio</option>
                <option value="microphone">Microphone only</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRecordingSetup(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleRecord}>
                Share screen
              </Button>
            </div>
          </div>
        </div>
      )}
      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        title="Nuevo proyecto"
        onComplete={handleNewProjectComplete}
      />
    </header>
  );
}