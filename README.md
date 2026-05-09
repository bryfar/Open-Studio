# ✨ Open Studio

![Open Studio Cover](./Profile banner - 2 (1).png)

> Open source browser-based video editor with desktop app. Edit, export and create shorts with AI assistance.

English | [Español](./README.es.md)

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-222?logo=githubactions)](https://github.com/bryfar/Open-Studio/actions)
[![License](https://img.shields.io/badge/License-MIT-2ea44f)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/bryfar/Open-Studio?style=flat)](https://github.com/bryfar/Open-Studio/stargazers)
[![Security](https://img.shields.io/badge/Security-Policy-blue)](./SECURITY.md)
[![Code_of_Conduct](https://img.shields.io/badge/Code_of_Conduct-Policy-purple)](./CODE_OF_CONDUCT.md)

## ⚡ Why Open Studio?

| Compared to | Open Studio Advantage |
|---|---|
| CapCut | Open source, self-hosted, extensible |
| Kdenlive | Runs in browser, cross-platform desktop app |
| DaVinci Resolve | Lightweight web interface, no download required |
| Online editors | Works offline, local project storage |

**Open Studio** combines:
- 🎬 Professional multi-track timeline in the browser
- 🤖 AI-assisted short video generation
- 🖥️ Desktop app for offline work
- 📦 One-click installers for Windows, macOS, Linux

## 🚀 Quick Start

```bash
# 1) Clone the repository
git clone https://github.com/bryfar/Open-Studio.git

# 2) Enter the project
cd Open-Studio

# 3) Install monorepo dependencies
npm install

# 4) Run baseline lint checks
npm run lint

# 5) Start the web app (Next.js)
npm run dev

# 6) Start the desktop app (Electron + web)
npm run dev:desktop

# 7) Start the shorts API (FastAPI)
npm run dev:api

# 8) Start the processing worker
npm run dev:worker
```

## ▲ Deploy

| Option | When to use | Recommended steps |
|---|---|---|
| [Vercel](https://vercel.com/) | Fast deploy for the Next.js frontend | 1) Connect repo 2) Configure variables 3) Review [`vercel.json`](./vercel.json) 4) Enable branch/tag deploys |
| [Cloudflare](https://www.cloudflare.com/) | Edge distribution and network control | 1) Configure project 2) Define variables 3) Set build command/output 4) Validate routing and caching |

Release checklist:

| Step | What to validate |
|---|---|
| 1 | Variables and secrets from [`.env.example`](./.env.example) and `apps/openstudio-shorts-service/.env.example` |
| 2 | Deploy configuration in [`vercel.json`](./vercel.json) |
| 3 | Minimum quality checks: `npm run lint` and `npm run e2e` |
| 4 | Desktop release via semver tags (`v*`) with per-OS artifacts |

## 📥 Download

### Desktop App

| Platform | Download | Description |
|---|---|---|
| **Windows** | [<img src="https://img.shields.io/badge/Download-Installer-0078D4?logo=windows" />](https://github.com/bryfar/Open-Studio/releases/latest/download/@openstudiodesktop.Setup.0.1.0.exe) | `.exe` installer (158 MB) |
| **macOS (Intel)** | [<img src="https://img.shields.io/badge/Download-DMG-000000?logo=apple" />](https://github.com/bryfar/Open-Studio/releases/latest/download/@openstudiodesktop-0.1.0.dmg) | `.dmg` disk image (212 MB) |
| **macOS (Apple Silicon)** | [<img src="https://img.shields.io/badge/Download-DMG-000000?logo=apple" />](https://github.com/bryfar/Open-Studio/releases/latest/download/@openstudiodesktop-0.1.0-arm64.dmg) | `.dmg` for M1/M2/M3 (208 MB) |
| **Linux (AppImage)** | [<img src="https://img.shields.io/badge/Download-AppImage-EE4F2A?logo=linux" />](https://github.com/bryfar/Open-Studio/releases/latest/download/OpenStudio-0.1.0-x86_64.AppImage) | Portable (221 MB) |
| **Linux (Ubuntu/Debian)** | [<img src="https://img.shields.io/badge/Download-DEB-EE4F2A?logo=linux" />](https://github.com/bryfar/Open-Studio/releases/latest/download/OpenStudio-0.1.0-amd64.deb) | `.deb` package (162 MB) |

Or browse all releases: **[📦 GitHub Releases](https://github.com/bryfar/Open-Studio/releases)**

## 🧭 Understand Fast

1. [`docs/WEB_FEATURE_STRUCTURE.md`](./docs/WEB_FEATURE_STRUCTURE.md)
2. [`docs/EDITOR_ARCHITECTURE.md`](./docs/EDITOR_ARCHITECTURE.md)
3. [`docs/kdenlive-parity-matrix.md`](./docs/kdenlive-parity-matrix.md)
4. [`apps/web/README.md`](./apps/web/README.md)
5. [`apps/desktop/README.md`](./apps/desktop/README.md)
6. [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## 🛠️ Key Capabilities

- 🎬 Multi-track timeline editor (video, audio, text, overlays)
- ✂️ Clip Generator to transform long videos into shorts
- 🤖 AI Shorts with assisted generation pipeline
- 💾 Local/offline desktop project persistence
- 🖥️ Per-OS distribution (Windows, macOS, Linux)
- 🔐 Secure Electron bridge (context isolation + controlled IPC)
- 📦 Monorepo setup for web + desktop + service
- 🚀 CI/CD for cross-platform artifacts and releases

## 📦 Monorepo Structure

- `apps/web` - Main frontend (Next.js)
- `apps/desktop` - Desktop runtime (Electron + electron-builder)
- `apps/openstudio-shorts-service` - Shorts API/worker (FastAPI)
- `docs` - Technical architecture docs
- `landing` - Static landing site

## 🤝 Contributing

For maintainers and human contributors:

- Follow [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Respect [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- Report vulnerabilities through [`SECURITY.md`](./SECURITY.md)
- Review project rules in [`GOVERNANCE.md`](./GOVERNANCE.md)

For AI agents and assistants:

- Use [`AGENTS.md`](./AGENTS.md) as the primary guide
- Review [`CLAUDE.md`](./CLAUDE.md) for complementary instructions
- Keep consistency with security and governance standards

## 📄 License

MIT License. See [`LICENSE`](./LICENSE).

Built for Creators, maintained by the open source community.