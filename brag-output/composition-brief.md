# Hyperframes Composition Brief: CENTERPOINT

## Objective
Create a 22-second cinematic launch-style brag video for CENTERPOINT — a dual-edition enterprise commerce platform built on Laravel 13 + React 19. The video must feel like a premium enterprise SaaS launch film and demonstrate the platform's actual operational UI, not conceptual mockups.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920×1080
- Duration: 22 seconds

## Source Material
- Project root: `d:\E-commerce-PointOne`
- Primary files read: `frontend/src/index.css`, `frontend/src/pages/Studio/StudioOverview.tsx`, `frontend/src/pages/Studio/StudioFinance.tsx`, `frontend/src/pages/Storefront/HomePage.tsx`, `README.md`
- Product name: CENTERPOINT
- Tagline / strongest claim: "One Platform. Complete Commerce." — and the sub-claim: "SUM(Debits) == SUM(Credits)" from the double-entry accounting engine
- Key UI or visual moment to recreate:
  1. Studio Dashboard — 4-metric KPI matrix with counter-tween cards (Net Sales, Orders, AOV, Customers) in JetBrains Mono bold on zinc-900 dark surfaces
  2. Visual CMS 3-panel workspace (section tree / live canvas / property inspector)
  3. Double-entry ledger — Journal entry `JRN-2026-042` with Debit/Credit lines and ✓ Balanced badge
- Copy that must appear verbatim:
  - `SUM(Debits) == SUM(Credits)`
  - `✓ Balanced`
  - `JRN-2026-042`
  - `One Platform. Complete Commerce.`
  - `centerpoint.devcenterpoint.com`
  - `Developed by DevCenterPoint`

## Creative Direction
- Tone preset: `cinematic`
- Creative direction: *premium enterprise SaaS launch film — Stripe/Linear product reveal energy, but it ships on shared hosting*
- Interpretation: Long settled holds on complex UI; reveals that let the interface breathe; controlled motion rather than kinetic chaos; confidence through restraint. High visual density in Scene 2–3, clean emptiness in Scene 1 and 4.
- Angle: The world runs commerce in a dozen fragmented tools. CENTERPOINT holds the whole operation — and proves it not with marketing language but with a live KPI dashboard and a mathematically balanced journal entry.
- Hook: Question types onto obsidian in Scene 1 — no answer — hard cut to the Studio Dashboard lighting up.
- Outro / punchline: CENTERPOINT wordmark on obsidian. "One Platform. Complete Commerce." URL in amber mono.
- Avoid:
  - Generic SaaS language ("streamline your workflow", "all-in-one solution", "game-changing")
  - Abstract motion graphic filler (particle systems, floating dashboards, neon orbs)
  - Fabricated metrics — use the demo values from the actual component files
  - Any copy that is not grounded in the project files

## Visual Identity
- Background: `#09090B` (canvas obsidian — dark mode primary, used for `--bg-page` in dark)
- Surface: `#121215` (dark mode card/panel surface `--bg-surface`)
- Text: `#F4F4F5` (zinc-100, `--text-primary` dark)
- Accent gold: `#D97706` / `#F59E0B` (champagne gold — amber-600 light / amber-400 dark)
- Border: `#27272A` (zinc-800 — `--border-subtle` dark)
- Emerald trend: `#10B981` (from metric card trend labels)
- Blue orders: `#3B82F6`
- Display font: Cormorant Garamond (serif editorial — headlines, brand wordmark)
- Body / UI font: Plus Jakarta Sans (UI text, descriptions)
- Mono / data font: JetBrains Mono (metrics, SKUs, financial figures, URLs, code)
- Visual references from the project:
  - Metric cards: `p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm` feel
  - Tracking class on labels: `tracking-[0.2em]` text-xs font-mono uppercase
  - CTA button style: `bg-amber-500 hover:bg-amber-600 text-zinc-950 font-mono font-bold` rounded-xl
  - Obsidian hero: `bg-zinc-950 text-white min-h-640 rounded-3xl`
  - Glass: `bg-white/85 backdrop-blur-20px border border-zinc-200` (light mode reference only — stay dark for video)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. **Hook** — 3s (0s–3s) — Question types onto pure obsidian. Must read: "Your commerce operation. How many tools?"
2. **Studio Dashboard** — 7s (3s–10s) — 4 metric cards arrive one by one with counter-tweens. Must see/read: "Store Operations Control" (amber mono), "Merchant Studio Dashboard" (Cormorant Garamond), metric values ৳ 24,85,000 / 184 / ৳ 13,505 / 412, label "Real metrics. Real operations. Zero fabrication."
3A. **Visual CMS** — 4s (10s–14s) — Full 3-panel CMS workspace. Must read: "Build it. Ship it. Live."
3B. **Double-Entry Ledger** — 5s (14s–19s) — Journal card with Debit/Credit lines then ✓ Balanced. Must read: `SUM(Debits) == SUM(Credits)` and "Automated. Immutable. Every single transaction."
4. **Brand Outro** — 3s (19s–22s) — CENTERPOINT wordmark. Must read: "A Complete Commerce Operating Platform." + URL + credit.

