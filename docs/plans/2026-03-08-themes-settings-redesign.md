# Themes & Settings Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a theme system with 3 visual themes and redesign the settings panel from a tabbed modal to a sidebar layout.

**Architecture:** Themes are JS objects that map to CSS custom properties on `:root`. The settings panel becomes a full-panel overlay with sidebar navigation (Timer, Music, Look, Themes). Theme selection uses visual preview cards with live preview on click.

**Tech Stack:** Vanilla JS, CSS custom properties, Rust/Tauri (settings persistence)

---

### Task 1: Add `theme` field to Rust AppSettings

**Files:**
- Modify: `src-tauri/src/settings.rs`

**Step 1: Add the theme field to the struct**

In `src-tauri/src/settings.rs`, add after line 23 (`pub show_progress_ring: bool,`):

```rust
    #[serde(default = "default_midnight")]
    pub theme: String,
```

Add the default function after line 33 (`}`):

```rust
fn default_midnight() -> String {
    "midnight".to_string()
}
```

In the `Default` impl, add after `show_progress_ring: true,` (line 49):

```rust
            theme: "midnight".to_string(),
```

**Step 2: Verify it compiles**

Run: `cd src-tauri && cargo check`
Expected: compiles with no errors

**Step 3: Commit**

```bash
git add src-tauri/src/settings.rs
git commit -m "feat: add theme field to AppSettings"
```

---

### Task 2: Create theme definitions

**Files:**
- Create: `src/themes.js`

**Step 1: Create the themes module**

Create `src/themes.js` with three theme definitions:

```js
export const THEMES = {
  midnight: {
    name: "Midnight",
    description: "The classic PulsoDoro look",
    colors: {
      focus: "#e94560",
      focusRgb: "233, 69, 96",
      shortBreak: "#2ecc71",
      shortBreakRgb: "46, 204, 113",
      longBreak: "#9b59b6",
      longBreakRgb: "155, 89, 182",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      surface: "rgba(255, 255, 255, 0.08)",
      surfaceHover: "rgba(255, 255, 255, 0.15)",
      surfaceBorder: "rgba(255, 255, 255, 0.15)",
      text: "#e0e0e0",
      textMuted: "#aaaaaa",
      textDim: "#888888",
      settingsBg: "#1a1a2e",
      overlay: "rgba(0, 0, 0, 0.5)",
    },
    blur: "12px",
  },
  ember: {
    name: "Ember",
    description: "Warm and cozy",
    colors: {
      focus: "#e67e22",
      focusRgb: "230, 126, 34",
      shortBreak: "#27ae60",
      shortBreakRgb: "39, 174, 96",
      longBreak: "#f1c40f",
      longBreakRgb: "241, 196, 15",
      background: "linear-gradient(135deg, #1a1210 0%, #2c1810 50%, #3d2014 100%)",
      surface: "rgba(255, 200, 150, 0.06)",
      surfaceHover: "rgba(255, 200, 150, 0.12)",
      surfaceBorder: "rgba(255, 180, 120, 0.15)",
      text: "#f0e0d0",
      textMuted: "#c0a890",
      textDim: "#907060",
      settingsBg: "#1a1210",
      overlay: "rgba(10, 5, 0, 0.5)",
    },
    blur: "14px",
  },
  arctic: {
    name: "Arctic",
    description: "Cool and crisp",
    colors: {
      focus: "#3498db",
      focusRgb: "52, 152, 219",
      shortBreak: "#1abc9c",
      shortBreakRgb: "26, 188, 156",
      longBreak: "#a29bfe",
      longBreakRgb: "162, 155, 254",
      background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #1b2838 100%)",
      surface: "rgba(150, 200, 255, 0.06)",
      surfaceHover: "rgba(150, 200, 255, 0.12)",
      surfaceBorder: "rgba(150, 200, 255, 0.15)",
      text: "#e8f0f8",
      textMuted: "#a0b8d0",
      textDim: "#708898",
      settingsBg: "#0a0e1a",
      overlay: "rgba(0, 5, 15, 0.5)",
    },
    blur: "10px",
  },
};

/** Apply a theme by ID to the document */
export function applyTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;

  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty("--focus-color", c.focus);
  root.style.setProperty("--focus-color-rgb", c.focusRgb);
  root.style.setProperty("--short-break-color", c.shortBreak);
  root.style.setProperty("--short-break-color-rgb", c.shortBreakRgb);
  root.style.setProperty("--long-break-color", c.longBreak);
  root.style.setProperty("--long-break-color-rgb", c.longBreakRgb);
  root.style.setProperty("--bg-gradient", c.background);
  root.style.setProperty("--surface-color", c.surface);
  root.style.setProperty("--surface-hover", c.surfaceHover);
  root.style.setProperty("--surface-border", c.surfaceBorder);
  root.style.setProperty("--text-color", c.text);
  root.style.setProperty("--text-muted", c.textMuted);
  root.style.setProperty("--text-dim", c.textDim);
  root.style.setProperty("--settings-bg", c.settingsBg);
  root.style.setProperty("--overlay-color", c.overlay);
  root.style.setProperty("--blur-amount", theme.blur);

  // Update the background gradient for #bg-image
  const bgImage = document.getElementById("bg-image");
  if (bgImage && !bgImage.style.backgroundImage.startsWith("url")) {
    bgImage.style.background = c.background;
  }
}
```

