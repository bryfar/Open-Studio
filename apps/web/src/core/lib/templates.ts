import type { Clip, Project, Track } from '@/shared/types';
import { DEFAULT_TRANSFORM, PRESETS } from '@/shared/types';
import { generateId } from '@/shared/utils';

export type TemplateId =
  | 'title-intro'
  | 'lower-third'
  | 'jitter-starter-kit'
  | 'jitter-search-reveal'
  | 'jitter-notification-pop'
  | 'jitter-glow-button'
  | 'hera-starter-kit'
  | 'hera-launch-card'
  | 'hera-map-callout'
  | 'hera-chart-burst';

export interface ProjectTemplate {
  id: TemplateId;
  name: string;
  description: string;
  source: 'jitter' | 'hera' | 'native';
  buildProject: () => Project;
}

function buildTextClip(
  trackId: string,
  name: string,
  text: string,
  startTime: number,
  duration: number,
  x: number,
  y: number,
  fontSize: number
): Clip {
  return {
    id: generateId(),
    trackId,
    name,
    type: 'text',
    startTime,
    duration,
    volume: 1,
    transform: {
      ...DEFAULT_TRANSFORM,
      x,
      y,
    },
    effects: [],
    keyframes: {
      positionX: [],
      positionY: [],
      scaleX: [],
      scaleY: [],
      rotation: [],
      opacity: [],
    },
    text,
    fontSize,
    color: '#ffffff',
  };
}

function baseProject(name: string, duration: number): Project {
  const videoTrack: Track = {
    id: generateId(),
    name: 'Video Track 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };
  const audioTrack: Track = {
    id: generateId(),
    name: 'Audio Track 1',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };
  const textTrack: Track = {
    id: generateId(),
    name: 'Text Track 1',
    type: 'text',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };

  return {
    id: generateId(),
    name,
    width: PRESETS['1080p'].width,
    height: PRESETS['1080p'].height,
    fps: 30,
    duration,
    tracks: [videoTrack, audioTrack, textTrack],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const titleIntroTemplate: ProjectTemplate = {
  id: 'title-intro',
  name: 'Title Intro',
  description: 'Intro de titulo con entrada suave.',
  source: 'native',
  buildProject: () => {
    const project = baseProject('Template - Title Intro', 8);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;

    const clip = buildTextClip(
      textTrack.id,
      'Main Title',
      'Your Product',
      0.5,
      5,
      320,
      420,
      84
    );
    clip.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.6, value: 1, easing: 'ease-out' },
      { id: generateId(), time: 4.2, value: 1, easing: 'linear' },
      { id: generateId(), time: 5, value: 0, easing: 'ease-in' },
    ];
    clip.keyframes.positionY = [
      { id: generateId(), time: 0, value: 500, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 420, easing: 'ease-out' },
    ];

    textTrack.clips.push(clip);
    return project;
  },
};

const lowerThirdTemplate: ProjectTemplate = {
  id: 'lower-third',
  name: 'Lower Third',
  description: 'Nombre + cargo para entrevistas o demos.',
  source: 'native',
  buildProject: () => {
    const project = baseProject('Template - Lower Third', 10);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;

    const nameClip = buildTextClip(
      textTrack.id,
      'Name',
      'Jane Doe',
      1,
      6,
      120,
      900,
      56
    );
    nameClip.keyframes.positionX = [
      { id: generateId(), time: 0, value: -300, easing: 'ease-out' },
      { id: generateId(), time: 0.7, value: 120, easing: 'ease-out' },
    ];

    const roleClip = buildTextClip(
      textTrack.id,
      'Role',
      'Product Designer',
      1.2,
      5.6,
      128,
      968,
      34
    );
    roleClip.color = '#a1a1aa';
    roleClip.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.5, value: 1, easing: 'ease-out' },
    ];

    textTrack.clips.push(nameClip, roleClip);
    return project;
  },
};

const jitterSearchRevealTemplate: ProjectTemplate = {
  id: 'jitter-search-reveal',
  name: 'Search Bar Reveal',
  description: 'Inspirado en plantillas de interfaces animadas.',
  source: 'jitter',
  buildProject: () => {
    const project = baseProject('Template - Search Bar Reveal', 6);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;
    const clip = buildTextClip(textTrack.id, 'Search Query', 'motion editor', 0.4, 4.8, 160, 430, 48);
    clip.keyframes.scaleX = [
      { id: generateId(), time: 0, value: 0.9, easing: 'ease-out' },
      { id: generateId(), time: 0.6, value: 1, easing: 'ease-out' },
    ];
    clip.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.5, value: 1, easing: 'ease-out' },
    ];
    textTrack.clips.push(clip);
    return project;
  },
};

