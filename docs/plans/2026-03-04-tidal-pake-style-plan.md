# Pake-Style Tidal Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Tidal music support via a Pake-style WebviewWindow with popup handling, so users can log in and play full tracks from within PulsoDoro.

**Architecture:** Rust commands create/manage a WebviewWindow pointing at listen.tidal.com. The `on_new_window(Allow)` API enables Tidal's login popup. JS toggles visibility via invoke. WebView2 cookies persist login between sessions.

**Tech Stack:** Rust/Tauri 2.10.2 (WebviewWindow, on_new_window), HTML/CSS/JS frontend

---

### Task 1: Add Rust commands for Tidal WebviewWindow

**Files:**
- Modify: `src-tauri/src/lib.rs:1-255`

**Step 1: Add imports at the top of lib.rs**

After the existing `use tauri::{...}` block (line 9-13), add to the import:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::{NewWindowResponse, WebviewUrl},
    AppHandle, Emitter, Manager, State, WebviewWindowBuilder,
};
```

(Replace the existing `use tauri::{...}` block — adding `webview::{NewWindowResponse, WebviewUrl}`, `WebviewWindowBuilder`)

**Step 2: Add `toggle_tidal` command**

After the `get_stats` command (line 112), add:

```rust
#[tauri::command]
async fn toggle_tidal(app: AppHandle, url: String) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("tidal") {
        if window.is_visible().unwrap_or(false) {
            window.hide().map_err(|e| e.to_string())?;
            Ok(false)
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            Ok(true)
        }
    } else {
        let parsed_url: url::Url = url.parse().map_err(|e: url::ParseError| e.to_string())?;
        let window = WebviewWindowBuilder::new(
            &app,
            "tidal",
            WebviewUrl::External(parsed_url),
        )
        .title("Tidal - PulsoDoro")
        .inner_size(1024.0, 700.0)
        .on_new_window(|_url, _features| NewWindowResponse::Allow)
        .build()
        .map_err(|e| e.to_string())?;

        let app_handle = app.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Destroyed = event {
                let _ = app_handle.emit("tidal-closed", ());
            }
        });

        Ok(true)
    }
}

