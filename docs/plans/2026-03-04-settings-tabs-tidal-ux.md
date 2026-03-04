# Settings Tabs + Tidal UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the settings panel into 3 tabs (Timer/Music/Appearance) and add a "Browse on Tidal" button for easier track selection.

**Architecture:** The settings panel HTML gets restructured with a tab bar and 3 tab content divs. CSS handles tab active states and content visibility. JS manages tab switching. The Tidal section gets a "Browse on Tidal" button that opens listen.tidal.com via Tauri's opener plugin. The "Custom URL..." dropdown option is removed; the URL field is always visible and overrides the preset when filled.

**Tech Stack:** HTML/CSS/JS (frontend), Rust/Tauri (opener plugin), tauri-plugin-opener

---

### Task 1: Add tauri-plugin-opener dependency

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

**Step 1: Add the opener plugin to Cargo.toml**

In `src-tauri/Cargo.toml`, add after the `chrono = "0.4"` line (line 22):

```toml
tauri-plugin-opener = "2"
```

**Step 2: Register the plugin in lib.rs**

In `src-tauri/src/lib.rs`, in the `tauri::Builder::default()` chain (line 166), add after `.plugin(tauri_plugin_dialog::init())` (line 168):

```rust
.plugin(tauri_plugin_opener::init())
```

**Step 3: Add opener permission to capabilities**

In `src-tauri/capabilities/default.json`, add to the `permissions` array after `"core:window:allow-is-fullscreen"` (line 14):

```json
"opener:default"
```

**Step 4: Verify compilation**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Compiles successfully.

**Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "feat: add tauri-plugin-opener for opening external URLs"
```

---

### Task 2: Restructure HTML settings panel into tabs

**Files:**
- Modify: `index.html:62-141`

**Step 1: Replace the entire settings panel content**

Replace everything from `<div id="settings-panel" class="hidden">` (line 62) through its closing `</div>` (line 142) with:

```html
<div id="settings-panel" class="hidden">
    <div id="settings-content">
        <h2>Settings</h2>
        <div class="settings-tabs">
            <button class="tab-btn active" data-tab="timer">Timer</button>
            <button class="tab-btn" data-tab="music">Music</button>
            <button class="tab-btn" data-tab="appearance">Appearance</button>
        </div>

        <div id="tab-timer" class="tab-content active">
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

        <div id="tab-music" class="tab-content">
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
                <label>Tidal Playlist</label>
                <select id="tidal-preset">
                    <option value="c59242b9-fc33-4f93-954c-d5d164949ba1">LoFi Study Session Beats</option>
                    <option value="2b2cb045-0b11-4340-b625-b3dcd209193c">Ultimate Lo-Fi / Chillhop</option>
                </select>
                <label>Custom Tidal URL <span class="hint">(overrides preset when filled)</span></label>
                <input type="text" id="tidal-url" placeholder="Paste Tidal URL (playlist, album, or track)" />
                <button id="browse-tidal" class="pick-btn" style="margin-top: 0.5rem;">Browse on Tidal</button>
            </div>
            <div class="setting-group">
                <label>
                    <input type="checkbox" id="sound-toggle" checked />
                    Sound alert on transition
                </label>
            </div>
        </div>

        <div id="tab-appearance" class="tab-content">
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

        <div class="settings-actions">
            <button id="save-settings">Save</button>
            <button id="close-settings">Cancel</button>
        </div>
    </div>
</div>
```

Key changes:
- Tab bar with 3 buttons (Timer/Music/Appearance)
- Settings grouped into `tab-content` divs
- Sound toggle moved to Music tab
- Tidal URL field is always visible (no more "Custom URL..." dropdown option)
- Added "Browse on Tidal" button
- Added hint text "(overrides preset when filled)"

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: restructure settings panel into tabs with improved Tidal UX"
```

---

### Task 3: Add CSS for tabs

**Files:**
- Modify: `src/styles.css`

**Step 1: Add tab styles**

After the `#settings-content h2` rule (line 327), add:

```css
.settings-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #888;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: none;
}

.tab-btn:hover {
    color: #ccc;
    background: none;
}

.tab-btn.active {
    color: var(--focus-color);
    border-bottom-color: var(--focus-color);
    background: none;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.hint {
    font-size: 0.75rem;
    color: #666;
    font-weight: normal;
}
```

**Step 2: Commit**

```bash
git add src/styles.css
git commit -m "feat: add CSS for settings tabs and hint text"
```

---

### Task 4: Add tab switching and Browse on Tidal logic to JavaScript

**Files:**
- Modify: `src/main.js`

**Step 1: Add DOM refs for new elements**

After the `const tidalPlayer` line (line 70), add:

