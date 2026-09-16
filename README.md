<p align="center">
  <img src="public/icon.svg" width="88" alt="Groove icon" />
</p>

<h1 align="center">GROOVE</h1>
<p align="center"><b>A private, local-first record shop for one man's vinyl collection.</b></p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-MVP%20complete%2C%20active%20hardening-b45309?style=flat-square" />
  <img alt="platform" src="https://img.shields.io/badge/platform-PWA%20%2F%20mobile--first-2D2D2A?style=flat-square" />
  <img alt="storage" src="https://img.shields.io/badge/storage-local--first%20(IndexedDB)-2D2D2A?style=flat-square" />
  <img alt="stack" src="https://img.shields.io/badge/stack-React%2019%20%2B%20TypeScript-2D2D2A?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-Apache--2.0-2D2D2A?style=flat-square" />
</p>

---

Every serious collection deserves a proper back room — somewhere to log what's been played, chase down a pressing detail, and figure out what's been gathering dust. **Groove** is that back room for a physical vinyl collection: a mobile-first Progressive Web App that catalogues the shelf, journals the listens, and tells you the truth about both.

The records stay on the shelf. Groove never streams or plays audio — it's the **registry, journal, and intelligence layer** that sits on top of the physical collection: what's owned, what's been spun, how it graded out, and what's worth pulling next.

> **The collection belongs to the collector.** Not a cloud service, not a metadata provider, not an app vendor — the data lives in the browser, and it leaves only when you export it.

---

## Table of Contents

