# Pake-Style Tidal Integration Design

## Problem

Previous Tidal integration attempts all failed:
1. **iframe with listen.tidal.com** — blocked by device verification/cookie issues in WebView2
2. **Separate WebviewWindow (naive)** — popups blocked by default, login flow broken
3. **Tidal embed player** — login popup blocked, only 30-sec previews without login
4. **Tidal API/SDK** — only 30-sec previews for third parties (licensing restriction)

## Solution

Use a **Pake-style WebviewWindow** — a full browser window pointing at `listen.tidal.com` with popup handling enabled via Tauri 2.10.2's `on_new_window(Allow)` API. This is exactly how [Pake](https://github.com/tw93/Pake) wraps websites into desktop apps.

Key insight: **WebView2 on Windows supports DRM (Widevine via Edge engine), persists cookies between sessions, and can handle popups when properly configured.** The previous WebviewWindow attempt failed because we didn't use `on_new_window` to allow Tidal's login popup.

## Architecture

### User Flow
1. Settings > Music > Select "Tidal" as source
2. Optionally paste a Tidal URL as starting page
3. Click Music button → Tidal opens in a separate window
4. User logs in (remembered via WebView2 cookies) and picks music
5. Click Music again → Tidal window hides, audio continues playing
6. Music button stays active (simple glow indicator)
7. Click Music again → Tidal window reappears
8. Close Tidal window via X → music stops, button deactivates

### Rust Commands
- `toggle_tidal(url: String) -> bool` — Creates window if it doesn't exist, toggles visibility if it does. Returns visibility state.
- `close_tidal()` — Closes and destroys the Tidal window entirely.
- Window emits `tidal-closed` event to main window when destroyed.

### WebviewWindow Configuration
```rust
WebviewWindowBuilder::new(&app, "tidal", WebviewUrl::External(url))
    .title("Tidal - PulsoDoro")
    .inner_size(1024.0, 700.0)
    .on_new_window(|_url, _features| NewWindowResponse::Allow)
    .build()
```

### JS Music Toggle
- Source "youtube": existing YouTube IFrame API logic (unchanged)
- Source "tidal": `invoke("toggle_tidal", { url })` → show/hide window
- Listen for `tidal-closed` event → deactivate button

### Settings
- `music_source` field already exists in Rust struct
- `tidal_url` field already exists — used as starting URL (default: `https://listen.tidal.com`)
- Re-add YouTube/Tidal dropdown in Settings > Music tab

### What We Keep From Previous Work
- CSP already allows `*.tidal.com` (useful for iframe fallback, harmless otherwise)
- `music_source` and `tidal_url` settings fields in Rust
- `tauri-plugin-opener` (useful for other things, harmless)
- Tabbed settings UI (Timer/Music/Appearance)