```javascript
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const browseTidalBtn = document.getElementById("browse-tidal");
```

**Step 2: Add tab switching logic**

After the `musicSourceSelect.addEventListener("change", ...)` block (after line 560), add:

```javascript
// --- Settings Tabs ---
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});
```

**Step 3: Add "Browse on Tidal" click handler**

After the tab switching logic, add:

```javascript
browseTidalBtn.addEventListener("click", async () => {
  const { openUrl } = window.__TAURI__.opener;
  await openUrl("https://listen.tidal.com");
});
```

**Step 4: Update getTidalEmbedUrl to handle URL-overrides-preset logic**

Replace the existing `getTidalEmbedUrl` function (lines 228-238) with:

```javascript
function getTidalEmbedUrl() {
  // Custom URL overrides preset when filled
  const customUrl = tidalUrlInput.value.trim();
  if (customUrl) {
    const info = extractTidalInfo(customUrl);
    if (info) {
      return `https://embed.tidal.com/${info.type}/${info.id}`;
    }
  }
  const presetValue = tidalPresetSelect.value;
  return `https://embed.tidal.com/playlists/${presetValue}`;
}
```

**Step 5: Remove the old tidalPresetSelect "custom" change handler**

Delete the block at lines 240-242:

```javascript
tidalPresetSelect.addEventListener("change", () => {
  tidalUrlInput.classList.toggle("hidden", tidalPresetSelect.value !== "custom");
});
```

This is no longer needed since the URL field is always visible.

**Step 6: Update save settings to use new tidal_url logic**

In the save settings handler, find line 502:

```javascript
    tidal_url: tidalPresetSelect.value === "custom" ? tidalUrlInput.value : tidalPresetSelect.value,
```

Replace with:

```javascript
    tidal_url: tidalUrlInput.value.trim() || tidalPresetSelect.value,
```

**Step 7: Update settings open handler for Tidal URL restore**

In the settings open handler, find lines 475-483:

```javascript
  const tidalInfo = extractTidalInfo(settings.tidal_url);
  const isPreset = !settings.tidal_url || !tidalInfo;
  if (isPreset && settings.tidal_url) {
    tidalPresetSelect.value = settings.tidal_url;
  } else if (tidalInfo) {
    tidalPresetSelect.value = "custom";
    tidalUrlInput.value = settings.tidal_url;
  }
  tidalUrlInput.classList.toggle("hidden", tidalPresetSelect.value !== "custom");
```

Replace with:

```javascript
  const tidalInfo = extractTidalInfo(settings.tidal_url);
  if (tidalInfo) {
    tidalUrlInput.value = settings.tidal_url;
  } else if (settings.tidal_url) {
    tidalPresetSelect.value = settings.tidal_url;
    tidalUrlInput.value = "";
  } else {
    tidalUrlInput.value = "";
  }
```

**Step 8: Reset tab to Timer when opening settings**

In the settings open handler, before `settingsPanel.classList.remove("hidden");` (line 490), add:

```javascript
  // Reset to Timer tab
  tabBtns.forEach((b) => b.classList.remove("active"));
  tabContents.forEach((c) => c.classList.remove("active"));
  tabBtns[0].classList.add("active");
  tabContents[0].classList.add("active");
```

**Step 9: Commit**

```bash
git add src/main.js
git commit -m "feat: add tab switching, Browse on Tidal, and URL-overrides-preset logic"
```

---

### Task 5: Add npm dependency for opener plugin frontend

**Files:**
- Modify: `package.json`

**Step 1: Install the frontend plugin package**

Run: `npm install @tauri-apps/plugin-opener`

**Step 2: Verify it installs correctly**

Check that `@tauri-apps/plugin-opener` appears in `package.json` dependencies.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @tauri-apps/plugin-opener frontend dependency"
```

---

### Task 6: Manual integration test

**Step 1: Run the app with `dev.bat`**

**Step 2: Test tab navigation**
1. Open Settings - should show Timer tab by default
2. Click Music tab - should show music settings
3. Click Appearance tab - should show wallpaper/ring/always-on-top settings
4. Click Timer tab - should go back
5. Verify panel height is much shorter now

**Step 3: Test Tidal UX**
1. In Music tab, switch to Tidal
2. Verify preset dropdown and URL field are both visible
3. Click "Browse on Tidal" - should open listen.tidal.com in browser
4. Paste a Tidal URL in the custom field
5. Save, toggle music - should play the custom URL (overriding preset)
6. Clear the custom URL field, save - should fall back to preset

**Step 4: Test settings persistence**
1. Close and reopen app
2. Verify all settings preserved

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration test fixes for tabbed settings"
```
