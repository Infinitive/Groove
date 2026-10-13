# Implementation Plan: Mobile Viewport Lockdown, Keyboard Clearance, Analytics Rating Breakdown, Settings Counters, and Zero Preloaded Data Architecture

A comprehensive solution to lock down mobile viewport zooming and horizontal scrolling, eliminate keyboard and toolbar obscuration across modals and search, synchronize local storage record counters in Settings, aggregate album and spin session ratings in Archive Intelligence, and transition to a clean zero-preloaded-data state for fresh installs.

## User Review & Critical Decisions

> [!NOTE]
> Based on your Phase 1 selections and revision feedback, the following architectural choices have been established:
> 1. **Anti-Zooming & Horizontal Scroll Lockdown**:
>    - Viewport meta tag locked with `maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content`.
>    - Root HTML/Body configured with `overflow-x: hidden`, `max-width: 100vw`, `overscroll-behavior-x: none`, and `touch-action: pan-y` to eliminate horizontal sway, rubber-banding, and accidental pinch-to-zoom.
>    - Mobile input fields styled with `text-base` ($\ge 16\text{px}$) to prevent iOS Safari auto-zooming on focus.
>    - Horizontal scroll containers (e.g. genre/tag chip carousels) scoped with `overscroll-behavior-x: contain` to prevent scroll chain leakage to the document.
> 2. **Modal & Search Mobile Keyboard Handling**: Modals will dynamically resize to viewport height (`100dvh` / `interactive-widget=resizes-content`) with safe-area clearance above the floating navigation bar, ensuring search results and action buttons never slip beneath keyboards or toolbars.
> 3. **Archive Intelligence Rating Breakdown**: Rating statistics will aggregate both explicit album ratings (`album.personalRating`) and individual spin session ratings (`log.rating`) using an effective rating calculation so rated records never show 0 when ratings exist.
> 4. **Clean Slate Zero-Data Architecture**: Fresh app launches will contain 0 preloaded albums or logs. The Settings modal will provide an optional "Load Demo Catalogue" button alongside the clean reset action.
> 5. **Existing App Branding & Icon**: The sine wave app icon in Settings is preserved exactly as requested (replacing the '?' icon), with no changes to the icon design.

---

## 1. Overview & Core Concept

- **What It Does**: 
  - Restricts mobile viewport scaling and eliminates horizontal document scrollbars, guaranteeing a rock-solid native app feel without janky horizontal sliding or unwanted pinch zoom.
  - Ensures mobile inputs do not trigger iOS Safari's auto-zoom on tap.
  - Restructures modal viewports, sheets, and search lists to dynamically adjust when the software keyboard opens, keeping buttons ("Add to Wishlist", "Log Spin") and search results visible above the keyboard and floating toolbar.
  - Connects true active data counters to the Settings "Local Storage & Data State" widget (`recordsCount`, `listensCount`, `wishlistCount`, `dbSizeEst`).
  - Unifies rating calculations in Archive Intelligence so albums with session ratings or numerical/string personal ratings accurately populate the "Rated Records" and "Average Rating" metrics.
  - Removes automatic catalogue seeding on first launch, allowing the user to start completely fresh with zero pre-populated items while retaining an optional demo loader.
- **Target Audience / Persona**: Vinyl collectors and music archivists using mobile touch devices who log spins, curate wishlists, inspect collection metrics, and manage their local archive without clutter or layout instability.
- **Key Value**: Rock-solid touch ergonomics with zero horizontal drift or accidental zooming, truthful archive analytics, accurate storage telemetry, and respect for user data ownership.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Mobile Navigation & Scrolling*: As the user scrolls vertically through their vinyl library or analytics, the page stays strictly locked on the vertical axis with zero horizontal wobble or diagonal panning. Horizontal carousels (filter chips, year scrollers) swipe smoothly with isolated containment (`overscroll-behavior-x: contain`).
  2. *Adding to Wishlist on Mobile*: User taps "+ Add to Wishlist". Tapping into the title or artist input focuses smoothly without triggering an iOS viewport zoom jump. The modal container flexes with the keyboard, keeping the "Add to Wishlist" submit button reachable and visible above the keyboard and floating toolbar.
  3. *Searching Records on Mobile*: In Library or Record Picker, typing in the search bar dynamically filters records. Results list container uses flex scroll with bottom safe-area insets, remaining fully scrollable and selectable even with the keyboard expanded.
  4. *Inspecting Settings Storage*: User opens Settings. The "Local Storage & Data State" section immediately reflects the actual number of albums, listen sessions, and wishlist items in indexed storage, with accurate storage size calculation.
  5. *Archive Intelligence Rating Breakdown*: User navigates to Intelligence/Analytics. The "Rated Records" card displays the actual count of rated albums (aggregated from album ratings and spin session logs), and the 5-star distribution chart reflects true user scores.
  6. *Fresh Install Experience*: On first visit or after choosing "Reset to Clean Slate", the library displays an empty state with prompt options to add a record manually, import from JSON/CSV, or load demo records.

