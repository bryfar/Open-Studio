'use client';

import { useMemo, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/utils';
import { ep } from '@/features/editor/components/editorPanelUi';

type VideoMode = 'lowcost' | 'premium';
type Language = 'en' | 'es';
type Style = 'ugc' | 'direct' | 'story' | 'comparison';
type ActorGender = 'female' | 'male';

const STEP_LABELS = ['Setup', 'Analysis', 'Configure', 'Generate', 'Result'] as const;

export function AIShortsPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, dispatch } = useEditorStore();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [offer, setOffer] = useState('');
  const [audience, setAudience] = useState('');
  const [cta, setCta] = useState('Pruebalo gratis hoy');
  const [videoMode, setVideoMode] = useState<VideoMode>('lowcost');
  const [language, setLanguage] = useState<Language>('en');
  const [style, setStyle] = useState<Style>('ugc');
  const [actorGender, setActorGender] = useState<ActorGender>('female');
  const [numScripts, setNumScripts] = useState(3);
  const [selectedScript, setSelectedScript] = useState(0);

  const estimatedCost = useMemo(() => (videoMode === 'lowcost' ? '~$0.65' : '~$2.00'), [videoMode]);
  const scripts = useMemo(
    () =>
      Array.from({ length: numScripts }, (_, i) => ({
        title: `${i + 1}. ${offer || 'Producto'} para ${audience || 'tu audiencia'}`,
        duration: i % 2 === 0 ? 28 : 35,
        style: style.toUpperCase(),
      })),
    [numScripts, offer, audience, style]
  );

  function saveBriefToWorkflow() {
    if (!project) return;
    const lines = [
      '# AI Shorts Brief',
      `- URL: ${url || 'N/A'}`,
      `- Producto/servicio: ${offer || description || 'N/A'}`,
      `- Audiencia: ${audience || 'N/A'}`,
      `- CTA: ${cta || 'N/A'}`,
      `- Modo: ${videoMode === 'lowcost' ? 'Low Cost' : 'Premium'} (${estimatedCost})`,
      '',
      '## Script sugerido',
      '[00:00.00] Hook: ',
      '[00:03.00] Problema: ',
      '[00:08.00] Solucion: ',
      '[00:14.00] CTA: ',
    ].join('\n');
    dispatch({ type: 'UPDATE_PROJECT', payload: { textWorkflowNotes: lines } });
    onNotice?.('Brief de AI Shorts enviado a Estudio (guion).');
  }

  if (!project) {
    return <p className="text-xs text-[var(--os-text-muted)]">Abre un proyecto para usar AI Shorts.</p>;
  }

  return (
    <div className={ep.root}>
      <nav className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Pasos del flujo">
        {STEP_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={() => setStep(index)}
            className={cn(
              'shrink-0 min-w-[4.75rem] max-w-[6.75rem] rounded-lg border px-1.5 py-2 text-center transition-colors',
              'focus-visible:shadow-[var(--os-focus-ring)] focus-visible:outline-none',
              step === index ? ep.segOn : ep.segOff
            )}
          >
            <span className="block text-[10px] font-semibold tabular-nums text-[var(--os-text-muted)]">
              {index + 1}
            </span>
            <span className="mt-0.5 block text-[10px] font-medium leading-tight text-[var(--os-text-primary)] line-clamp-2">
              {label}
            </span>
          </button>
        ))}
      </nav>

      <div className={cn(ep.card, 'space-y-2')}>
        <label className={ep.label}>Website URL (opcional)</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tu-producto.com"
          className={ep.field}
        />
        <label className={ep.label}>Descripcion del producto</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Que vendes y por que importa"
          rows={3}
          className={ep.textarea}
        />
        <div className="grid grid-cols-1 gap-2">
          <input
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Oferta principal"
            className={ep.field}
          />
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audiencia objetivo"
            className={ep.field}
          />
          <input
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Llamado a la accion"
            className={ep.field}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={ep.cardTight}>
          <p className={cn(ep.labelInline, 'mb-2')}>Language</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn('flex-1 rounded-md border px-2 py-1.5 text-[11px]', language === 'en' ? ep.segOn : ep.segOff)}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              type="button"
              className={cn('flex-1 rounded-md border px-2 py-1.5 text-[11px]', language === 'es' ? ep.segOn : ep.segOff)}
              onClick={() => setLanguage('es')}
            >
              Espanol
            </button>
          </div>
        </div>
        <div className={ep.cardTight}>
          <p className={cn(ep.labelInline, 'mb-2')}>Actor gender</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                'flex-1 rounded-md border px-2 py-1.5 text-[11px]',
                actorGender === 'female' ? ep.segOn : ep.segOff
              )}
              onClick={() => setActorGender('female')}
            >
              Female
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 rounded-md border px-2 py-1.5 text-[11px]',
                actorGender === 'male' ? ep.segOn : ep.segOff
              )}
              onClick={() => setActorGender('male')}
            >
              Male
            </button>
          </div>
        </div>
      </div>

      <div className={cn(ep.card, 'space-y-2')}>
        <p className={ep.labelInline}>Script style</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['ugc', 'UGC'],
              ['direct', 'Direct response'],
              ['story', 'Storytelling'],
              ['comparison', 'Before/After'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn('rounded-md border px-2 py-1.5 text-[11px]', style === id ? ep.segOn : ep.segOff)}
              onClick={() => setStyle(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={cn(ep.labelInline, 'pt-1')}>Number of scripts</p>
        <div className="flex gap-1">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={cn('flex-1 rounded-md border px-2 py-1 text-[11px]', numScripts === n ? ep.segOn : ep.segOff)}
              onClick={() => setNumScripts(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(ep.card, 'space-y-2')}>
        <p className={ep.labelInline}>Generated Scripts</p>
        <div className="space-y-1.5">
          {scripts.map((s, idx) => (
            <button
              key={`${s.title}-${idx}`}
              type="button"
              className={cn(
                'w-full rounded-md border px-2 py-2 text-left transition-colors',
                selectedScript === idx ? ep.segOn : ep.segOff
              )}
              onClick={() => setSelectedScript(idx)}
            >
              <p className="text-[11px] font-medium">{s.title}</p>
              <p className="text-[10px] text-[var(--os-text-muted)]">
                {s.duration}s · {s.style}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn('rounded-lg border px-2 py-2 text-[11px]', videoMode === 'lowcost' ? ep.segOn : ep.segOff)}
          onClick={() => setVideoMode('lowcost')}
        >
          Low Cost (~$0.65)
        </button>
        <button
          type="button"
          className={cn('rounded-lg border px-2 py-2 text-[11px]', videoMode === 'premium' ? ep.segOn : ep.segOff)}
          onClick={() => setVideoMode('premium')}
        >
          Premium (~$2.00)
        </button>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1 text-[11px]" onClick={saveBriefToWorkflow}>
          Guardar brief en Estudio
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1 text-[11px]"
          onClick={() =>
            onNotice?.('Conecta APIs para generar: Gemini, fal.ai, ElevenLabs, Upload-Post.')
          }
        >
          Ver checklist API
        </Button>
      </div>
    </div>
  );
}
