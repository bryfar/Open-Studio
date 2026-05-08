'use client';

import { useEditorStore } from '@/features/editor/store/editorStore';
import type { Project } from '@/shared/types';

const defaultTimelinePro: NonNullable<Project['timelinePro']> = {
  rippleEdit: true,
  slipMode: false,
  slideMode: false,
  snapStrength: 0.8,
  snapToMarkers: true,
  snapToClipEdges: true,
  snapToRegions: true,
  trackTargeting: { video: true, audio: true, text: true },
};

export function TimelineProPanel() {
  const { project, dispatch } = useEditorStore();
  const timelinePro = project?.timelinePro ?? defaultTimelinePro;

  const patch = (next: NonNullable<Project['timelinePro']>) =>
    dispatch({ type: 'UPDATE_PROJECT', payload: { timelinePro: next } });

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <p className="text-[11px] text-zinc-400">Timeline Pro: ripple, slip, slide, snap y targeting.</p>
      <label className="flex items-center gap-2"><input type="checkbox" checked={timelinePro.rippleEdit} onChange={(e)=>patch({...timelinePro, rippleEdit:e.target.checked})}/> Ripple edit</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={timelinePro.slipMode} onChange={(e)=>patch({...timelinePro, slipMode:e.target.checked})}/> Slip mode</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={timelinePro.slideMode} onChange={(e)=>patch({...timelinePro, slideMode:e.target.checked})}/> Slide mode</label>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2">
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Snap strength</label>
        <input type="range" min={0} max={1} step={0.05} value={timelinePro.snapStrength} onChange={(e)=>patch({...timelinePro, snapStrength:Number(e.target.value)})} className="w-full"/>
      </div>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 space-y-1.5">
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Snap targets</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={timelinePro.snapToClipEdges} onChange={(e)=>patch({...timelinePro, snapToClipEdges:e.target.checked})}/> Clip edges</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={timelinePro.snapToMarkers} onChange={(e)=>patch({...timelinePro, snapToMarkers:e.target.checked})}/> Markers</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={timelinePro.snapToRegions} onChange={(e)=>patch({...timelinePro, snapToRegions:e.target.checked})}/> Regions</label>
      </div>
    </div>
  );
}