- **Visual Identity & Theme**:
  - *Color Palette & Mood*: Deep obsidian dark aesthetic (`bg-[#000000]`, surfaces in `neutral-900/90` with hairline borders `border-white/10`, warm vinyl ember accents `ember-500` / `#FF5A10`).
  - *Typography & Ergonomics*: Clean typography with tabular numerals (`tabular-nums font-mono`) for all metrics and counters.
  - *Mobile Touch Ergonomics*: Minimum 44x44px touch hitboxes on all buttons, chips, and close affordances; safe area bottom padding `calc(env(safe-area-inset-bottom, 0px) + 5rem)` on scrollable containers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Viewport Anti-Zoom & Horizontal Scroll Lockdown**
  - *Chosen Approach*: 
    - Set `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />`.
    - Apply `overflow-x: hidden`, `width: 100%`, `max-width: 100vw`, `overscroll-behavior-x: none`, and `touch-action: pan-y` in global CSS for `html, body, #root`.
    - Enforce a minimum 16px font-size (`text-base` on mobile inputs) to disable iOS Safari's automatic zoom-on-focus mechanism.
    - Scope horizontal filter carousels (`LibraryView`) with `overscroll-behavior-x: contain` and replace unconstrained `-mx-4` overflows with clipped full-width wrappers.
  - *Why*: Eliminates all sources of accidental zoom, rubber-band horizontal panning, and input focus magnification that create scrolling jank on mobile.
  - *Alternatives Considered*: JavaScript-based `touchmove` prevention (causes severe performance lag and breaks native vertical scrolling).

- **Decision 2: Viewport & Keyboard Resizing Strategy for Modals**
  - *Chosen Approach*: Convert modal containers to use `max-h-[min(90dvh,calc(100dvh-4rem))]`, give scrollable form containers `overflow-y-auto overscroll-contain`, and apply safe area clearance above the bottom navigation bar.
  - *Why*: Native browser viewport resizing combined with dynamic viewport units (`dvh`) automatically accommodates virtual keyboards across modern mobile browsers without JavaScript scroll jumping.
  - *Alternatives Considered*: Custom window resize listener with manual pixel offset calculation (fragile, lags behind keyboard animations).

- **Decision 3: Effective Rating Aggregation**
  - *Chosen Approach*: Compute `effectiveRating` for each album by taking `album.personalRating` (sanitized with `Number()`) or falling back to the average rating of listen sessions logged for that album (`log.rating`).
  - *Why*: Users frequently rate their albums during spin listening sessions rather than editing the base album metadata. Aggregating both satisfies user expectation that listening session ratings reflect in Archive Intelligence.
  - *Alternatives Considered*: Showing only album metadata ratings (caused the 0 rated records discrepancy reported by user).

- **Decision 4: Settings Storage Counter Synchronization**
  - *Chosen Approach*: Correct prop name mismatches between `App.tsx` and `SettingsModal.tsx` (`totalAlbums`, `totalListens`, `wishlistCount`, and actual storage byte estimate).
  - *Why*: `SettingsModal` had mismatched prop definitions (`recordsCount` vs `totalAlbums`), causing fallback to 0 despite data being present in memory and IndexedDB.
  - *Alternatives Considered*: Having SettingsModal query IndexedDB directly (unnecessary overhead when state is already managed in top-level hooks).

- **Decision 5: Clean Install Zero-Data Architecture**
  - *Chosen Approach*: In `db.ts`, initialize the database with empty stores `[]` rather than automatically seeding 24 catalogue albums. Provide an explicit "Load Demo Catalogue" action in Settings / Empty State.
  - *Why*: Allows new users and GitHub cloners to start with their own records without tedious manual deletion.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│  - max-w-full overflow-x-hidden                        │