const jitterStarterKitTemplate: ProjectTemplate = {
  id: 'jitter-starter-kit',
  name: 'Starter Kit A',
  description: 'Pack base con titular, sublinea y CTA animado.',
  source: 'jitter',
  buildProject: () => {
    const project = baseProject('Template - Starter Kit A', 9);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;

    const headline = buildTextClip(
      textTrack.id,
      'Headline',
      'Animate your product story',
      0.4,
      6.8,
      160,
      240,
      72
    );
    headline.keyframes.positionY = [
      { id: generateId(), time: 0, value: 320, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 240, easing: 'ease-out' },
    ];
    headline.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.7, value: 1, easing: 'ease-out' },
    ];

    const subline = buildTextClip(
      textTrack.id,
      'Subline',
      'Template inspired for SaaS launches',
      1,
      6.2,
      170,
      340,
      34
    );
    subline.color = '#a1a1aa';
    subline.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.6, value: 1, easing: 'ease-out' },
    ];

    const cta = buildTextClip(
      textTrack.id,
      'CTA',
      'Try it now',
      2.2,
      4.5,
      420,
      500,
      44
    );
    cta.color = '#22d3ee';
    cta.keyframes.scaleX = [
      { id: generateId(), time: 0, value: 0.85, easing: 'ease-out' },
      { id: generateId(), time: 0.4, value: 1.05, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 1, easing: 'ease-in-out' },
    ];
    cta.keyframes.scaleY = [
      { id: generateId(), time: 0, value: 0.85, easing: 'ease-out' },
      { id: generateId(), time: 0.4, value: 1.05, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 1, easing: 'ease-in-out' },
    ];

    textTrack.clips.push(headline, subline, cta);
    return project;
  },
};

const jitterNotificationPopTemplate: ProjectTemplate = {
  id: 'jitter-notification-pop',
  name: 'Notification Pop',
  description: 'Badge/notification style motion.',
  source: 'jitter',
  buildProject: () => {
    const project = baseProject('Template - Notification Pop', 7);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;
    const clip = buildTextClip(textTrack.id, 'Notification', 'Payment received', 0.8, 4.8, 280, 240, 50);
    clip.keyframes.scaleX = [
      { id: generateId(), time: 0, value: 0.4, easing: 'ease-out' },
      { id: generateId(), time: 0.45, value: 1.08, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 1, easing: 'ease-in-out' },
    ];
    clip.keyframes.scaleY = [
      { id: generateId(), time: 0, value: 0.4, easing: 'ease-out' },
      { id: generateId(), time: 0.45, value: 1.08, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 1, easing: 'ease-in-out' },
    ];
    textTrack.clips.push(clip);
    return project;
  },
};

const jitterGlowButtonTemplate: ProjectTemplate = {
  id: 'jitter-glow-button',
  name: 'Glow Button CTA',
  description: 'CTA animado estilo Interactive Button.',
  source: 'jitter',
  buildProject: () => {
    const project = baseProject('Template - Glow Button', 6);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;
    const clip = buildTextClip(textTrack.id, 'CTA', 'Start Free Trial', 1, 4, 360, 500, 44);
    clip.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0.3, easing: 'ease-in-out' },
      { id: generateId(), time: 0.8, value: 1, easing: 'ease-in-out' },
      { id: generateId(), time: 1.6, value: 0.55, easing: 'ease-in-out' },
      { id: generateId(), time: 2.4, value: 1, easing: 'ease-in-out' },
    ];
    textTrack.clips.push(clip);
    return project;
  },
};

const heraLaunchCardTemplate: ProjectTemplate = {
  id: 'hera-launch-card',
  name: 'Launch Card',
  description: 'Estilo launch video con foco de producto.',
  source: 'hera',
  buildProject: () => {
    const project = baseProject('Template - Launch Card', 8);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;
    const headline = buildTextClip(textTrack.id, 'Headline', 'Your AI Motion Designer', 0.5, 5.8, 180, 240, 68);
    headline.keyframes.positionY = [
      { id: generateId(), time: 0, value: 300, easing: 'ease-out' },
      { id: generateId(), time: 0.7, value: 240, easing: 'ease-out' },
    ];
    const sub = buildTextClip(textTrack.id, 'Subline', 'Create studio-quality launch videos', 1, 5.2, 220, 340, 36);
    sub.color = '#a1a1aa';
    textTrack.clips.push(headline, sub);
    return project;
  },
};

