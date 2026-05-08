import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Clapperboard,
  Sparkles,
  Scissors,
  Captions,
  Target,
  Wand2,
  Mic2,
  UserCircle2,
  KeyRound,
  Gauge,
} from 'lucide-react';

export default function ShortsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl p-6 space-y-5">
        <header className="rounded-2xl border border-[#24314b] bg-gradient-to-br from-[#0e1728] via-[#0d1422] to-[#0a111d] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs text-[#8ea3ce]">Open Studio / Crear Shorts</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Shorts Studio
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-[#a7bbdf]">
                Diseñado para flujos tipo OpusClip: transforma videos largos en clips 9:16 o crea
                anuncios UGC con IA listos para publicar.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#2f4369] bg-[#13203a] px-4 py-2 text-xs font-medium text-[#cfe1ff] hover:bg-[#1a2a4b]"
            >
              Volver al dashboard <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatChip label="Formato objetivo" value="9:16 vertical" />
            <StatChip label="Tiempo por short" value="3-10 min aprox." />
            <StatChip label="Salida" value="TikTok / Reels / Shorts" />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#1f2a3f] bg-[#0b1220] p-5 shadow-[0_10px_30px_rgba(2,8,23,0.35)]">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2b3a58] bg-[#121c30] px-3 py-1 text-xs text-[#b7c8ee]">
                <Clapperboard size={13} /> Clip Generator
              </div>
              <span className="rounded-full bg-[#173156] px-2 py-1 text-[10px] font-semibold text-[#a9d3ff]">
                RECOMENDADO
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold md:text-2xl">
              Recorta videos largos en shorts 9:16
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9fb0d6]">
              Sube un podcast, webinar o stream y obtén clips verticales con estilo short:
              detección de momentos, subtítulos y formato social.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <FeaturePill icon={<Target size={13} />} text="Detección viral" />
              <FeaturePill icon={<Scissors size={13} />} text="Auto clip" />
              <FeaturePill icon={<Captions size={13} />} text="Subtítulos" />
            </div>
            <div className="mt-4 rounded-xl border border-[#23314b] bg-[#0e1727] p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#8ea3ce]">
                Flujo Clip Generator (OpenShorts)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#b8caee] sm:grid-cols-4">
                <StepBadge step="1" label="Upload" />
                <StepBadge step="2" label="Analyze" />
                <StepBadge step="3" label="Generate Clips" />
                <StepBadge step="4" label="Review & Export" />
              </div>
              <p className="mt-3 text-xs text-[#90a6cf]">
                Igual que OpenShorts: ingesta de video, detección de momentos virales, recorte
                vertical y salida para TikTok/Reels/YouTube Shorts.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/clip-generator"
                className="inline-flex items-center gap-2 rounded-full bg-[#2f9fe8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#45b4ff] transition-colors"
              >
                Iniciar Clip Generator <ArrowRight size={14} />
              </Link>
              <span className="text-[11px] text-[#8296bd]">Ideal para podcast y entrevistas</span>
            </div>
          </article>

          <article className="rounded-2xl border border-[#1f2a3f] bg-[#0b1220] p-5 shadow-[0_10px_30px_rgba(2,8,23,0.35)]">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2b3a58] bg-[#121c30] px-3 py-1 text-xs text-[#b7c8ee]">
                <Sparkles size={13} /> AI Shorts
              </div>
              <span className="rounded-full bg-[#3c1f67] px-2 py-1 text-[10px] font-semibold text-[#e0c5ff]">
                UGC + IA
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold md:text-2xl">Genera videos UGC con IA</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9fb0d6]">
              Crea un short de marketing desde una URL o descripción. Ideal para productos,
              servicios y campañas con narración y estructura lista para publicar.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <FeaturePill icon={<Wand2 size={13} />} text="Guion IA" />
              <FeaturePill icon={<UserCircle2 size={13} />} text="Actor/avatar" />
              <FeaturePill icon={<Mic2 size={13} />} text="Voz sintética" />
            </div>
            <div className="mt-4 rounded-xl border border-[#2b2352] bg-[#151129] p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#b99be8]">
                Pipeline AI Shorts
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#cfb9f6] sm:grid-cols-5">
                <StepBadge step="0" label="Setup" tone="violet" />
                <StepBadge step="1" label="Analysis" tone="violet" />
                <StepBadge step="2" label="Configure" tone="violet" />
                <StepBadge step="3" label="Generate" tone="violet" />
                <StepBadge step="4" label="Result" tone="violet" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-[#3f3268] bg-[#1b1533] px-3 py-2 text-xs text-[#dbc9ff]">
                  <p className="font-semibold flex items-center gap-1">
                    <Gauge size={12} /> Modo Low Cost
                  </p>
                  <p className="mt-1 text-[#c4afe9]">~$0.65 por video (aprox.)</p>
                </div>
                <div className="rounded-lg border border-[#3f3268] bg-[#1b1533] px-3 py-2 text-xs text-[#dbc9ff]">
                  <p className="font-semibold flex items-center gap-1">
                    <Sparkles size={12} /> Modo Premium
                  </p>
                  <p className="mt-1 text-[#c4afe9]">~$2.00 por video (aprox.)</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/ai-shorts"
                className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9355ff] transition-colors"
              >
                Iniciar AI Shorts <ArrowRight size={14} />
              </Link>
              <span className="text-[11px] text-[#9f8ac7]">Ideal para ads y contenido UGC</span>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-[#22304a] bg-[#0c1322] p-4">
          <p className="text-[11px] uppercase tracking-wide text-[#90a6cf]">Requisitos de Setup</p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4 text-xs">
            <SetupChip icon={<KeyRound size={13} />} label="Gemini API Key" />
            <SetupChip icon={<KeyRound size={13} />} label="fal.ai Key (AI Shorts)" />
            <SetupChip icon={<KeyRound size={13} />} label="ElevenLabs Key" />
            <SetupChip icon={<KeyRound size={13} />} label="Upload-Post Key" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#2a3a58] bg-[#101a2d] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[#8ea3ce]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#ecf3ff]">{value}</p>
    </div>
  );
}

function FeaturePill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-[#2b3a58] bg-[#111a2c] px-2.5 py-2 text-xs text-[#c0d1f3]">
      <span className="text-[#6cbcff]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function StepBadge({
  step,
  label,
  tone = 'blue',
}: {
  step: string;
  label: string;
  tone?: 'blue' | 'violet';
}) {
  const classes =
    tone === 'violet'
      ? 'border-[#4a3a75] bg-[#1f1838] text-[#d6c3ff]'
      : 'border-[#2d4266] bg-[#12203a] text-[#c6dbff]';
  return (
    <div className={`rounded-md border px-2 py-1.5 ${classes}`}>
      <span className="text-[10px] opacity-80">Step {step}</span>
      <p className="mt-0.5 text-[11px] font-medium">{label}</p>
    </div>
  );
}

function SetupChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-[#2a3a58] bg-[#101a2d] px-3 py-2 text-[#c8d9fb] flex items-center gap-2">
      <span className="text-[#71b6ff]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
