'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

/** «none» = export genérico; el resto coincide con `SocialExportPlatform` en el proyecto. */
type SocialPlatform = 'none' | SocialExportPlatform;

export function Header() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const interchangeInputRef = useRef<HTMLInputElement>(null);

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
    if (!showShortcuts && !showRecordingSetup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowRecordingSetup(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showShortcuts, showRecordingSetup]);

  const socialPlatform: SocialPlatform = project?.socialExport?.platform ?? 'none';
  const socialVariantId =
    socialPlatform === 'none'
      ? ''
      : project?.socialExport?.variantId ??
        SOCIAL_VARIANTS_BY_PLATFORM[socialPlatform][0]?.id ??
        'vertical';

  const socialVariants =
    socialPlatform !== 'none' ? SOCIAL_VARIANTS_BY_PLATFORM[socialPlatform] : [];

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
    <header className="relative z-10 flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-gradient-to-b from-[#141a26] via-[#0f131c] to-[#0a0d12] px-4 shadow-[0_4px_28px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <icons.play className="text-white" size={12} />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Open Studio</span>
        </div>

        <div className="h-5 w-px bg-[#2a3348]" />

        <div className="relative flex min-w-0 max-w-[220px] items-center gap-0.5" ref={projectMenuRef}>
          {editingProjectName && project ? (
            <input
              ref={projectNameInputRef}
              type="text"
              className="min-w-0 flex-1 rounded-md border border-[#2a3348] bg-[#0f1522] px-2 py-1 text-xs font-medium text-[#dce6ff] outline-none focus:ring-1 focus:ring-sky-400"
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
            <>
              <span
                role="button"
                tabIndex={0}
                className="min-w-0 flex-1 cursor-text truncate rounded-md px-2 py-1 text-left text-xs font-medium text-[#dce6ff] hover:bg-[#1a2235] outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
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
                className="shrink-0 rounded-md px-1 py-1 text-[#dce6ff] hover:bg-[#1a2235] disabled:opacity-40"
                onClick={() => setProjectMenuOpen((o) => !o)}
                disabled={!project}
                aria-label="Menú del proyecto"
                aria-expanded={projectMenuOpen}
              >
                <icons.chevronDown size={14} className="text-[#8fa0c5]" />
              </button>
            </>
          )}
          {projectMenuOpen && !editingProjectName && project && (
            <div
              className="absolute left-0 top-[calc(100%+4px)] z-40 w-52 rounded-lg border border-[#2a3348] bg-[#0f1522] py-1 shadow-xl"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#dce6ff] hover:bg-[#1a2438]"
                onClick={goToDashboard}
              >
                <icons.layoutGrid size={14} className="text-[#8fa0c5]" />
                Mis proyectos
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#dce6ff] hover:bg-[#1a2438]"
                onClick={beginProjectNameEdit}
              >
                <icons.pencil size={14} className="text-[#8fa0c5]" />
                Renombrar…
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!urlProjectId}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={handleDeleteFromMenu}
              >
                <icons.trash size={14} />
                Eliminar proyecto
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[#2a3348]" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewProject}
            aria-label="Nuevo proyecto: abrir asistente de configuración"
          >
            <icons.plus size={16} aria-hidden />
            <span className="ml-1 text-xs">Nuevo</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleImportMedia}>
            <icons.folder size={16} />
            <span className="ml-1 text-xs">Import</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={!project || isSaving}>
            <icons.save size={16} />
            <span className="ml-1 text-xs">{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant={isRecording ? 'danger' : 'secondary'}
          size="sm"
          onClick={() => (isRecording ? handleRecord() : setShowRecordingSetup(true))}
        >
          <icons.screen size={16} />
          <span className="ml-1">{isRecording ? 'Stop' : 'Record'}</span>
        </Button>
        <select
          className="ui-select w-fit"
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
          title="Plataforma de destino para optimizar el MP4"
        >
          <option value="none">Sin optimizar</option>
          <option value="tiktok">TikTok</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="linkedin">LinkedIn</option>
          <option value="x">X</option>
        </select>
        <select
          className="ui-select min-w-[168px] max-w-[220px]"
          value={socialPlatform === 'none' ? '' : socialVariantId}
          disabled={socialPlatform === 'none'}
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
          title="Formato de publicación (relación de aspecto)"
        >
          {socialPlatform === 'none' ? (
            <option value="">Formato…</option>
          ) : (
            socialVariants.map((v) => (
              <option key={v.id} value={v.id} title={v.label}>
                {v.label}
              </option>
            ))
          )}
        </select>
        <select
          className="ui-select w-[88px]"
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
        >
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
          <option value="gif">GIF</option>
          <option value="png">PNG</option>
          <option value="webp">WEBP</option>
          <option value="jpg">JPG</option>
          <option value="avif">AVIF</option>
        </select>

        <Button variant="primary" size="sm" onClick={handleExport} disabled={isExporting}>
          <icons.download size={16} />
          <span className="ml-1">
            {isExporting
              ? exportProgress !== null
                ? `Exporting... ${exportProgress}%`
                : 'Exporting...'
              : 'Export'}
          </span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportInterchange} disabled={!project || isExporting}>
          <icons.folder size={14} />
          <span className="ml-1 text-xs">OTIO/MLT</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => interchangeInputRef.current?.click()} disabled={!project || isExporting}>
          <icons.upload size={14} />
          <span className="ml-1 text-xs">Import OTIO/MLT</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg border border-[#2a3348] bg-[#111827] px-3 text-[#dce7ff] hover:bg-[#1a2438]"
          title="Abrir guía de atajos"
          onClick={() => setShowShortcuts(true)}
        >
          <icons.keyboard size={14} />
          <span className="ml-1 text-xs">Atajos</span>
        </Button>
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
          <div className="bg-[#0f1522]/95 border border-[#2a3348] rounded-[10px] px-3 py-1 text-xs text-[#d8e4ff] pointer-events-auto shadow-lg">
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
            <div className="my-auto w-full max-w-5xl overflow-hidden rounded-xl border border-[#2a3348] bg-[#0f1522] shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="px-4 pt-4 text-lg font-semibold text-[#eef3ff]">Atajos de teclado</h2>
                <button
                  className="mr-4 mt-4 text-[#8fa0c5] hover:text-[#eaf2ff]"
                  onClick={() => setShowShortcuts(false)}
                >
                  <icons.close size={16} />
                </button>
              </div>
              <div className="px-4 pb-4">
                <div className="overflow-hidden rounded-lg border border-[#2a3348]">
                  <div className="grid grid-cols-3 border-b border-[#2a3348] bg-[#121a29] px-3 py-2 text-xs font-semibold text-[#b6c6ea]">
                    <span>Comandos</span>
                    <span>Windows</span>
                    <span>macOS</span>
                  </div>
                  <div className="divide-y divide-[#202a40] text-xs text-[#d6e4ff]">
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
                        <span className="font-mono text-[#95a9d8]">{win}</span>
                        <span className="font-mono text-[#95a9d8]">{mac}</span>
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
          <div className="w-full max-w-2xl rounded-xl border border-[#2a3348] bg-[#0f1522] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-[#eef3ff] font-semibold">Recording Setup</h3>
              <button className="text-[#90a2c8]" onClick={() => setShowRecordingSetup(false)}>
                <icons.close size={16} />
              </button>
            </div>
            <p className="text-xs text-[#7f8db0] mt-1">
              Configure your capture before sharing the screen.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="rounded-xl border border-[#2a3348] bg-[#121827] p-3 text-left"
                onClick={() => setRecordingCamera((v) => !v)}
              >
                <p className="text-xs text-[#dce6ff]">Camera</p>
                <p className="text-[11px] text-[#8190b1]">{recordingCamera ? 'On' : 'Off'}</p>
              </button>
              <button
                className="rounded-xl border border-[#2a3348] bg-[#121827] p-3 text-left"
                onClick={() => setRecordingMic((v) => !v)}
              >
                <p className="text-xs text-[#dce6ff]">Microphone</p>
                <p className="text-[11px] text-[#8190b1]">{recordingMic ? 'On' : 'Off'}</p>
              </button>
            </div>
            <div className="mt-3">
              <label className="text-xs text-[#90a2c8]">System Audio</label>
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