const heraStarterKitTemplate: ProjectTemplate = {
  id: 'hera-starter-kit',
  name: 'Starter Kit B',
  description: 'Pack base con opening cinematic y bloques de metricas.',
  source: 'hera',
  buildProject: () => {
    const project = baseProject('Template - Starter Kit B', 10);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;

    const opening = buildTextClip(
      textTrack.id,
      'Opening',
      'Present with confidence',
      0.5,
      7.2,
      190,
      220,
      66
    );
    opening.keyframes.positionX = [
      { id: generateId(), time: 0, value: 300, easing: 'ease-out' },
      { id: generateId(), time: 0.7, value: 190, easing: 'ease-out' },
    ];
    opening.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 1, easing: 'ease-out' },
    ];

    const metricA = buildTextClip(
      textTrack.id,
      'Metric A',
      '+48% activation',
      2,
      5,
      220,
      430,
      44
    );
    metricA.color = '#22d3ee';
    metricA.keyframes.positionY = [
      { id: generateId(), time: 0, value: 470, easing: 'ease-out' },
      { id: generateId(), time: 0.6, value: 430, easing: 'ease-out' },
    ];

    const metricB = buildTextClip(
      textTrack.id,
      'Metric B',
      '1.8M impressions',
      2.4,
      4.7,
      220,
      500,
      36
    );
    metricB.color = '#a1a1aa';
    metricB.keyframes.opacity = [
      { id: generateId(), time: 0, value: 0, easing: 'ease-out' },
      { id: generateId(), time: 0.5, value: 1, easing: 'ease-out' },
    ];

    textTrack.clips.push(opening, metricA, metricB);
    return project;
  },
};

const heraMapCalloutTemplate: ProjectTemplate = {
  id: 'hera-map-callout',
  name: 'Map Callout',
  description: 'Callout motion para mapas/datos.',
  source: 'hera',
  buildProject: () => {
    const project = baseProject('Template - Map Callout', 9);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;
    const city = buildTextClip(textTrack.id, 'City', 'Mexico City', 1, 5.6, 700, 420, 52);
    city.keyframes.positionX = [
      { id: generateId(), time: 0, value: 950, easing: 'ease-out' },
      { id: generateId(), time: 0.8, value: 700, easing: 'ease-out' },
    ];
    const value = buildTextClip(textTrack.id, 'Metric', '+42% Growth', 1.6, 4.8, 720, 500, 40);
    value.color = '#22d3ee';
    textTrack.clips.push(city, value);
    return project;
  },
};

const heraChartBurstTemplate: ProjectTemplate = {
  id: 'hera-chart-burst',
  name: 'Chart Burst',
  description: 'Template de gráfico/estadística rápida.',
  source: 'hera',
  buildProject: () => {
    const project = baseProject('Template - Chart Burst', 7);
    const textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) return project;
    const stat = buildTextClip(textTrack.id, 'Stat', '1.2M Views', 0.7, 4.5, 350, 360, 82);
    stat.keyframes.scaleX = [
      { id: generateId(), time: 0, value: 0.7, easing: 'ease-out' },
      { id: generateId(), time: 0.5, value: 1, easing: 'ease-out' },
    ];
    stat.keyframes.scaleY = [
      { id: generateId(), time: 0, value: 0.7, easing: 'ease-out' },
      { id: generateId(), time: 0.5, value: 1, easing: 'ease-out' },
    ];
    textTrack.clips.push(stat);
    return project;
  },
};

export const BUILTIN_TEMPLATES: ProjectTemplate[] = [
  titleIntroTemplate,
  lowerThirdTemplate,
  jitterStarterKitTemplate,
  jitterSearchRevealTemplate,
  jitterNotificationPopTemplate,
  jitterGlowButtonTemplate,
  heraStarterKitTemplate,
  heraLaunchCardTemplate,
  heraMapCalloutTemplate,
  heraChartBurstTemplate,
];

