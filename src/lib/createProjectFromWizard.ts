import type { Project, SocialExportSettings } from '@/types';
import { PRESETS } from '@/types';
import { BUILTIN_TEMPLATES } from '@/lib/templates';
import {
  createBlankProject,
  ensureMotionEditorProjectDefaults,
  type ProjectAspectFormat,
} from '@/lib/projectFactory';

export type NewProjectStartMode = 'blank' | 'template';

export type NewProjectWizardValues = {
  name: string;
  startMode: NewProjectStartMode;
  /** Solo si startMode === 'template' */
  templateId: string | null;
  /** En plantillas se fuerza 16:9 al construir. */
  aspect: ProjectAspectFormat;
  fps: 24 | 25 | 30 | 60;
  durationSeconds: 30 | 60 | 90 | 120;
  sceneBackground: string;
  /** En lienzo en blanco ajusta resolución/FPS; en plantilla solo guarda preset de exportación. */
  socialExport: SocialExportSettings | null;
};

const TEMPLATE_CANVAS = { width: PRESETS['1080p'].width, height: PRESETS['1080p'].height };

export function buildProjectFromWizard(values: NewProjectWizardValues): Project {
  const name = values.name.trim() || 'Sin título';
  const { fps, durationSeconds, sceneBackground, startMode, templateId, aspect, socialExport } = values;

  if (startMode === 'blank') {
    return createBlankProject(name, aspect, {
      fps,
      duration: durationSeconds,
      backgroundColor: sceneBackground,
      ...(socialExport ? { socialExport } : {}),
    });
  }

  const tpl = templateId ? BUILTIN_TEMPLATES.find((t) => t.id === templateId) : undefined;
  if (!tpl) {
    return createBlankProject(name, aspect, {
      fps,
      duration: durationSeconds,
      backgroundColor: sceneBackground,
      ...(socialExport ? { socialExport } : {}),
    });
  }

  const built = tpl.buildProject();
  const merged = ensureMotionEditorProjectDefaults({
    ...built,
    name,
    width: TEMPLATE_CANVAS.width,
    height: TEMPLATE_CANVAS.height,
    fps,
    duration: durationSeconds,
    background: built.background ?? {
      type: 'solid',
      color: sceneBackground,
      blur: 0,
    },
  });

  if (values.socialExport) {
    return { ...merged, socialExport: values.socialExport };
  }
  return merged;
}