**Step 2: Commit**

```bash
git add src/themes.js
git commit -m "feat: add theme definitions for Midnight, Ember, Arctic"
```

---

### Task 3: Refactor CSS to use theme variables

**Files:**
- Modify: `src/styles.css`

This task replaces hardcoded colors with CSS custom properties so themes can control them. The `:root` block provides defaults matching the Midnight theme.

**Step 1: Update `:root` variables**

Replace lines 1-8 of `src/styles.css`:

```css
:root {
    --focus-color: #e94560;
    --focus-color-rgb: 233, 69, 96;
    --short-break-color: #2ecc71;
    --short-break-color-rgb: 46, 204, 113;
    --long-break-color: #9b59b6;
    --long-break-color-rgb: 155, 89, 182;
    --bg-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    --surface-color: rgba(255, 255, 255, 0.08);
    --surface-hover: rgba(255, 255, 255, 0.15);
    --surface-border: rgba(255, 255, 255, 0.15);
    --text-color: #e0e0e0;
    --text-muted: #aaaaaa;
    --text-dim: #888888;
    --settings-bg: #1a1a2e;
    --overlay-color: rgba(0, 0, 0, 0.5);
    --blur-amount: 12px;
}
```

**Step 2: Replace hardcoded values throughout the CSS**

Key replacements (non-exhaustive, apply throughout file):

| Hardcoded | Variable |
|-----------|----------|
| `color: #e0e0e0` | `color: var(--text-color)` |
| `color: #aaa` | `color: var(--text-muted)` |
| `color: #888` | `color: var(--text-dim)` |
| `color: #ccc` | `color: var(--text-color)` |
| `background: rgba(0, 0, 0, 0.5)` (in `#bg-overlay`) | `background: var(--overlay-color)` |
| `linear-gradient(135deg, #1a1a2e ...)` (in `#bg-image`) | `background: var(--bg-gradient)` |
| `background: #1a1a2e` (in `#settings-content`) | `background: var(--settings-bg)` |
| `rgba(255, 255, 255, 0.08)` (surfaces) | `var(--surface-color)` |
| `rgba(255, 255, 255, 0.15)` (borders) | `var(--surface-border)` |
| `rgba(255, 255, 255, 0.1)` (buttons) | `var(--surface-color)` |
| `rgba(255, 255, 255, 0.2)` (button hover/borders) | `var(--surface-hover)` |
| `backdrop-filter: blur(10px)` | `backdrop-filter: blur(var(--blur-amount))` |
| `backdrop-filter: blur(5px)` | `backdrop-filter: blur(var(--blur-amount))` |
| `background: #1a1a2e` (select options) | `background: var(--settings-bg)` |

Specific selectors to update:

- `body` line 18: `color: var(--text-color);`
- `#bg-image` line 28: `background: var(--bg-gradient);`
- `#bg-overlay` line 38: `background: var(--overlay-color);`
- `button` line 191: `background: rgba(0, 0, 0, 0.3);` — keep as-is (transparent overlay on any theme)
- `#bottom-bar` line 261: `backdrop-filter: blur(var(--blur-amount));`
- `#music-toggle, #settings-btn, #pin-btn, #fullscreen-btn` line 279: `background: var(--surface-color);` and `border: 1px solid var(--surface-border);`
- Line 291 hover: `background: var(--surface-hover);`
- `#settings-panel` line 304: `background: rgba(0, 0, 0, 0.7);` and `backdrop-filter: blur(var(--blur-amount));`
- `#settings-content` line 313: `background: var(--settings-bg);` and `border: 1px solid var(--surface-border);`
- `.setting-group label` line 381: `color: var(--text-muted);`
- `.setting-group input/select` backgrounds: `background: var(--surface-color);` and `border: 1px solid var(--surface-border);`
- `.bg-file-name` line 452: `color: var(--text-dim);`
- `.pick-btn` line 459: `background: var(--surface-color) !important;` and `border: 1px solid var(--surface-border) !important;`
- `#activity-card` line 232: `backdrop-filter: blur(var(--blur-amount));` and `border: 1px solid var(--surface-border);`
- `#activity-text` line 248: `color: var(--text-color);`
- `#stats-display` line 274: `color: var(--text-dim);`
- `.tab-btn` line 342: `color: var(--text-dim);`
- `.tab-btn:hover` line 353: `color: var(--text-color);`
- `.hint` line 372: `color: var(--text-dim);`
- `.dot` line 165: `border: 2px solid var(--surface-border);`
- `.bg-option` line 425-431: `background: var(--surface-color);` and `border: 1px solid var(--surface-border);`

**Step 3: Verify the app looks the same**

Run: `cargo tauri dev`
Expected: App looks identical (Midnight theme defaults match old hardcoded values)

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "refactor: replace hardcoded colors with CSS custom properties"
```

---

### Task 4: Redesign settings HTML to sidebar layout

**Files:**
- Modify: `index.html` (lines 62-159)

**Step 1: Replace the settings panel HTML**

Replace lines 62-159 in `index.html` with:

```html
    <div id="settings-panel" class="hidden">
        <div id="settings-content">
            <div class="settings-sidebar">
                <h2>Settings</h2>
                <nav class="settings-nav">
                    <button class="nav-btn active" data-section="timer">Timer</button>
                    <button class="nav-btn" data-section="music">Music</button>
                    <button class="nav-btn" data-section="look">Look</button>
                    <button class="nav-btn" data-section="themes">Themes</button>
                </nav>
            </div>
            <div class="settings-main">
                <div id="section-timer" class="settings-section active">
                    <h3>Timer</h3>
                    <div class="setting-group">
                        <label>Focus (minutes)</label>
                        <input type="number" id="focus-duration" min="1" max="120" value="25" />
                    </div>
                    <div class="setting-group">
                        <label>Short Break (minutes)</label>
                        <input type="number" id="short-break-duration" min="1" max="60" value="5" />
                    </div>
                    <div class="setting-group">
                        <label>Long Break (minutes)</label>
                        <input type="number" id="long-break-duration" min="1" max="60" value="15" />
                    </div>
                </div>

                <div id="section-music" class="settings-section">
                    <h3>Music</h3>
                    <div class="setting-group">
                        <label>Music Source</label>
                        <select id="music-source">
                            <option value="youtube">YouTube</option>
                            <option value="tidal">Tidal</option>
                        </select>
                    </div>
                    <div id="youtube-settings" class="setting-group">
                        <label>YouTube Music URL / ID</label>
                        <input type="text" id="youtube-url" placeholder="Paste YouTube URL or video ID" />
                    </div>
                    <div id="tidal-settings" class="setting-group hidden">
                        <p class="hint" style="margin-bottom: 0.6rem;">
                            1. Click the <strong>Music</strong> button to open Tidal<br/>
                            2. Log in with your Tidal account (only needed once)<br/>
                            3. Pick your music and hit play<br/>
                            4. Click <strong>Music</strong> again to hide the window &mdash; audio keeps playing<br/>
                            5. Click <strong>Music</strong> to bring it back anytime
                        </p>
                        <label>Starting URL <span class="hint">(optional)</span></label>
                        <input type="text" id="tidal-url" placeholder="Paste a Tidal playlist or album URL" />
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="sound-toggle" checked />
                            Sound alert on transition
                        </label>
                    </div>
                </div>

                <div id="section-look" class="settings-section">
                    <h3>Look</h3>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="wallpaper-toggle" checked />
                            Change desktop wallpaper
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>Focus Background</label>
                        <div class="bg-row">
                            <span id="focus-bg-name" class="bg-file-name">Default gradient</span>
                            <button id="pick-focus-bg" class="pick-btn">Browse...</button>
                            <button id="clear-focus-bg" class="pick-btn">Clear</button>
                        </div>
                    </div>
                    <div class="setting-group">
                        <label>Break Background</label>
                        <div class="bg-row">
                            <span id="break-bg-name" class="bg-file-name">Default gradient</span>
                            <button id="pick-break-bg" class="pick-btn">Browse...</button>
                            <button id="clear-break-bg" class="pick-btn">Clear</button>
                        </div>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="progress-ring-toggle" checked />
                            Show progress ring
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="always-on-top-toggle" />
                            Always on top
                        </label>
                    </div>
                </div>

                <div id="section-themes" class="settings-section">
                    <h3>Themes</h3>
                    <div id="theme-grid" class="theme-grid">
                        <!-- Theme cards rendered by JavaScript -->
                    </div>
                </div>

                <div class="settings-actions">
                    <button id="save-settings">Save</button>
                    <button id="close-settings">Cancel</button>
                </div>
            </div>
        </div>
    </div>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: redesign settings HTML to sidebar layout with themes section"
