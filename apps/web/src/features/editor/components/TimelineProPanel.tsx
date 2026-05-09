'use client';

import { useEditorStore } from '@/features/editor/store/editorStore';
import type { Project } from '@/shared/types';
import { cn } from '@/shared/utils';
import { ep } from '@/features/editor/components/editorPanelUi';

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
    <div className={ep.root}>
      <p className={ep.intro}>Timeline Pro: ripple, slip, slide, snap y targeting.</p>
      <label className={ep.checkboxRow}>
        <input
          type="checkbox"
          checked={timelinePro.rippleEdit}
          onChange={(e) => patch({ ...timelinePro, rippleEdit: e.target.checked })}
        />
        Ripple edit
      </label>
      <label className={ep.checkboxRow}>
        <input
          type="checkbox"
          checked={timelinePro.slipMode}
          onChange={(e) => patch({ ...timelinePro, slipMode: e.target.checked })}
        />
        Slip mode
      </label>
      <label className={ep.checkboxRow}>
        <input
          type="checkbox"
          checked={timelinePro.slideMode}
          onChange={(e) => patch({ ...timelinePro, slideMode: e.target.checked })}
        />
        Slide mode
      </label>
      <div className={ep.card}>
        <label className={ep.label}>Snap strength</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={timelinePro.snapStrength}
          onChange={(e) => patch({ ...timelinePro, snapStrength: Number(e.target.value) })}
          className={ep.range}
        />
      </div>
      <div className={ep.card}>
        <p className={cn(ep.labelInline, 'mb-2')}>Snap targets</p>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={timelinePro.snapToClipEdges}
            onChange={(e) => patch({ ...timelinePro, snapToClipEdges: e.target.checked })}
          />
          Clip edges
        </label>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={timelinePro.snapToMarkers}
            onChange={(e) => patch({ ...timelinePro, snapToMarkers: e.target.checked })}
          />
          Markers
        </label>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={timelinePro.snapToRegions}
            onChange={(e) => patch({ ...timelinePro, snapToRegions: e.target.checked })}
          />
          Regions
        </label>
      </div>
    </div>
  );
}
