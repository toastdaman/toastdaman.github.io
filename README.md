# 🍞 toastdaman.github.io

A creative portfolio website featuring an interactive 3D toast scene with scroll-driven animations and a brutalist editorial design aesthetic.

**Live Site:** [toastdaman.github.io](https://toastdaman.github.io)

---

## ✨ Features

- **Interactive 3D Toast** — A procedurally textured, realistic toast model with melting butter, steam particles, and floating crumbs powered by [Three.js](https://threejs.org/)
- **Scroll-Driven Animations** — The 3D scene transforms as you scroll through sections using [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- **Starfield & Particle Effects** — A space-themed background with drifting mini-toast particles
- **Brutalist Editorial UI** — Bold serif typography, stark layouts, and dramatic hover effects
- **Mouse Parallax** — Subtle camera movement that responds to cursor position
- **Orbital Controls** — Click and drag to rotate and inspect the toast model
- **Custom Cursors** — Toast-shaped cursors for an extra touch of whimsy
- **Responsive Design** — Fully responsive layout with mobile-optimized 3D scaling

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [React](https://react.dev/) | UI framework |
| [Three.js](https://threejs.org/) | 3D rendering & WebGL |
| [GSAP](https://gsap.com/) | Scroll-triggered animations |
| [TailwindCSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Vite](https://vite.dev/) | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Lucide React](https://lucide.dev/) | Icon library |

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/toastdaman/toastdaman.github.io.git
cd toastdaman.github.io

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Create a production build
npm run build

# Preview the production build
npm run preview
```

## 🚀 Deployment

This site is deployed to **GitHub Pages** from the `gh-pages` branch.

```bash
# Build and deploy in one step
npm run deploy
```

This runs `vite build` followed by `gh-pages -d dist`, which pushes the contents of the `dist/` folder to the `gh-pages` branch.

## 📁 Project Structure

```
.
├── index.html          # Entry HTML
├── package.json        # Dependencies & scripts
├── vite.config.ts      # Vite configuration (base path, plugins)
├── tsconfig.json       # TypeScript configuration
├── .env.example        # Environment variable template
└── src/
    ├── main.tsx        # React entry point
    ├── App.tsx         # Main app component (3D scene + UI)
    └── index.css       # Global styles, fonts, animations
```

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build & deploy to GitHub Pages |
| `npm run lint` | Type-check with TypeScript |
| `npm run clean` | Remove the `dist/` directory |

## 📄 License

© 2026 toastdaman. All rights reserved.