```

---

### Task 5: Update CSS for sidebar settings layout

**Files:**
- Modify: `src/styles.css`

**Step 1: Replace settings CSS**

Replace the settings-related CSS (lines 301-481, from `#settings-panel` through `.pick-btn:hover`) with the new sidebar layout styles:

```css
/* --- Settings Panel (Sidebar Layout) --- */
#settings-panel {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(var(--blur-amount));
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
}

#settings-content {
    background: var(--settings-bg);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    display: flex;
    width: 600px;
    max-width: 90vw;
    height: 420px;
    max-height: 85vh;
    overflow: hidden;
}

.settings-sidebar {
    width: 160px;
    min-width: 160px;
    padding: 1.5rem 0;
    border-right: 1px solid var(--surface-border);
    display: flex;
    flex-direction: column;
}

.settings-sidebar h2 {
    font-weight: 400;
    font-size: 1.1rem;
    letter-spacing: 2px;
    color: var(--focus-color);
    padding: 0 1.25rem;
    margin-bottom: 1.5rem;
}

.settings-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.nav-btn {
    display: block;
    width: 100%;
    padding: 0.6rem 1.25rem;
    background: none;
    border: none;
    border-radius: 0;
    color: var(--text-dim);
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    text-transform: none;
    letter-spacing: 0.5px;
    transition: all 0.15s ease;
    backdrop-filter: none;
    border-left: 3px solid transparent;
}

.nav-btn:hover {
    color: var(--text-color);
    background: var(--surface-color);
}

.nav-btn.active {
    color: var(--focus-color);
    background: var(--surface-color);
    border-left-color: var(--focus-color);
}

.settings-main {
    flex: 1;
    padding: 1.5rem 2rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.settings-section {
    display: none;
    flex: 1;
}

.settings-section.active {
    display: block;
}

.settings-section h3 {
    font-weight: 400;
    font-size: 1rem;
    letter-spacing: 1px;
    color: var(--text-color);
    margin-bottom: 1.25rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--surface-border);
}

.hint {
    font-size: 0.75rem;
    color: var(--text-dim);
    font-weight: normal;
}

.setting-group {
    margin-bottom: 1.2rem;
}

.setting-group label {
    display: block;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
}

.setting-group input[type="number"],
.setting-group input[type="text"] {
    width: 100%;
    padding: 0.5rem;
    background: var(--surface-color);
    border: 1px solid var(--surface-border);
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
}

.setting-group select {
    width: 100%;
    padding: 0.5rem;
    background: var(--surface-color);
    border: 1px solid var(--surface-border);
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
}

.setting-group select option {
    background: var(--settings-bg);
    color: #fff;
}

.setting-group input[type="checkbox"] {
    margin-right: 0.5rem;
}

.bg-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.bg-file-name {
    flex: 1;
    font-size: 0.8rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pick-btn {
    padding: 0.3rem 0.6rem !important;
    font-size: 0.75rem !important;
    background: var(--surface-color) !important;
    border: 1px solid var(--surface-border) !important;
    color: var(--text-color) !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
}

.pick-btn:hover {
    background: var(--surface-hover) !important;
    color: #fff !important;
}

.settings-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 1rem;
}

.settings-actions button {
    flex: 1;
}

/* --- Theme Grid --- */
.theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
}

.theme-card {
    border: 2px solid var(--surface-border);
    border-radius: 10px;
    padding: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface-color);
}

.theme-card:hover {
    border-color: var(--text-muted);
}

.theme-card.active {
    border-color: var(--focus-color);
    box-shadow: 0 0 12px rgba(var(--focus-color-rgb), 0.3);
}

.theme-card-preview {
    width: 100%;
    height: 70px;
    border-radius: 6px;
    margin-bottom: 0.6rem;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.theme-card-ring {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid;
    opacity: 0.9;
}

.theme-card-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 0.15rem;
}

.theme-card-desc {
    font-size: 0.7rem;
    color: var(--text-dim);
}

.theme-card-active-badge {
    display: none;
    font-size: 0.65rem;
    color: var(--focus-color);
    margin-top: 0.25rem;
}

.theme-card.active .theme-card-active-badge {
    display: block;
}
```

