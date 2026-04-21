# kartoPhenos — AGENTS.md (repo)

> Parent briefing: `../AGENTS.md` — read it first.

## What is this project?

**kartoPhenos** is a personal, offline-first PWA gallery for viewing photos and PDFs in **very dark environments** (quarries, underground works, caves, night operations). Think "Google Maps for your own maps/plans/schematics" — explore freely (pan, zoom, rotate) and drop colored pins as landmarks.

The UI must be **extremely easy on the eyes** — like the end credits of a movie in a dark cinema. Soft, muted, no aggressive brightness.

## Core Philosophy

- **Dark-first, always.** The app is NEVER in light mode. Every pixel should emit minimal light.
- **Offline-first.** Everything stored in IndexedDB. No server needed. Works underground with no signal.
- **Mobile-first.** Designed for phone/tablet with touch gestures. Big targets, one-hand use.
- **Visual comfort.** 3 theme presets for different dark-viewing conditions.
- **Minimal UI.** The viewer is immersive — just the image, gestures, and pins. No clutter.

## The Three Themes

| Theme | Purpose | Primary Color | Use Case |
|-------|---------|---------------|----------|
| **Obsidian** (default) | General dark viewing | Near-black (minimal chroma) | Standard underground viewing |
| **Rouge** (Red) | Night vision preservation | Deep cinema red | Preserves dark-adapted vision, like red headlamps |
| **Night Vision** (Green) | Map/schematic reading | Muted green | Reading maps in the dark, military-style |

Themes switch via view filter buttons. The ENTIRE UI changes — image filter + Skeleton theme.

## Design Palette

- **Background**: `#0a0a0a` → `#1a1a1a` (deep black gradients)
- **Text**: `#c0392b` (dark red, discreet)
- **Lines/separators**: `#ffffff` at reduced opacity (thin whites)
- **Accents**: `#e74c3c` (vivid red, used sparingly)
- **Ambiance**: like the end of a movie in a dark cinema — soft on the eyes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| Runtime | Bun |
| CSS | Tailwind CSS v4 + Skeleton UI v4 |
| Icons | Lucide Svelte |
| Storage | IndexedDB via `idb-keyval` |
| PDF | `pdfjs-dist` (lazy-loaded) |
| PWA | `@vite-pwa/sveltekit` (Workbox) |

## Architecture

```
src/
├── lib/
│   ├── components/          # UI components
│   │   ├── GalleryCard.svelte     # Thumbnail card with favorite/delete
│   │   ├── ImageViewer.svelte     # Full-screen viewer (pan/zoom/pins)
│   │   ├── PinModal.svelte        # Pin edit dialog (label + color)
│   │   ├── UploadModal.svelte     # Drag-drop upload
│   │   ├── ViewerToolbar.svelte   # Viewer bottom toolbar
│   │   └── index.ts               # Barrel exports
│   ├── services/
│   │   ├── gallery.svelte.ts      # Core GalleryService (CRUD + IndexedDB)
│   │   ├── upload.ts              # File processing (image, PDF, thumbnail)
│   │   └── index.ts
│   ├── types/
│   │   └── gallery.ts             # GalleryImage + Pin interfaces
│   ├── utils/
│   │   ├── view-filter.svelte.ts  # 4 visual filter modes + theme mapping
│   │   ├── theme.svelte.ts        # Dark mode (always dark)
│   │   ├── pwa.svelte.ts          # Install prompt + online status
│   │   └── wake-lock.svelte.ts    # Keep screen on during viewing
│   ├── styles/
│   │   ├── kartoPhenos.css        # Skeleton theme definitions (3 themes)
│   │   ├── tokens.css             # Design tokens
│   │   └── fonts.css              # Self-hosted variable fonts
│   └── index.ts
├── routes/
│   ├── +page.svelte              # Gallery grid (home)
│   ├── +layout.svelte            # Theme init + Skeleton setup
│   ├── +error.svelte             # Error pages
│   └── viewer/[id]/              # Full-screen image viewer
├── app.css                       # Tailwind + Skeleton imports
├── app.html                      # HTML shell (PWA meta, dark mode)
└── app.d.ts
```

## Key Design Decisions

- **ssr = false** on all routes — 100% client-side PWA
- **Two-store IndexedDB**: metadata (lightweight) + full-size images (heavy blobs)
- **toRaw()** strips Svelte 5 Proxy before IndexedDB structuredClone
- **Pin coordinates** MUST be stored as ratios (0-1) relative to image dimensions
- **No light mode** — app is dark-only, forever
- **Minimal UI in viewer** — just the image, gestures, and pins. Toolbar auto-hides.

## Skeleton UI v4 Conventions

### Color Pairings (MANDATORY)
- **NEVER** use `text-white`, `bg-white`, `border-white` hardcoded
- Use Skeleton pairings: `text-surface-50`, `bg-surface-950`, `border-surface-300/10`
- `bg-black` → `bg-surface-950`
- `bg-black/80` → `bg-surface-950/80`
- `text-white/70` → `text-surface-400`
- `text-white/50` → `text-surface-500`

### Theme Surface Scale
The Obsidian theme uses a dark surface scale where ALL shades are dark:
- `surface-50` = lightest shade (but still dark, like oklch 25%)
- `surface-950` = darkest (near-black, oklch 3.9%)
- Standard Skeleton convention: 50=lightest, 950=darkest
- So `text-surface-50` = light text on dark background ✓

### Icons
Use Lucide Svelte components, NOT inline SVGs:
```svelte
import { Heart, X, Upload } from 'lucide-svelte';
<Heart size={18} />
```

## Feature Status

### ✅ Working
- Gallery grid with categories, search, favorites
- Upload (drag-drop, file picker, PDF support)
- Full-screen viewer (pan, zoom, double-tap reset, scroll-zoom)
- Visual filter modes (Original, Red, Inverted, Night Vision)
- Dynamic theme switching with filters
- PWA (manifest, service worker, wake lock, install prompt)
- IndexedDB persistence (2-store architecture)

### 🚧 In Progress
- Pin/annotation system (broken: coords in absolute pixels)
- Viewer toolbar (extracted component)
- PinModal (edit dialog)

### 📋 TODO
- Fix pin coordinates to image-relative ratios
- Fix touch rotation gesture
- Migrate to Skeleton UI color pairings
- Replace inline SVGs with Lucide Svelte
- Clean dead code (types.ts, logger.ts, unused deps)
- Tests (Vitest configured, zero test files)
- PDF multi-page support
- Image export/share

## Commands

```bash
bun install
bun dev              # Dev server
bun build            # Production build
bun preview          # Preview build
bun check            # TypeScript check
bun test             # Run tests
```

## Conventions

- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`
- TypeScript strict mode
- No comments unless requested
- Mobile-first responsive