- [Why Groove Exists](#why-groove-exists)
- [The Shop Floor](#the-shop-floor) — feature tour
- [Discovery Modes](#discovery-modes)
- [Registry Health](#registry-health)
- [The Research Baseline](#the-research-baseline)
- [Data Model](#data-model)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Deployment & CI](#deployment--ci)
- [Backup, Restore & Export](#backup-restore--export)
- [Offline & Installing on iPhone](#offline--installing-on-iphone)
- [Privacy](#privacy)
- [Project Status](#project-status)
- [Design Principles](#design-principles)
- [License](#license)

---

## Why Groove Exists

A streaming service already knows what you own, what you've played, how often, and what it thinks you'll like next. A shelf of records doesn't know any of that — until something sits down and pays attention.

Groove is built to answer the questions a physical collection can't answer on its own:

- What do I actually own, and how complete is that record of it?
- Which artists, genres, and decades dominate the shelf?
- What have I never played? What have I played to death?
- What's highly rated but neglected?
- What should I put on next — with an actual reason, not a black-box recommendation?

It does this **without an account, a backend, a cloud database, a Discogs API dependency, or a generative-AI dependency.** Local-first isn't a fallback mode here — it's the whole design.

---

## The Shop Floor

Groove is organized around four destinations, plus a detail view that does some real crate-digger-grade work.

### 📀 Library
The authoritative shelf. Full-text search across artist, title, genre, style, edition, variant, label, and catalog number, with dynamic filters and sorting (artist, title, year, date added, rating, play count, last played). Grid or compact view. Only **Artist + Title** are required to register a record — everything else is optional and can be filled in later.

### 🎧 Listening Journal
Every spin gets logged as its own record — timestamp, optional session rating, listening context (speakers, headphones, living room, whatever), and notes. Play counts and "last played" are never manually maintained; they're **derived live from the log**, so deleting a session updates every downstream stat automatically. A record's overall rating and a single session's rating are kept deliberately separate — a great night with an average record doesn't rewrite its reputation, and vice versa.

### 🧭 Discover
Built to kill choice paralysis, not to be a recommendation engine. Six live modes pull from your actual shelf and listening state — see [Discovery Modes](#discovery-modes) below. It's useful on day one with zero listening history, and gets sharper as real sessions accumulate.

### 📊 Collection Intelligence (Analytics)
Split deliberately into two halves that never get confused with each other:

| | Answers | Examples |
|---|---|---|
| **Collection Intelligence** | *What do I own?* | Size, artist/genre/style diversity, decade spread, rating distribution, growth over time |
| **Listening History** | *What do I actually do with it?* | Engagement rate, rotation, most/least played, neglected favorites, weekday & time-of-day patterns |

Listening analytics support **All Time / 30 Days / 90 Days / This Year** windows; collection composition stays independent of whichever window is selected.

### ⭐ Wishlist & Acquisition
A wishlist entry (artist, title, desired edition, target price, priority, notes) lives entirely separately from the owned collection — it doesn't count toward any collection stat until it's acquired. The acquisition flow carries that context forward into a new, fully-fledged collection record with its own identity and timestamps, then retires the wishlist entry so nothing double-counts.

### 🖼️ Artwork, without the internet
No cover image on file? Groove generates a deterministic sleeve locally — artist/title-derived hashing into a curated earthy palette, rendered as CSS gradients and local SVG groove work. Every record gets a stable visual identity, and artwork never depends on a network call.

---

## Discovery Modes

| Mode | What it pulls |
|---|---|
| **Choose for Me** | One considered pick, with a real reason attached |
| **Blind Pull** | A small random handful off the shelf |
| **Unplayed** | Records with zero logged listens |
| **Fresh Additions** | Recently registered records |
| **Genre / Style** | Filtered to a chosen sound |
| **Era / Decade** | Filtered to a chosen release period |

All six run entirely against local data — there's no external recommendation service to call out to, blind or otherwise.

---

## Registry Health

Registry Health scores **metadata completeness**, not musical quality — it's a measure of how thoroughly the registry describes what's on the shelf, not a verdict on any record itself. Fields are weighted by how much they matter to browsing and identification:

| Field | Weight |
|---|---:|
| Artist | 2 |
| Album Title | 2 |
| Release Year | 1.5 |
| Genres | 1.5 |
| Format | 1 |
| Record Label | 1 |
| Edition Details | 1 |
| Colorway / Variant | 1 |
| Catalog # | 0.5 |

The result surfaces as a single completeness score plus a ranked list of the most commonly missing fields, so cleanup has an actual priority order instead of being guesswork.

---

## The Research Baseline

This is Groove's deepest cut: the seed catalogue ships pre-loaded with real records from the collection, cross-referenced against a hand-researched pressing database (`src/data/researchMaster.ts`) covering physical-release detail most collection apps don't bother with — matrix/runout etchings, pressing plant, pressing country and year, vinyl weight, and catalog/barcode identifiers, each carrying its own **research status and confidence level** (`identified`, `likely`, `unresolved discrepancy`, etc.).

That confidence rating matters: a record detail view distinguishes a fact the collector confirmed by hand from one that's still an open question, and surfaces unresolved conflicts directly rather than quietly picking one and moving on. Nothing here calls out to Discogs or any other external service — it's a local, versioned research baseline the collector controls.

---

## Data Model

Three entities, related by ID, with derived stats computed on the fly rather than cached as stale counters:

| Entity | Role |
|---|---|
| **Album** | Canonical record — identity, edition/pressing detail, personal rating, research provenance |
| **ListenLog** | One logged listening session — timestamp, session rating, context, notes |
| **WishlistItem** | A desired-but-unowned record, promoted to an Album on acquisition |

```text
Listen Logs
    ↓
Derived Metrics
    ↓
Play Count · Last Played · Rotation · Rankings · Analytics
```

Nothing here is a manually incremented counter. If a session gets deleted, everything downstream — play count, last-played date, every affected chart — recalculates from the log itself.

---

## Architecture

```text
Raw records (IndexedDB)
        │
        ▼
  Domain engine   ← analyticsEngine, discoveryEngine
        │
        ▼
Normalized result
        │
        ▼
   UI component   ← renders only, never recalculates
```

`src/engines/` holds the analytics and discovery logic as plain, framework-agnostic TypeScript — no React, no DOM — which is also what makes it directly testable with `fake-indexeddb` in isolation from the UI. The registry's honesty principle runs all the way through the stack: unknown metadata stays unknown, nothing is fabricated to fill a gap, and derived numbers are always recalculated from source rather than trusted as stored state.

There is intentionally no cloud tier anywhere in this diagram — no API layer, no remote database, no sync daemon. `IndexedDB` is the entire source of truth.

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) — warm "natural tones" palette, `Newsreader` serif headings + `Plus Jakarta Sans` body |
| Motion | `motion` (Framer Motion successor) |
| Icons | `lucide-react` |
| Storage | Native browser `IndexedDB` (`vinyl_collection_db`) — no ORM layer, no remote database |
| Build | Vite 6 |
| PWA | `vite-plugin-pwa`, auto-updating service worker, precached shell + cache-first Google Fonts |
| Testing | `fake-indexeddb` for storage-layer tests, `tsc --noEmit` for type-safety (`npm run lint`) |
| Package manager | Bun (CI-driven) — npm/pnpm/yarn all work locally against the same `package.json` |

No generative-AI dependency, no Discogs API client, no analytics/telemetry SDK — none of that is in the dependency tree at all.

---

## Project Structure

```text
Groove/
├── public/
│   ├── icon.svg                 # App icon (vinyl disc mark)
│   ├── pwa-192x192.png / pwa-512x512.png / pwa-maskable-512x512.png
│   └── apple-touch-icon.png
│
├── src/
│   ├── components/
│   │   ├── AddEditRecordModal.tsx   # Full record editor, incl. research fields
│   │   ├── RecordDetailModal.tsx    # Record detail + research baseline banner
│   │   ├── LogListenModal.tsx       # Session logging
│   │   ├── VinylArtwork.tsx         # Deterministic local sleeve generation
│   │   ├── SettingsModal.tsx        # Backup / restore / CSV export
│   │   └── ...                      # Header, Navigation, RatingStars, etc.
│   │
│   ├── views/
│   │   ├── LibraryView.tsx
│   │   ├── DiscoverView.tsx
│   │   ├── AnalyticsView.tsx        # Collection Intelligence + Registry Health
│   │   └── WishlistView.tsx
│   │
│   ├── engines/
│   │   ├── analyticsEngine.ts       # Collection + listening intelligence
│   │   └── discoveryEngine.ts       # Discovery mode logic
│   │
│   ├── services/
│   │   └── db.ts                    # IndexedDB schema + access layer
│   │
│   ├── hooks/
│   │   ├── useVinylData.ts          # App-level data + import/export API
│   │   └── usePWAInstall.ts
│   │
│   ├── data/
│   │   ├── seedCatalogue.ts         # Pre-loaded real collection records
│   │   └── researchMaster.ts        # Hand-researched pressing database
│   │
│   └── types.ts                     # Album, ListenLog, WishlistItem, BackupData
│
└── .github/
    ├── workflows/ci.yml             # Type-check + build on push/PR
    ├── workflows/deploy.yml         # Build + deploy to GitHub Pages
    ├── workflows/codeql.yml         # Weekly + on-push security scanning
    └── dependabot.yml               # Weekly dependency updates
```

---

## Getting Started

**Requirements:** [Bun](https://bun.sh) (matches CI) — npm works too if you'd rather.

```bash
git clone https://github.com/Infinitive/Groove.git
cd Groove
bun install        # or: npm install
bun run dev         # or: npm run dev
```

The dev server runs at `http://localhost:3000`. There's no backend to stand up — on first load, Groove seeds its own local IndexedDB store from the built-in catalogue.

---

## Available Scripts

| Command | What it does |
|---|---|
| `dev` | Start the Vite dev server (port 3000) |
| `build` | Production build → `dist/` |
| `preview` | Serve the production build locally |
| `lint` | Type-check the whole project (`tsc --noEmit`) |
| `clean` | Remove build output |

---

## Deployment & CI

Groove ships as a static PWA, deployed automatically to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`), and gated by a separate CI job that type-checks and builds on every push and pull request (`.github/workflows/ci.yml`). A weekly CodeQL scan and Dependabot keep the dependency surface and code scanning current.

Live at: **https://infinitive.github.io/Groove/**

To self-host, run `bun run build` (or `npm run build`) and serve `dist/` from any static host.

---

## Backup, Restore & Export

**JSON is the canonical, full-fidelity backup format** — schema version, export timestamp, app version, every album, every listening log, and the wishlist, all in one file. Imports are validated (structure, schema version, required IDs, field types, rating ranges, referential integrity) *before* anything touches the live database, with a choice of replacing the local dataset outright or merging into it.

**CSV export** exists purely for interoperability with spreadsheets — it is explicitly not the format to trust for a full restore. Listening history and the wishlist export separately.

There's no cloud sync between devices. Moving a collection to a new device means exporting JSON on one and importing it on the other.

---

## Offline & Installing on iPhone

The app shell is precached by an auto-updating service worker (`vite-plugin-pwa`); the data layer is IndexedDB. The two are independent — the service worker owns application resources, IndexedDB owns your collection — so offline behavior never depends on network state once installed.

**To install on iPhone:** open the deployed URL in **Safari** → **Share** → **Add to Home Screen** → enable **Open as Web App** → **Add**. Launch once while online first, so the browser has a chance to fully cache the shell before the first offline session.

---

## Privacy

This repository is public. The collection it describes is not.

- No cover art, personal notes, or purchase data live in this repo — only the app and its seed catalogue of publicly-known album titles.
- All collection data is stored locally via IndexedDB. Nothing is transmitted anywhere by default — there's no server for it to go to.
- The optional `discogsId` field is a passive text reference only; Groove never calls out to Discogs or any other external API.

---

## Project Status

The MVP is complete, and the project is currently in an **active hardening pass** — tightening data consistency, tidying a few in-progress edges, and confirming everything behaves the way the docs say it does.

| System | Status |
|---|---|
| Local IndexedDB database | ✅ Complete |
| Library, search, filtering, sorting | ✅ Complete |
| Record management + detail view | ✅ Complete |
| Listening journal | ✅ Complete |
| Discovery (6 live modes) | ✅ Complete |
| Collection + listening analytics | ✅ Complete |
| Registry Health | ✅ Complete |
| Wishlist + acquisition workflow | ✅ Complete |
| Research baseline (pressing-level provenance) | ✅ Complete |
| JSON backup/restore + CSV export | ✅ Complete |
| PWA / offline | ✅ Complete |
| CI, CodeQL, Dependabot | ✅ Complete |
| Discogs API integration | 🚫 Intentionally absent |
| Generative-AI runtime integration | 🚫 Intentionally absent |
| Cloud backend / sync | 🚫 Intentionally absent |

---

## Design Principles

1. **IndexedDB stays canonical.** No remote database unless the architecture intentionally changes.
2. **Listening logs stay canonical for history.** No manually maintained play counters — ever.
3. **Derived metrics stay derived.** Play count, last-played, rankings, and analytics are always recalculated from source.
4. **Discogs stays passive.** `discogsId` is a reference field, never an API dependency.
5. **Artwork stays offline-safe.** External art should never become load-bearing for core function.
6. **No AI in the runtime path.** The finished app shouldn't need a generative-AI call to work.
7. **No cloud backend.** Core functionality stays usable with zero network access.
8. **JSON is full-fidelity; CSV is not.** Don't blur that line.
9. **Unknown data stays unknown.** Never fabricate a missing field to make the registry look more complete than it is.
10. **Avoid feature creep.** Don't let this drift into a streaming service, a marketplace, a Discogs clone, or a social network.

---

## License

Licensed under **Apache-2.0** — see [`LICENSE`](LICENSE). Application source also carries Apache-2.0 SPDX headers.

---

<p align="center"><sub>Built for one shelf, one collector, one honest record of what's actually been played.</sub></p>