**Step 2: Also remove the old `.settings-tabs` and `.tab-btn` and `.tab-content` rules**

These are no longer used. Remove:
- `.settings-tabs` rule
- `.tab-btn` rule
- `.tab-btn:hover` rule
- `.tab-btn.active` rule
- `.tab-content` rule
- `.tab-content.active` rule
- `.bg-option`, `.bg-option:hover`, `.bg-option.selected` rules (if still present)
- `#bg-picker` rule (if still present)

**Step 3: Verify it compiles (Vite)**

Run: `npx vite build` or `cargo tauri dev`
Expected: No CSS errors

**Step 4: Commit**

```bash
git add src/styles.css
git commit -m "feat: add sidebar settings layout and theme card CSS"
```

---

### Task 6: Update JavaScript for sidebar navigation and theme integration

**Files:**
- Modify: `src/main.js`

**Step 1: Add theme import and state variable**

At the top of `src/main.js` (after line 3), add:

```js
import { THEMES, applyTheme } from "./themes.js";
```

Update the DOM element references. Replace the tab-related references (lines 68-69):

```js
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
```

with:

```js
const navBtns = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".settings-section");
const themeGrid = document.getElementById("theme-grid");
```

Add a theme state variable near line 83 (`let musicSource = "youtube";`):

```js
let currentTheme = "midnight";
let pendingTheme = "midnight";
```

**Step 2: Replace the tab switching logic**

Replace lines 514-521 (the old tab switching):

```js
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});
```

with:

```js
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    navBtns.forEach((b) => b.classList.remove("active"));
    sections.forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`section-${btn.dataset.section}`).classList.add("active");
  });
});
```

**Step 3: Add theme card rendering function**

Add after the nav switching code:

```js
function renderThemeCards(activeThemeId) {
  themeGrid.innerHTML = "";
  for (const [id, theme] of Object.entries(THEMES)) {
    const card = document.createElement("div");
    card.className = "theme-card" + (id === activeThemeId ? " active" : "");
    card.dataset.theme = id;

    const preview = document.createElement("div");
    preview.className = "theme-card-preview";
    preview.style.background = theme.colors.background;

    const ring = document.createElement("div");
    ring.className = "theme-card-ring";
    ring.style.borderColor = theme.colors.focus;
    preview.appendChild(ring);

    const name = document.createElement("div");
    name.className = "theme-card-name";
    name.textContent = theme.name;

    const desc = document.createElement("div");
    desc.className = "theme-card-desc";
    desc.textContent = theme.description;

    const badge = document.createElement("div");
    badge.className = "theme-card-active-badge";
    badge.textContent = "✓ Active";

    card.appendChild(preview);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(badge);

    card.addEventListener("click", () => {
      pendingTheme = id;
      applyTheme(id);
      themeGrid.querySelectorAll(".theme-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
    });

    themeGrid.appendChild(card);
  }
}
```

