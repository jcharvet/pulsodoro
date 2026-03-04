# Tidal Music Integration Design

## Goal

Add Tidal as an alternative music source alongside the existing YouTube player, using Tidal's embed player (iframe). Users choose their music source in settings and control playback via the existing music toggle button.

## Architecture

### Music Source Selector

A new "Music Source" dropdown in the settings panel:
- **YouTube** (default, preserves backward compatibility)
- **Tidal**

Selecting a source conditionally shows the relevant settings (YouTube URL field or Tidal preset/URL field). Only one player is active at a time.

### Tidal Embed Player

Iframe-based embed at `https://embed.tidal.com/{type}/{id}` where type is `tracks`, `albums`, or `playlists`.

- No API keys or OAuth required from PulsoDoro
- Tidal handles authentication within the embed (subscribers log in for full playback, non-subscribers get 30-second previews)
- Supports tracks, albums, and playlists

### Tidal URL Parsing

A `extractTidalInfo(input)` function that parses Tidal URLs and returns `{ type, id }`:

| Input format | Example | Result |
|---|---|---|
| Browse URL | `https://tidal.com/browse/playlist/2b2cb045-...` | `{ type: "playlists", id: "2b2cb045-..." }` |
| Browse URL | `https://tidal.com/browse/album/74663378` | `{ type: "albums", id: "74663378" }` |
| Browse URL | `https://tidal.com/browse/track/73731563` | `{ type: "tracks", id: "73731563" }` |
| Listen URL | `https://listen.tidal.com/playlist/2b2cb045-...` | `{ type: "playlists", id: "2b2cb045-..." }` |

### Preset Focus Playlists

A dropdown with curated focus/study playlists plus a "Custom URL" option:

1. **LoFi Study Session** - playlist `c59242b9-fc33-4f93-954c-d5d164949ba1`
2. **My Ultimate Lo-Fi/Chillhop** - playlist `2b2cb045-0b11-4340-b625-b3dcd209193c`
3. **Custom URL** - shows a text input for pasting any Tidal URL

### Settings Changes

**Rust backend** (`AppSettings`):
```rust
#[serde(default = "default_youtube")]
pub music_source: String,       // "youtube" or "tidal"
#[serde(default)]
pub tidal_url: String,          // raw Tidal URL or preset ID
```

**Frontend**: Settings panel conditionally shows YouTube or Tidal configuration based on the music source dropdown.

### Player Container

The existing `youtube-player-container` div is generalized. When music source is "tidal", a Tidal iframe is created instead of the YouTube player. The music toggle button behavior remains the same: show/hide the active player.

### Timer Sync

Not included. The Tidal embed has no documented JavaScript API for programmatic play/pause control. Music is manually controlled by the user via the music toggle button, same as the current YouTube behavior.

## Files Modified

1. `index.html` - Add Tidal player container, update settings panel with music source dropdown and Tidal fields
2. `src/main.js` - Add Tidal URL extraction, player management, music source switching logic, preset playlists
3. `src/styles.css` - Style the Tidal player container, music source dropdown, preset selector
4. `src-tauri/src/settings.rs` - Add `music_source` and `tidal_url` fields to `AppSettings`

## Not In Scope

- Spotify/Deezer integration (future work, same embed pattern)
- Timer auto-sync with music playback
- In-app Tidal search/browse
- Tidal API authentication (OAuth)
