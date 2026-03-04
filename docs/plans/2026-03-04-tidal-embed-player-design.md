# Tidal Embed Player Integration Design

## Problem

Previous Tidal integration attempts all failed:
1. **iframe with listen.tidal.com** — blocked by device verification, auth popups, cookie issues in Tauri WebView
2. **Separate Tauri WebviewWindow** — same WebView2 limitations (popups blocked, DRM issues, cookie handling)
3. **Tidal SDK/API full playback** — not available to third parties (only 30-sec previews, licensing restriction)

## Solution

Use Tidal's **embed player** (`embed.tidal.com`) in an iframe. This is the officially supported way to embed Tidal content. Key insight: **Tidal subscribers can log in directly inside the embed player to unlock full-length playback.** The embed handles its own auth — no OAuth integration needed on our side.

This mirrors exactly how YouTube works in PulsoDoro today: user provides a content URL, clicks Music, player appears.

## Architecture

### User Flow
1. Settings > Music tab > Select "Tidal" as source
2. Pick a preset lo-fi playlist or paste a Tidal URL (playlist/album/track)
3. Save settings
4. Click Music button in bottom bar
5. Tidal embed appears above the bottom bar (bottom-left, like YouTube)
6. First time: user clicks "Sign in" inside the embed → logs into Tidal → full playback unlocked
7. Subsequent uses: embed remembers login via WebView cookies

### Components Changed

**HTML (`index.html`)**
- Add `#tidal-player-container` div with an iframe
- iframe must have `allow="encrypted-media *;"` for DRM
- Restore Tidal settings UI: preset dropdown + custom URL field

**CSS (`src/styles.css`)**
- Style `#tidal-player-container` similar to `#youtube-player-container` but larger (350x300 for gridify layout)

**JS (`src/main.js`)**
- Remove WebviewWindow code (broken approach)
- Add `extractTidalInfo()` to parse Tidal URLs into type/id
- Add `getTidalEmbedUrl()` to build embed URL
- Music toggle: show/hide tidal container, set iframe src
- Settings: save/restore tidal_url and preset selection

**Rust (`src-tauri/src/settings.rs`)**
- `tidal_url` field already exists — reuse it

**CSP (`src-tauri/tauri.conf.json`)**
- Already has `embed.tidal.com` and `*.tidal.com` in frame-src — keep it

**Capabilities (`src-tauri/capabilities/default.json`)**
- Remove `core:webview:allow-create-webview-window` (no longer needed)

### Embed URL Format
- Playlists: `https://embed.tidal.com/playlists/{uuid}?layout=gridify`
- Albums: `https://embed.tidal.com/albums/{id}?layout=gridify`
- Tracks: `https://embed.tidal.com/tracks/{id}`
- Artists: not supported by embed — fall back to showing a message

### Preset Playlists
- "LoFi Study Session Beats" — `c59242b9-fc33-4f93-954c-d5d164949ba1`
- "Ultimate Lo-Fi / Chillhop" — `2b2cb045-0b11-4340-b625-b3dcd209193c`

### What Gets Cleaned Up
- Remove `tidalWindow` / `WebviewWindow` code from JS
- Remove `core:webview:allow-create-webview-window` from capabilities
- Can keep `tauri-plugin-opener` (may be useful later, harmless)