**Step 4: Update the settings open handler**

In the `settingsBtn.addEventListener("click", ...)` handler (around line 426), update:

1. Replace the tab reset logic:
```js
  // Reset to Timer tab
  tabBtns.forEach((b) => b.classList.remove("active"));
  tabContents.forEach((c) => c.classList.remove("active"));
  tabBtns[0].classList.add("active");
  tabContents[0].classList.add("active");
```
with:
```js
  // Reset to Timer section
  navBtns.forEach((b) => b.classList.remove("active"));
  sections.forEach((s) => s.classList.remove("active"));
  navBtns[0].classList.add("active");
  sections[0].classList.add("active");
  // Load theme
  pendingTheme = settings.theme || "midnight";
  renderThemeCards(pendingTheme);
```

**Step 5: Update the save handler**

In `saveSettingsBtn.addEventListener("click", ...)` (around line 453):

1. Add `theme: pendingTheme,` to the settings object (after `show_progress_ring`).
2. After saving, add: `currentTheme = pendingTheme;`

**Step 6: Update the cancel handler**

In `closeSettingsBtn.addEventListener("click", ...)` (around line 509):

Add theme revert before hiding the panel:
```js
  if (pendingTheme !== currentTheme) {
    applyTheme(currentTheme);
  }
```

**Step 7: Update the music source toggle**

Replace the old references:
```js
musicSourceSelect.addEventListener("change", () => {
  youtubeSettings.classList.toggle("hidden", musicSourceSelect.value !== "youtube");
  tidalSettings.classList.toggle("hidden", musicSourceSelect.value !== "tidal");
});
```
This stays the same — no changes needed.

**Step 8: Update init function**

In `async function init()` (around line 592), add after `musicSource = settings.music_source || "youtube";`:

```js
  currentTheme = settings.theme || "midnight";
  pendingTheme = currentTheme;
  applyTheme(currentTheme);
```

**Step 9: Commit**

```bash
git add src/main.js
git commit -m "feat: wire up sidebar navigation, theme cards, and theme persistence"
```

---

### Task 7: Integration testing and polish

**Files:**
- All files from previous tasks

**Step 1: Run the app**

Run: `cargo tauri dev`

**Step 2: Test the settings panel**

1. Click the gear icon — settings panel should open with sidebar layout
2. Click each sidebar nav item — content should switch
3. All existing settings (Timer, Music, Look) should work as before

**Step 3: Test theme switching**

1. Navigate to Themes section
2. Click Ember card — app background and colors should change immediately
3. Click Arctic card — should switch again
4. Click Cancel — should revert to previous theme
5. Open settings, pick Ember, click Save — should persist
6. Reload app — Ember theme should still be applied

**Step 4: Test edge cases**

1. Timer state colors: start a focus session, verify focus color matches theme
2. Skip to short break, verify short break color matches theme
3. Music source toggle still works in Music section
4. Background image picker still works in Look section
5. Progress ring color matches theme

**Step 5: Fix any visual issues found during testing**

Address spacing, alignment, color contrast issues.

**Step 6: Commit final polish**

```bash
git add -A
git commit -m "fix: polish theme integration and settings layout"
```

---

### Summary of all files touched

| File | Action |
|------|--------|
| `src-tauri/src/settings.rs` | Add `theme` field |
| `src/themes.js` | Create (theme definitions + `applyTheme`) |
| `src/styles.css` | Refactor to CSS variables + new sidebar/theme CSS |
| `index.html` | Redesign settings HTML to sidebar layout |
| `src/main.js` | Import themes, sidebar nav, theme cards, save/cancel/init |
