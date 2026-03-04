# Tidal Music Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Tidal as an alternative music source alongside the existing YouTube player, using Tidal's iframe embed player.

**Architecture:** A music source selector in settings lets users choose between YouTube and Tidal. The Tidal player uses an iframe embed at `embed.tidal.com`. Only one player is active at a time. Tidal includes preset focus playlists and a custom URL option.

**Tech Stack:** Vanilla JS (frontend), Rust/Tauri (backend settings), HTML/CSS, Tidal Embed Player (iframe)

---

### Task 1: Add music_source and tidal_url to Rust settings

**Files:**
- Modify: `src-tauri/src/settings.rs:1-59`

**Step 1: Add the new fields to AppSettings**

Add two new fields to the `AppSettings` struct after `custom_youtube_id` (line 16-17):

```rust
#[serde(default = "default_youtube")]
pub music_source: String,
#[serde(default)]
pub tidal_url: String,
```

Add the default function:

```rust
fn default_youtube() -> String {
    "youtube".to_string()
}
```

Update the `Default` impl to include:

```rust
music_source: "youtube".to_string(),
tidal_url: String::new(),
```

**Step 2: Build to verify compilation**

Run: `cd src-tauri && cargo check`
Expected: Compiles successfully with no errors.

**Step 3: Commit**

```bash
git add src-tauri/src/settings.rs
git commit -m "feat: add music_source and tidal_url settings fields"
```

---

### Task 2: Add music source dropdown and Tidal settings to HTML

**Files:**
- Modify: `index.html:101-104` (after progress ring toggle, before YouTube URL field)
- Modify: `index.html:128-130` (add Tidal player container)

**Step 1: Replace the YouTube URL setting-group with a music source section**

Replace the current YouTube URL setting-group (lines 101-104) with:

```html
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
        <option value="custom">Custom URL...</option>
    </select>
    <input type="text" id="tidal-url" class="hidden" placeholder="Paste Tidal URL (playlist, album, or track)" />
</div>
```

After the `youtube-player-container` div (line 128-130), add the Tidal player container:

```html
<div id="tidal-player-container" class="hidden">
    <iframe id="tidal-player" src="" width="300" height="80"
        allow="encrypted-media" frameborder="0"
        style="border-radius: 8px;"></iframe>
</div>
```

**Step 2: Verify the HTML is valid**

Run: `npm run dev` (Vite dev server)
Expected: Page loads without HTML parsing errors. New elements are visible in settings panel.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add music source dropdown and Tidal player to HTML"
```

---

### Task 3: Style the new settings elements

**Files:**
- Modify: `src/styles.css`

**Step 1: Add styles for the select dropdown and Tidal container**

After the existing `.setting-group input[type="text"]` rule (around line 349), add:

```css
.setting-group select {
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
}

.setting-group select option {
    background: #1a1a2e;
    color: #fff;
}
```

After the `#youtube-player-container iframe` rule (around line 433), add:

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
```

**Step 2: Verify styles render correctly**

Run: `npm run dev`
Expected: Dropdown looks consistent with other settings. Tidal container positioned same as YouTube container.

**Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat: style music source dropdown and Tidal player container"
```

---

### Task 4: Add Tidal URL extraction and player logic to JavaScript

**Files:**
- Modify: `src/main.js`

**Step 1: Add DOM element references**

After `const youtubeUrlInput` (line 63), add:

```javascript
const musicSourceSelect = document.getElementById("music-source");
const youtubeSettings = document.getElementById("youtube-settings");
const tidalSettings = document.getElementById("tidal-settings");
const tidalPresetSelect = document.getElementById("tidal-preset");
const tidalUrlInput = document.getElementById("tidal-url");
const tidalPlayerContainer = document.getElementById("tidal-player-container");
const tidalPlayer = document.getElementById("tidal-player");
```

**Step 2: Add music source state variable**

After `let customYouTubeId = "";` (line 185), add:

```javascript
let musicSource = "youtube";
```

**Step 3: Add Tidal URL extraction function**

After the `extractYouTubeId` function (after line 204), add:

```javascript
function extractTidalInfo(input) {
  if (!input) return null;
  const trimmed = input.trim();
  // Match: tidal.com/browse/{type}/{id} or listen.tidal.com/{type}/{id}
  const pattern = /(?:tidal\.com\/browse|listen\.tidal\.com)\/(track|album|playlist|video)s?\/([a-zA-Z0-9-]+)/;
  const m = trimmed.match(pattern);
  if (m) {
    // Normalize type to plural form for embed URL
    const typeMap = { track: "tracks", album: "albums", playlist: "playlists", video: "videos" };
    return { type: typeMap[m[1]] || m[1] + "s", id: m[2] };
  }
  return null;
}
```

**Step 4: Add function to get current Tidal embed URL**

After `extractTidalInfo`, add:

