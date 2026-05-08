# 🎬 Open Studio

A powerful browser-based video editor with timeline, multi-track support, screen recording, motion graphics, keyframe animations, and video export capabilities.

![License](https://img.shields.io/github/license/bryfar/Open-Studio)
![Version](https://img.shields.io/github/v/release/bryfar/Open-Studio)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

### Core Features
- **Multi-track Timeline** - Video, Audio, Text, and Image tracks
- **Screen Recording** - Record your screen directly in the browser
- **Video Effects** - 60+ effects (Blur, Color, Distort, Stylize, Lighting, Noise, etc.)
- **Color Filters** - 32+ filters (Cinematic, Mood, Vintage, Artistic, Season, Social)
- **Transitions** - 35+ transitions (Dissolve, Wipe, Slide, Zoom, Glitch, etc.)
- **Keyframe Animation** - Animate any property with easing curves
- **Video Export** - Export to MP4, WebM, GIF using FFmpeg.wasm
- **Project Save/Load** - Save projects to IndexedDB

### UI Features
- **Dark Theme** - Professional dark theme inspired by CapCut
- **Keyboard Shortcuts** - Full keyboard control
- **Drag & Drop** - Easy media import
- **Responsive Design** - Works on desktop

### Technology Stack
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Zustand** - Lightweight state management
- **FFmpeg.wasm** - Client-side video processing
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/bryfar/Open-Studio.git

# Navigate to project
cd Open-Studio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the project
npm run build

# Start production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## OpenShorts Modules (Clip Generator + AI Shorts)

This repo now includes dedicated OpenShorts-style routes with a separate FastAPI backend:

- `http://localhost:3000/clip-generator`
- `http://localhost:3000/ai-shorts`

### Monorepo layout

- `apps/web` -> web workspace wrapper (Next.js app in repo root during transition)
- `apps/openstudio-shorts-service` -> FastAPI backend workspace

### Backend setup (FastAPI service)

```bash
cd apps/openstudio-shorts-service
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run frontend + backend together

From repo root:

```bash
npm run dev:full
```

This runs:
- Next.js app on `:3000`
- OpenShorts FastAPI service on `:8000`

### Required API keys (real integrations)

For full generation/publish flows, configure keys in UI inputs or service env:

- Gemini (`GEMINI_API_KEY` / `X-Gemini-Key`)
- fal.ai (`FAL_KEY` / `X-Fal-Key`)
- ElevenLabs (`ELEVENLABS_API_KEY` / `X-ElevenLabs-Key`)
- Upload-Post (`UPLOAD_POST_API_KEY` / `X-Upload-Post-Key`)

### End-to-end test flow

1. Open `/clip-generator`, upload a long video, click `Analyze`, then `Generate Clips`.
2. Open `/ai-shorts`, provide URL or description, click `Analyze`, then `Generate`.
3. For publish flow, provide Upload-Post key and click `Publish`.
4. Monitor progress via job logs (`GET /api/jobs/{job_id}` via UI polling).

## Advanced Editor Roadmap (Shotcut-inspired)

OpenStudio now includes first-pass advanced modules in the editor side panel:

- Audio Pro (buses, ducking, gain controls)
- Timeline Pro (ripple/slip/slide/snap controls)
- Keyframes Graph (easing batch application)
- Scopes (waveform/vectorscope/histogram preview)
- Multicam + Proxy controls
- Batch Render queue presets

Reference project used for advanced feature direction:

- [Shotcut repository](https://github.com/mltframework/shotcut)

License/compliance notes are documented in:

- `GPL_COMPLIANCE.md`

## 📖 Usage Guide

### Creating a Project
1. Open the app
2. Click "New" or use the dashboard
3. Choose resolution (1080p, 720p, 4K, etc.)
4. Start editing!

### Importing Media
1. Click "Import" in the header
2. Select video, audio, or image files
3. Files appear in the Asset Library
4. Click on a file to add it to the timeline

### Editing Timeline
- **Add clips**: Click media in Asset Library
- **Move clips**: Drag on timeline
- **Trim clips**: Drag clip edges
- **Delete clips**: Select + Delete key
- **Split clips**: Press 'S' at playhead

### Using Effects
1. Select a clip on timeline
2. Open "Effects" in Asset Library
3. Click an effect to apply
4. Adjust in Properties Panel

### Using Filters
1. Select a clip
2. Open "Filters" in Asset Library
3. Click a filter to apply
4. Preview in Canvas

### Using Transitions
1. Select a clip
2. Open "Transitions" in Asset Library
3. Choose "In" or "Out"
4. Click transition to apply

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Play/Pause | Space |
| Previous frame | ← |
| Next frame | → |
| Go to start | K |
| Split clip | S |
| Delete | Delete/Backspace |
| Zoom in | + |
| Zoom out | - |
| Undo | Ctrl+Z |
| Redo | Ctrl+Shift+Z |

## 🎨 Effects Library

### Video Effects (60+)
- **Blur**: Gaussian, Motion, Radial, Zoom, Directional
- **Color**: Brightness, Contrast, Saturation, Temperature, Tint
- **Distort**: Spherize, Twirl, Wave, Bulge, Pinch, Mirror
- **Stylize**: Grayscale, Sepia, Invert, Posterize, Mosaic, Glow
- **Generate**: Lens Flare, Light Leak, Grid, Vignette, Noise
- **Lighting**: Bloom, Glow, Neon, Sun Flare

### Filters (32+)
- **Cinematic**: Teal & Orange, Moody, Vibrant, Film Look
- **Mood**: Dark, Warm, Cool, Dreamy, Mysterious
- **Vintage**: 70s, 80s, 90s, VHS, Film, Polaroid
- **Artistic**: Noir, Duotone, Split Tone, Chromatic
- **Season**: Spring, Summer, Autumn, Winter
- **Social**: TikTok, Instagram, YouTube, Sunset

### Transitions (35+)
- **Dissolve**: Cross, Dip Black/White, Film
- **Wipe**: Left, Right, Up, Down, Clock, Radial
- **Slide**: Push, Split, Cube, Flip
- **Zoom**: Cross, In, Out, Ripple, Spin
- **Glitch**: Basic, RGB Split, Digital, Scan Lines

## 📁 Project Structure

```
motion-editor/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Main entry
│   │   ├── dashboard/       # Project dashboard
│   │   ├── editor/          # Editor page
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── editor/          # Editor components
│   │   │   ├── Canvas.tsx       # Video preview
│   │   │   ├── Timeline.tsx    # Multi-track timeline
│   │   │   ├── Header.tsx       # Toolbar
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── AssetLibrary.tsx
│   │   ├── ui/              # UI components
│   │   └── icons.tsx        # Icon definitions
│   ├── stores/              # Zustand stores
│   ├── lib/                 # Utilities
│   │   ├── effectsLibrary.ts   # Effects/filters/transitions
│   │   ├── ffmpeg.ts         # Video export
│   │   ├── recorder.ts      # Screen recording
│   │   └── storage.ts       # IndexedDB storage
│   └── types/               # TypeScript definitions
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for optional features:

```env
# Supabase (optional - for cloud features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Custom Configuration

Edit `src/types/index.ts` to customize:
- Default project settings
- Resolution presets
- Export settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Inspired by:
- [OpenCut](https://github.com/opencut-app/opencut) - Browser-based video editor
- [Remotion](https://github.com/remotion-dev/remotion) - Programmatic video
- [CapCut](https://capcut.com) - Video editing app

## 🐛 Troubleshooting

### Video not playing
- Ensure you're using a modern browser (Chrome, Firefox, Edge)
- Check that the video format is supported (MP4, WebM)

### Export failing
- FFmpeg.wasm requires SharedArrayBuffer support
- Ensure your server has COOP/COEP headers enabled

### Memory issues
- Large projects may need more RAM
- Try closing unused browser tabs

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/bryfar/Open-Studio)
![GitHub forks](https://img.shields.io/github/forks/bryfar/Open-Studio)
![GitHub issues](https://img.shields.io/github/issues/bryfar/Open-Studio)

---

Made with ❤️ by [bryxnn](https://github.com/bryxnn)