│  - State: albums, listenLogs, wishlist, activeView     │
└───────────┬───────────────────────────────┬────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   Navigation.tsx      │       │   SettingsModal.tsx   │
│ - Floating Bottom Bar │       │ - App Icon Sine Wave  │
│ - Safe Area Insets    │       │ - Storage Data State  │
│ - z-40 Clearance      │       │ - Clean Reset / Demo  │
└───────────────────────┘       └───────────────────────┘
            │
            ├───────────────────────────────────────────┐
            ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│     LibraryView.tsx       │               │      WishlistView.tsx     │
│ - Search Input (16px base)│               │ - Add to Wishlist Sheet   │
│ - Scoped Filter Carousels │               │ - Keyboard Avoidance      │
│ - Safe Bottom Padding     │               │ - Viewport dvh Sizing     │
└───────────────────────────┘               └───────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────┐
│         AnalyticsView.tsx & analyticsEngine.ts         │
│ - computeCollectionOverview (Effective Ratings)       │
│ - Aggregates album.personalRating & session log.rating│
│ - Rated Records & Star Distribution Display           │
└───────────────────────────────────────────────────────┘
```

### Interactive State & Component Mapping

1. **`index.html` & Viewport**:
   - Update viewport meta tag:
     `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />`.
2. **`src/index.css` & Global Scroll Constraints**:
   - In `html, body`: apply `overflow-x: hidden`, `width: 100%`, `max-width: 100vw`, `overscroll-behavior-x: none`, and `touch-action: pan-y`.
   - Add input baseline rule: `input, select, textarea { font-size: 16px; }` to prevent iOS zoom-on-focus while maintaining responsive UI typography.
   - Constrain horizontal chip lists: `overscroll-behavior-x: contain`.
3. **`App.tsx`**:
   - Add `w-full max-w-full overflow-x-hidden` on root container and `<main>`.
   - Pass synchronized props to `SettingsModal`: `totalAlbums={albums.length}`, `totalListens={listenLogs.length}`, `wishlistCount={wishlist.length}`.
4. **`Navigation.tsx`**:
   - Ensure the fixed bottom container has `pb-[max(0.75rem,env(safe-area-inset-bottom))]` and proper backdrop styling so page content scrolling behind is cushioned.
5. **`WishlistView.tsx` & `AddEditRecordModal.tsx`**:
   - In the modal wrapper: `max-h-[calc(100dvh-env(safe-area-inset-bottom)-2rem)] flex flex-col`.
   - In modal content: scrollable body `flex-1 overflow-y-auto overscroll-contain p-4 pb-12` so submit buttons are reachable with keyboard open.
6. **`SettingsModal.tsx`**:
   - Fix app icon display to render the authentic sine wave SVG mark instead of the question mark icon.
   - Synchronize storage counters and byte size calculation.
   - Add "Load Demo Catalogue" button alongside "Reset Archive".
7. **`analyticsEngine.ts` & `AnalyticsView.tsx`**:
   - Implement `getEffectiveAlbumRating(album, listenLogs)`:
     - Check `Number(album.personalRating) > 0`.
     - If not set, check logs matching `log.albumId === album.id && Number(log.rating) > 0` and compute average.
   - Update `ratedRecordsCount`, `unratedRecordsCount`, and `averageRating` calculations to use effective ratings.
8. **`db.ts` & `useVinylData.ts`**:
   - Remove automatic first-run seeding from `init()`.
   - Update `resetToCatalogue` to perform a clean empty-state wipe, and add a separate `loadDemoRecords()` method for users who want sample data.

---

## Verification & Confirmation Plan

1. **Anti-Zooming & Horizontal Scroll Lockdown**:
   - Verify on mobile viewports that pinch-to-zoom is disabled.
   - Verify tapping on search and modal text inputs does not zoom the page in iOS Safari.
   - Test swiping horizontally on library lists, cards, and modal sheets to confirm zero horizontal page drift or wobble.
2. **Mobile Viewport & Keyboard Clearance**:
   - Test modal opening on touch viewports (375px–430px).
   - Test typing in Wishlist and Search input fields to ensure buttons and results remain visible above the keyboard and floating toolbar.
3. **Settings Local Storage Widget**:
   - Verify that adding albums, listen logs, or wishlist items immediately updates the counters in the Settings modal.
   - Verify that the sine wave icon displays properly instead of a question mark.
4. **Archive Intelligence Rating Breakdown**:
   - Test rating calculation with: (a) album metadata ratings, (b) session ratings only, (c) string-formatted ratings ("4.5").
   - Confirm that "Rated Records" reflects the actual count and star distribution displays accordingly.
5. **Clean Slate Initialization**:
   - Verify fresh install initializes with 0 records and displays clean empty states without errors.
