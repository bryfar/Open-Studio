'use client';

import { useMemo, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';

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
    return <p className="text-xs text-zinc-500">Abre un proyecto para usar AI Shorts.</p>;
  }

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/[0.07] px-3 py-2">
        <p className="text-[11px] font-semibold text-violet-200">AI Shorts (OpenShorts-inspired)</p>
        <p className="mt-1 text-[11px] text-violet-100/85">
          Flujo: Setup → Analysis → Configure → Generate → Result.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {STEP_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`rounded-md border px-1 py-1.5 text-[10px] ${
              step === index
                ? 'border-violet-400 bg-violet-500/20 text-white'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400'
            }`}
            onClick={() => setStep(index)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 space-y-2">
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Website URL (opcional)</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tu-producto.com"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
        />
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Descripcion del producto</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Que vendes y por que importa"
          rows={3}
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
        />
        <div className="grid grid-cols-1 gap-2">
          <input
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Oferta principal"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
          />
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audiencia objetivo"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
          />
          <input
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Llamado a la accion"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Language</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-md border px-2 py-1.5 ${language === 'en' ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md border px-2 py-1.5 ${language === 'es' ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
              onClick={() => setLanguage('es')}
            >
              Espanol
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Actor gender</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-md border px-2 py-1.5 ${actorGender === 'female' ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
              onClick={() => setActorGender('female')}
            >
              Female
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md border px-2 py-1.5 ${actorGender === 'male' ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
              onClick={() => setActorGender('male')}
            >
              Male
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Script style</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['ugc', 'UGC'],
            ['direct', 'Direct response'],
            ['story', 'Storytelling'],
            ['comparison', 'Before/After'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded-md border px-2 py-1.5 text-[11px] ${
                style === id ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
              }`}
              onClick={() => setStyle(id as Style)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Number of scripts</p>
        <div className="flex gap-1">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`flex-1 rounded-md border px-2 py-1 ${numScripts === n ? 'border-violet-400 bg-violet-500/20 text-white' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}
              onClick={() => setNumScripts(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Generated Scripts</p>
        <div className="space-y-1.5">
          {scripts.map((s, idx) => (
            <button
              key={`${s.title}-${idx}`}
              type="button"
              className={`w-full rounded-md border px-2 py-2 text-left ${
                selectedScript === idx
                  ? 'border-violet-400 bg-violet-500/15 text-white'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300'
              }`}
              onClick={() => setSelectedScript(idx)}
            >
              <p className="text-[11px] font-medium">{s.title}</p>
              <p className="text-[10px] text-zinc-500">{s.duration}s · {s.style}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`rounded-lg border px-2 py-2 text-[11px] ${
            videoMode === 'lowcost'
              ? 'border-sky-400 bg-sky-500/20 text-sky-100'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300'
          }`}
          onClick={() => setVideoMode('lowcost')}
        >
          Low Cost (~$0.65)
        </button>
        <button
          type="button"
          className={`rounded-lg border px-2 py-2 text-[11px] ${
            videoMode === 'premium'
              ? 'border-violet-400 bg-violet-500/20 text-violet-100'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300'
          }`}
          onClick={() => setVideoMode('premium')}
        >
          Premium (~$2.00)
        </button>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1 text-[11px]" onClick={saveBriefToWorkflow}>
          Guardar brief en Estudio
        </Button>
        <Button type="button" variant="ghost" className="flex-1 text-[11px]" onClick={() => onNotice?.('Conecta APIs para generar: Gemini, fal.ai, ElevenLabs, Upload-Post.')}>
          Ver checklist API
        </Button>
      </div>
    </div>
  );
}
