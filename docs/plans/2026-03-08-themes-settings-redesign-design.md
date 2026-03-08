# Themes & Settings Redesign — Design

## Overview

Add a theme system to PulsoDoro with full visual themes (colors, gradients, blur levels, border styles) and redesign the settings panel from a cramped tabbed modal to a spacious sidebar layout.

## Settings Layout Redesign

**Current:** Small modal with horizontal tabs (Timer | Music | Appearance).

**New:** Full-panel overlay (~85% of window) with left sidebar navigation and right content area.

```
┌─────────────────────────────────────────────┐
│  ╔═══════════╦═══════════════════════════╗  │
│  ║ Settings  ║                           ║  │
│  ║───────────║   [Content area for       ║  │
│  ║ ▸ Timer   ║    the selected section]  ║  │
│  ║   Music   ║                           ║  │
│  ║   Look    ║                           ║  │
│  ║   Themes  ║                           ║  │
│  ║           ║                           ║  │
│  ║           ║                           ║  │
│  ║           ║───────────────────────────║  │
│  ║           ║         [Save] [Cancel]   ║  │
│  ╚═══════════╩═══════════════════════════╝  │
└─────────────────────────────────────────────┘
```

- Sidebar: vertical list of sections, active item highlighted with accent color
- Content area: scrollable, generous padding
- "Appearance" tab renamed to "Look" (shorter, fits sidebar)
- Same glassmorphic styling (blur, translucent backgrounds)
- Backdrop overlay behind panel

## Sections

1. **Timer** — Focus/short break/long break durations (unchanged)
2. **Music** — Music source, YouTube URL, Tidal settings, sound toggle (unchanged)
3. **Look** — Wallpaper toggle, background images, progress ring toggle, always-on-top (renamed from Appearance)
4. **Themes** — Visual theme picker with preview cards (new)

## Theme System Architecture

Each theme is a JavaScript object that maps to CSS custom properties:

```js
const themes = {
  "midnight": {
    name: "Midnight",
    description: "The classic PulsoDoro look",
    colors: {
      focus: "#e94560",
      shortBreak: "#2ecc71",
      longBreak: "#9b59b6",
      background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
      surface: "rgba(255,255,255,0.08)",
      text: "#e0e0e0",
      border: "rgba(255,255,255,0.15)"
    },
    blur: "12px",
    preview: { ring: "#e94560", bg: "#1a1a2e" }
  },
  "ember": {
    name: "Ember",
    description: "Warm and cozy",
    colors: {
      focus: "<amber/orange>",
      shortBreak: "<warm green>",
      longBreak: "<golden>",
      background: "<dark charcoal gradient>",
      surface: "...",
      text: "...",
      border: "..."
    },
    blur: "...",
    preview: { ring: "<amber>", bg: "<charcoal>" }
  },
  "arctic": {
    name: "Arctic",
    description: "Cool and crisp",
    colors: {
      focus: "<icy blue>",
      shortBreak: "<mint>",
      longBreak: "<soft lavender>",
      background: "<deep navy gradient>",
      surface: "...",
      text: "<crisp white>",
      border: "..."
    },
    blur: "...",
    preview: { ring: "<icy blue>", bg: "<navy>" }
  }
}
```

### How it works

1. Selecting a theme writes its CSS variables to `:root`
2. Theme ID saved in `settings.json` (new `theme` field)
3. On app load, theme is applied before first paint
4. Timer state colors (focus/break) come from the theme

## Theme Picker UI

Themes section shows visual preview cards in a responsive grid:

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│ ┌──────┐  │  │ ┌──────┐  │  │ ┌──────┐  │
│ │  ◯   │  │  │ │  ◯   │  │  │ │  ◯   │  │
│ └──────┘  │  │ └──────┘  │  │ └──────┘  │
│ Midnight  │  │  Ember    │  │  Arctic   │
│  ✓ Active │  │           │  │           │
└───────────┘  └───────────┘  └───────────┘
```

Each card:
- Mini-mockup showing the theme's colors (gradient bg, colored ring)
- Theme name and optional description
- Active theme has checkmark + highlighted border
- Click to select — applies immediately as live preview

## Data Flow & Persistence

### Backend changes (Rust)

- Add `theme: String` field to `AppSettings` struct (default: `"midnight"`)
- Existing settings without `theme` field default to `"midnight"` via serde

### Frontend flow

1. App starts → settings loaded → theme CSS variables applied to `:root`
2. User opens Settings → Themes section shows cards, active one highlighted
3. User clicks a theme card → CSS variables update immediately (live preview)
4. Save → theme ID persisted to `settings.json`
5. Cancel → previous theme CSS variables restored

## Initial Themes

| Theme | Focus | Short Break | Long Break | Background | Feel |
|-------|-------|-------------|------------|------------|------|
| Midnight | Red/pink | Green | Purple | Dark blue gradient | Current classic |
| Ember | Amber/orange | Warm green | Golden | Dark charcoal gradient | Warm, cozy |
| Arctic | Icy blue | Mint | Soft lavender | Deep navy gradient | Cool, crisp |

## Decisions

- Sidebar settings replaces tabbed modal (solves clutter, scales for future features)
- Themes are full visual (colors + gradients + blur + borders), not just color swaps
- 3 themes at launch, extensible for more later
- Live preview on click, revert on cancel
- Single `theme` field in settings (not individual color overrides)
