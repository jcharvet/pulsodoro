# Tidal Embed Player Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the broken WebviewWindow Tidal integration with Tidal's embed player (`embed.tidal.com`) in an iframe, mirroring how YouTube already works in PulsoDoro.

**Architecture:** Tidal's embed player loads in an iframe with `allow="encrypted-media *;"` for DRM. Tidal subscribers log in inside the embed to get full playback. The user configures their Tidal content (preset playlist or custom URL) in Settings > Music tab, then toggles the player with the Music button. The embed container is positioned above the bottom bar, similar to YouTube's player but larger (350x300 for gridify layout).

**Tech Stack:** HTML/CSS/JS (frontend), Rust/Tauri (settings persistence), Tidal embed player iframe

---

### Task 1: Clean up broken WebviewWindow code and remove unused permission

**Files:**
- Modify: `src/main.js:67,258-283,511-513`
- Modify: `src-tauri/capabilities/default.json:16`

**Step 1: Remove `tidalWindow` variable and WebviewWindow code from main.js**

In `src/main.js`, replace line 67:

```javascript
let tidalWindow = null;
```

With:

```javascript
const tidalPlayerContainer = document.getElementById("tidal-player-container");
const tidalPlayer = document.getElementById("tidal-player");
const tidalPresetSelect = document.getElementById("tidal-preset");
const tidalUrlInput = document.getElementById("tidal-url");
```

**Step 2: Replace the tidal branch in the music toggle handler**

In `src/main.js`, replace lines 258-283 (the entire `} else if (musicSource === "tidal") {` block):

```javascript
  } else if (musicSource === "tidal") {
    if (musicPlaying) {
      tidalPlayerContainer.classList.add("hidden");
      tidalPlayer.src = "";
      musicToggle.classList.remove("active");
    } else {
      tidalPlayer.src = getTidalEmbedUrl();
      tidalPlayerContainer.classList.remove("hidden");
      musicToggle.classList.add("active");
    }
    musicPlaying = !musicPlaying;
  }
```

**Step 3: Replace the tidal branch in the save settings music-source-switch block**

In `src/main.js`, replace lines 511-513:

```javascript
      } else if (musicSource === "tidal" && tidalWindow) {
        await tidalWindow.close();
        tidalWindow = null;
      }
```

With:

```javascript
      } else if (musicSource === "tidal") {
        tidalPlayer.src = "";
        tidalPlayerContainer.classList.add("hidden");
      }
```

**Step 4: Remove `core:webview:allow-create-webview-window` from capabilities**

In `src-tauri/capabilities/default.json`, remove line 16:

```json
    "core:webview:allow-create-webview-window"
```

So the `permissions` array ends with `"opener:default"` (keep the trailing entry without comma issues — the array should be valid JSON).

**Step 5: Verify compilation**

Run: `/c/Users/Eliphas/.cargo/bin/cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Compiles successfully (no Rust changes, just JSON + JS).

**Step 6: Commit**

```bash
git add src/main.js src-tauri/capabilities/default.json
git commit -m "refactor: remove broken WebviewWindow Tidal code, prep for embed player"
```

---

### Task 2: Add Tidal embed player HTML

**Files:**
- Modify: `index.html:98-100,155`

**Step 1: Replace Tidal settings content in the Music tab**

In `index.html`, replace lines 98-100 (the current tidal-settings div):

```html
                <div id="tidal-settings" class="setting-group hidden">
                    <p class="hint">Click the Music button to open Tidal. Log in once, then browse and play directly.</p>
                </div>
```

With:

```html
                <div id="tidal-settings" class="setting-group hidden">
                    <label>Tidal Playlist</label>
                    <select id="tidal-preset">
                        <option value="c59242b9-fc33-4f93-954c-d5d164949ba1">LoFi Study Session Beats</option>
                        <option value="2b2cb045-0b11-4340-b625-b3dcd209193c">Ultimate Lo-Fi / Chillhop</option>
                    </select>
                    <label>Custom Tidal URL <span class="hint">(overrides preset when filled)</span></label>
                    <input type="text" id="tidal-url" placeholder="Paste Tidal playlist, album, or track URL" />
                    <p class="hint" style="margin-top: 0.5rem;">Sign in inside the player to unlock full playback.</p>
                </div>
```

**Step 2: Add the Tidal player container before the closing script tag**

In `index.html`, after line 155 (the `</div>` closing `youtube-player-container`) and before the `<script>` tag, add:

```html

    <div id="tidal-player-container" class="hidden">
        <iframe id="tidal-player" src="" allow="encrypted-media *; autoplay"
            frameborder="0" width="350" height="300"></iframe>
    </div>
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Tidal embed player HTML with preset dropdown and custom URL"
```

---

### Task 3: Add CSS for Tidal embed player container

**Files:**
- Modify: `src/styles.css` (after `#youtube-player-container iframe` rule, ~line 495)