## Audio
- Audio role: cinematic support — steady authoritative bed with 3 deep bell punctuation moments
- Audio arc: bed fades in from near-silence (Scene 1) → builds through metric reveal (Scene 2) → holds steady through CMS+ledger (Scene 3) → graceful fade under logo (Scene 4)
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: start at 0s, volume 0.32; fade out from ~20s, fully silent by 22.5s; allow the final bell SFX at ~22.93s to ring over the fade
- Music cue guidance: Bundled preset: `brag-output/composition/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Strong cues: 8.74s (0.99), 13.11s (0.98), 17.47s (0.99), 22.93s (1.00). Lock 3 major reveals: Scene 2 4th metric card → 8.74s; Scene 3A CMS canvas reveal → 13.11s; Scene 3B ✓ Balanced badge → 17.47s; Scene 4 logo slam → 22.93s. Beat-grid for metric cards 1–4: 7.09s, 7.64s, 8.19s, 8.74s.
- Audio-reactive treatment: subtle — use music RMS/bass energy to make the gold `#D97706` glow/halo on metric card surfaces breathe slightly. No waveform bars, no equalizer, no strobing.
- Audio-coupled moments:
  - Scene 1 (0s–3s) — sparse keyboard keypress sounds (2–3 from `keyboard/keypress-*.wav`, randomized, vol 0.28) for the typing animation
  - Scene 2 (7.09s, 7.64s, 8.19s, 8.74s) — `interface/drop_002.ogg` at vol 0.55 for each metric card arrival; beat-grid aligned
  - Scene 3A (~13.11s) — `impact/impactBell_heavy_000.ogg` at vol 0.60 on CMS canvas reveal; beat-locked
  - Scene 3B (~17.47s) — `impact/impactBell_heavy_003.ogg` at vol 0.75 on "✓ Balanced" badge appearance; beat-locked
  - Scene 4 (~22.93s) — `impact/impactBell_heavy_004.ogg` at vol 0.80 on CENTERPOINT wordmark landing; beat-locked
- SFX selection guidance: All SFX are from the brag skill's bundled library. For the metric card arrivals, prefer `interface/drop_002.ogg` (soft drop, polished). For the three major cinematic moments, use the `impactBell_heavy_*` family — resonant, not aggressive. Keep all SFX under 0.80 volume. This is a premium platform; the audio should feel like a luxury product reveal, not a game trailer.
- SFX analysis guidance: See `d:\E-commerce-PointOne\.agents\skills\brag\assets\sfx\sfx-analysis.md` — prefer low/medium high-frequency-risk files throughout.
- Exact SFX choice: Hyperframes chooses final filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: Copy music into `brag-output/composition/assets/music/` and the cue JSON/MD into `brag-output/composition/assets/music/cues/` before building. Hyperframes copies SFX into `brag-output/composition/assets/sfx/` after selecting exact files.

## Hyperframes Instructions
Load skills: `hyperframes` (composition contract, `references/format.md`, `references/motion.md`, `references/look.md`), `hyperframes-registry` (transitions, effects), `media-use` (audio-reactive extraction, beat sync), `hyperframes-cli` (check/render).

Do NOT read `references/types/*` or `references/story.md`. Do NOT write a `SPEC.md`. Do NOT route into the generic launch-video workflow. The brag plan and this brief ARE the spec.

Requirements:
- Show the actual Studio Dashboard KPI matrix, the Visual CMS 3-panel layout, and the double-entry ledger journal card — these are grounded in real component source code.
- Use the dark-mode obsidian/gold visual palette throughout. Light mode is NOT used in the video.
- Keep all text readable: Cormorant Garamond for display, JetBrains Mono for data/metrics/URLs, Plus Jakarta Sans for UI body text.
- Total duration: exactly 22 seconds.
- Include audio layer. Do not omit music or SFX.
- Treat music cue metadata as optional timing hints — story, readability, and product clarity come first.
- For the metric card counter-tweens: animate the numbers from 0 to their target values over ~1.4s each. This is what `useCounterTween` does in the real codebase.
- For the ✓ Balanced badge: green badge, appears with a snap, using the `Badge` component feel — small pill, rounded, text-emerald-700 bg-emerald-50 / dark text-emerald-400 bg-emerald-950 coloring.
- The `SUM(Debits) == SUM(Credits)` formula must appear in JetBrains Mono amber — it is the most audacious true claim in the codebase.
- Run `npx hyperframes check` before render. Fix all errors including contrast failures.
- Render locally. Do not publish remotely.