#[tauri::command]
async fn close_tidal(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("tidal") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

**Step 3: Register commands in invoke_handler**

In `lib.rs`, update the `invoke_handler` (line 242) to include the new commands:

```rust
        .invoke_handler(tauri::generate_handler![
            start_timer,
            pause_timer,
            reset_timer,
            skip_timer,
            get_timer_status,
            get_settings,
            save_settings,
            load_image,
            get_stats,
            toggle_tidal,
            close_tidal
        ])
```

**Step 4: Add `url` crate dependency**

In `src-tauri/Cargo.toml`, add under `[dependencies]`:

```toml
url = "2"
```

**Step 5: Verify compilation**

Run: `/c/Users/Eliphas/.cargo/bin/cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Compiles successfully.

**Step 6: Run tests**

Run: `/c/Users/Eliphas/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All 30 tests pass.

**Step 7: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "feat: add Rust commands for Tidal WebviewWindow with popup handling"
```

---

### Task 2: Re-add music source UI in HTML

**Files:**
- Modify: `index.html:86-97`

**Step 1: Replace Music tab content**

In `index.html`, replace lines 86-97 (the entire `tab-music` div):

```html
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
                    <label>Starting URL <span class="hint">(optional, defaults to listen.tidal.com)</span></label>
                    <input type="text" id="tidal-url" placeholder="Paste a Tidal playlist or album URL" />
                    <p class="hint" style="margin-top: 0.5rem;">Opens in a browser window. Log in once — your session is remembered.</p>
                </div>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="sound-toggle" checked />
                        Sound alert on transition
                    </label>
                </div>
            </div>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: re-add YouTube/Tidal source selector in Music settings tab"
```

---

### Task 3: Update JavaScript for Tidal toggle and settings

**Files:**
- Modify: `src/main.js`

**Step 1: Add Tidal DOM refs and state**

After line 63 (`const youtubeUrlInput = ...`), add:

```javascript
const musicSourceSelect = document.getElementById("music-source");
const youtubeSettings = document.getElementById("youtube-settings");
const tidalSettings = document.getElementById("tidal-settings");
const tidalUrlInput = document.getElementById("tidal-url");
```

After line 78 (`let alwaysOnTop = false;`), add:

```javascript
let musicSource = "youtube";
```

**Step 2: Add music source toggle in settings**

After the tab switching code (after line 489 `});`), add:

```javascript
// --- Music Source Toggle ---
musicSourceSelect.addEventListener("change", () => {
  youtubeSettings.classList.toggle("hidden", musicSourceSelect.value !== "youtube");
  tidalSettings.classList.toggle("hidden", musicSourceSelect.value !== "tidal");
});
```

**Step 3: Replace the music toggle handler**

Replace lines 234-252 (the entire `musicToggle.addEventListener("click", ...)`) with:

```javascript
musicToggle.addEventListener("click", async () => {
  if (musicSource === "tidal") {
    const visible = await invoke("toggle_tidal", {
      url: tidalUrlInput.value.trim() || "https://listen.tidal.com",
    });
    musicToggle.classList.add("active");
    musicPlaying = true;
    return;
  }
  // YouTube
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
});
```

**Step 4: Add tidal-closed event listener**

After the `listen("timer-notification", ...)` block (after line 502), add:

```javascript
listen("tidal-closed", () => {
  musicToggle.classList.remove("active");
  musicPlaying = false;
});
```

**Step 5: Update settings open handler to restore music source**

In the settings open handler (line 412-431), after `youtubeUrlInput.value = settings.custom_youtube_id;` (line 419), add:

```javascript
  musicSource = settings.music_source || "youtube";
  musicSourceSelect.value = musicSource;
  youtubeSettings.classList.toggle("hidden", musicSource !== "youtube");
  tidalSettings.classList.toggle("hidden", musicSource !== "tidal");
  tidalUrlInput.value = settings.tidal_url || "";
```

**Step 6: Update save handler to persist music source**

Replace lines 442-443:

```javascript
    music_source: "youtube",
    tidal_url: "",
```

With:

```javascript
    music_source: musicSourceSelect.value,
    tidal_url: tidalUrlInput.value.trim(),
```

After the YouTube update logic (after line 467 `}`), add source-switch cleanup:

```javascript
  // Close other player when source changes
  const newSource = musicSourceSelect.value;
  if (newSource !== musicSource) {
    if (musicSource === "tidal") {
      await invoke("close_tidal");
    } else if (musicSource === "youtube" && youtubePlayer) {
      youtubePlayer.pauseVideo();
      playerContainer.classList.add("hidden");
    }
    musicToggle.classList.remove("active");
    musicPlaying = false;
    musicSource = newSource;
  }
```

**Step 7: Update init to load music source**

In the init function (line 549-563), after `customYouTubeId = settings.custom_youtube_id || "";` (line 554), add:

```javascript
  musicSource = settings.music_source || "youtube";
```

**Step 8: Commit**

```bash
git add src/main.js
git commit -m "feat: wire Tidal WebviewWindow toggle and settings in JavaScript"
```

---

### Task 4: Verify and test

**Step 1: Run Rust tests**

Run: `/c/Users/Eliphas/.cargo/bin/cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All 30 tests pass.

**Step 2: Verify Rust compilation**

Run: `/c/Users/Eliphas/.cargo/bin/cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Compiles successfully.

**Step 3: Prompt user for manual testing with `dev.bat`**

Test plan:
1. Settings > Music > verify YouTube/Tidal dropdown appears
2. Select Tidal > verify Tidal settings shown, YouTube settings hidden
3. Save > Click Music > verify Tidal window opens (listen.tidal.com)
4. In Tidal window, click Login > verify popup opens (not blocked!)
5. Click Music again > verify Tidal window hides (audio continues if playing)
6. Click Music again > verify Tidal window reappears
7. Close Tidal window via X > verify Music button deactivates
8. Switch back to YouTube in settings > verify YouTube works as before