**Step 1: Add tidal player container styles**

After the `#youtube-player-container iframe` rule (line 495), add:

```css

#tidal-player-container {
    position: fixed;
    bottom: 55px;
    left: 10px;
    z-index: 3;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

#tidal-player-container iframe {
    display: block;
}
```

**Step 2: Commit**

```bash
git add src/styles.css
git commit -m "feat: add CSS for Tidal embed player container"
```

---

### Task 4: Add Tidal URL parsing and embed URL generation to JavaScript

**Files:**
- Modify: `src/main.js` (after `getYouTubeVideoId` function, ~line 217)

**Step 1: Add `extractTidalInfo` function**

After the `getYouTubeVideoId` function (after line 216), add:

```javascript

// --- Tidal Embed Player ---
function extractTidalInfo(input) {
  if (!input) return null;
  const trimmed = input.trim();
  // Match tidal.com URLs: /browse/type/id or /type/id
  const m = trimmed.match(
    /tidal\.com\/(?:browse\/)?(track|album|playlist|video)s?\/([a-zA-Z0-9-]+)/
  );
  if (m) return { type: m[1] + "s", id: m[2] };
  return null;
}

function getTidalEmbedUrl() {
  const customUrl = tidalUrlInput.value.trim();
  if (customUrl) {
    const info = extractTidalInfo(customUrl);
    if (info) {
      return `https://embed.tidal.com/${info.type}/${info.id}?layout=gridify`;
    }
  }
  const presetValue = tidalPresetSelect.value;
  return `https://embed.tidal.com/playlists/${presetValue}?layout=gridify`;
}
```

**Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat: add Tidal URL parsing and embed URL generation"
```

---

### Task 5: Wire up Tidal settings save/restore and verify everything works

**Files:**
- Modify: `src/main.js:444-466,469-527`

**Step 1: Update settings open handler to restore Tidal fields**

In `src/main.js`, after line 454 (`tidalSettings.classList.toggle(...)`) and before line 455 (`alwaysOnTopToggle.checked = ...`), add:

```javascript
  // Restore Tidal fields
  const tidalInfo = extractTidalInfo(settings.tidal_url);
  if (tidalInfo) {
    tidalUrlInput.value = settings.tidal_url;
  } else if (settings.tidal_url) {
    tidalPresetSelect.value = settings.tidal_url;
    tidalUrlInput.value = "";
  } else {
    tidalUrlInput.value = "";
    tidalPresetSelect.selectedIndex = 0;
  }
```

**Step 2: Update save handler to persist Tidal URL**

In `src/main.js`, replace line 478:

```javascript
    tidal_url: "",
```

With:

```javascript
    tidal_url: tidalUrlInput.value.trim() || tidalPresetSelect.value,
```

**Step 3: Run all Rust tests to confirm nothing is broken**

Run: `/c/Users/Eliphas/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All 30 tests pass.

**Step 4: Verify Rust compilation**

Run: `/c/Users/Eliphas/.cargo/bin/cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Compiles successfully.

**Step 5: Commit**

```bash
git add src/main.js
git commit -m "feat: wire Tidal settings save/restore and embed URL persistence"
```

---

### Task 6: Manual integration test

**Step 1: Run the app with `dev.bat`**

**Step 2: Test Settings button works**
1. Click Settings gear icon — panel should open
2. Timer tab should be visible by default
3. Click Music tab — should show music source dropdown
4. Click Appearance tab — should show background settings
5. Click Cancel — panel should close

**Step 3: Test YouTube (existing behavior preserved)**
1. Click Music button — YouTube player should appear bottom-left
2. Click Music again — should hide/pause
3. Open Settings > Music > paste a YouTube URL > Save
4. Toggle Music — should play the custom video

**Step 4: Test Tidal embed**
1. Settings > Music > change source to "Tidal"
2. Verify preset dropdown shows "LoFi Study Session Beats" selected
3. Leave custom URL empty, Save
4. Click Music button — Tidal embed should appear bottom-left showing the preset playlist
5. Inside the embed, look for "Sign in" or "Log in" — click it, log into Tidal
6. After login, tracks should play in full (not 30-sec previews)

**Step 5: Test Tidal custom URL**
1. Settings > Music > Tidal selected
2. Paste a Tidal URL like `https://tidal.com/browse/playlist/YOUR-PLAYLIST-UUID`
3. Save > Click Music — embed should show that playlist
4. Close and reopen app — settings should persist

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration test fixes for Tidal embed player"
```