```javascript
function getTidalEmbedUrl() {
  const presetValue = tidalPresetSelect.value;
  if (presetValue !== "custom") {
    return `https://embed.tidal.com/playlists/${presetValue}`;
  }
  const info = extractTidalInfo(tidalUrlInput.value);
  if (info) {
    return `https://embed.tidal.com/${info.type}/${info.id}`;
  }
  return "";
}
```

**Step 5: Add preset select change handler**

After the `getTidalEmbedUrl` function, add:

```javascript
tidalPresetSelect.addEventListener("change", () => {
  tidalUrlInput.classList.toggle("hidden", tidalPresetSelect.value !== "custom");
});
```

**Step 6: Update the music toggle button handler**

Replace the existing `musicToggle.addEventListener("click", ...)` block (lines 232-251) with:

```javascript
musicToggle.addEventListener("click", () => {
  if (musicSource === "youtube") {
    if (!youtubePlayer) {
      loadYouTubeAPI();
      playerContainer.classList.remove("hidden");
      musicToggle.classList.add("active");
      musicPlaying = true;
      return;
    }
    if (musicPlaying) {
      youtubePlayer.pauseVideo();
      playerContainer.classList.add("hidden");
      musicToggle.classList.remove("active");
    } else {
      youtubePlayer.playVideo();
      playerContainer.classList.remove("hidden");
      musicToggle.classList.add("active");
    }
    musicPlaying = !musicPlaying;
  } else if (musicSource === "tidal") {
    if (musicPlaying) {
      tidalPlayerContainer.classList.add("hidden");
      tidalPlayer.src = ""; // Stop playback
      musicToggle.classList.remove("active");
    } else {
      const embedUrl = getTidalEmbedUrl();
      if (embedUrl) {
        tidalPlayer.src = embedUrl;
        tidalPlayerContainer.classList.remove("hidden");
        musicToggle.classList.add("active");
      }
    }
    musicPlaying = !musicPlaying;
  }
});
```

**Step 7: Update settings panel open handler**

In the `settingsBtn.addEventListener("click", ...)` block (around line 411), after `youtubeUrlInput.value = settings.custom_youtube_id;`, add:

```javascript
  musicSourceSelect.value = settings.music_source || "youtube";
  // Show/hide source-specific settings
  youtubeSettings.classList.toggle("hidden", musicSourceSelect.value !== "youtube");
  tidalSettings.classList.toggle("hidden", musicSourceSelect.value !== "tidal");
  // Tidal settings
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

Also add a change handler for the music source dropdown (add after settings panel open handler):

```javascript
musicSourceSelect.addEventListener("change", () => {
  youtubeSettings.classList.toggle("hidden", musicSourceSelect.value !== "youtube");
  tidalSettings.classList.toggle("hidden", musicSourceSelect.value !== "tidal");
});
```

**Step 8: Update save settings handler**

In the `saveSettingsBtn.addEventListener("click", ...)` block (around line 428), update the settings object to include:

```javascript
    music_source: musicSourceSelect.value,
    tidal_url: tidalPresetSelect.value === "custom" ? tidalUrlInput.value : tidalPresetSelect.value,
```

After the YouTube ID update logic, add the music source switch:

```javascript
  // Switch music source if changed
  const newMusicSource = musicSourceSelect.value;
  if (newMusicSource !== musicSource) {
    // Stop current player
    if (musicPlaying) {
      if (musicSource === "youtube" && youtubePlayer) {
        youtubePlayer.pauseVideo();
        playerContainer.classList.add("hidden");
      } else if (musicSource === "tidal") {
        tidalPlayer.src = "";
        tidalPlayerContainer.classList.add("hidden");
      }
      musicPlaying = false;
      musicToggle.classList.remove("active");
    }
    musicSource = newMusicSource;
  }
```

**Step 9: Update init function**

In the `init()` function (around line 531), after `customYouTubeId = settings.custom_youtube_id || "";`, add:

```javascript
  musicSource = settings.music_source || "youtube";
```

**Step 10: Commit**

```bash
git add src/main.js
git commit -m "feat: add Tidal player logic, URL extraction, and music source switching"
```

---

### Task 5: Manual integration test

**Step 1: Run the app**

Run: `npm run tauri dev`

**Step 2: Test YouTube (default) still works**

1. Click Music toggle - YouTube player should appear and play
2. Click again to pause/hide
3. Open Settings - Music Source should show "YouTube"

**Step 3: Test switching to Tidal**

1. Open Settings
2. Change Music Source to "Tidal"
3. Verify YouTube URL field hides, Tidal Playlist dropdown appears
4. Save settings
5. Click Music toggle - Tidal embed should load with LoFi Study Session Beats
6. Click again to stop/hide

**Step 4: Test Tidal custom URL**

1. Open Settings
2. Select "Custom URL..." from the Tidal Playlist dropdown
3. Paste a Tidal playlist URL (e.g., `https://tidal.com/browse/playlist/c59242b9-fc33-4f93-954c-d5d164949ba1`)
4. Save, toggle music, verify it loads

**Step 5: Test switching back to YouTube**

1. Open Settings, switch Music Source back to YouTube
2. Save, verify YouTube player works as before

**Step 6: Test settings persistence**

1. Set Music Source to Tidal with a custom URL
2. Close and reopen the app
3. Verify settings are preserved

**Step 7: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: integration test fixes for Tidal player"
```

---

### Task 6: Final commit and version bump

**Step 1: Bump version**

Update version in `src-tauri/tauri.conf.json` and `package.json` to `0.5.0` (new feature = minor version bump).

**Step 2: Commit**

```bash
git add src-tauri/tauri.conf.json package.json
git commit -m "chore: bump version to v0.5.0"
```
