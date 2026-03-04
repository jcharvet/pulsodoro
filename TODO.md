# PulsoDoro v0.5.0 - TODO

## FLOW 

### Before starting task
- always branch from master

### After tasks
- run test is test passed notiy the user

### After test if user happy
- bump versions
- create msi and exe files

### commit and merge and push
- then commit merge and push
- give release version notes for windows release
- give path to use to make his life easier

## Features (ordered by complexity)

### 1. Custom App Icon (Trivial) - DONE
- [x] Design/obtain a 1024x1024 PNG icon
- [x] Run `npx tauri icon path/to/icon.png` to generate all sizes
- [x] Replace all files in `src-tauri/icons/`

### 2. Keyboard Shortcuts (Simple) - DONE
- [x] Add `keydown` listener in `src/main.js`: Space = toggle start/pause, R = reset, S = skip
- [x] Guard: skip when settings panel is open or typing in inputs
- [x] Inline `<kbd>` hints on buttons

### 3. Sound Alert (Simple) - DONE
- [x] Add `sound_enabled: bool` to `AppSettings` in `src-tauri/src/settings.rs`
- [x] Web Audio API chime (no external file needed)
- [x] Play audio in `timer-notification` listener when enabled
- [x] Add checkbox toggle in settings panel (`index.html`)

### 4. Skip Button (Simple-Medium) - DONE
- [x] Add `skip()` method to `PomodoroTimer` in `src-tauri/src/timer.rs`
- [x] Add `skip_timer` command in `src-tauri/src/lib.rs`
- [x] Add Skip button in `index.html` controls
- [x] Wire click handler + S keyboard shortcut in `src/main.js`

### 5. Custom YouTube URL (Medium) - DONE
- [x] Add `custom_youtube_id: String` to `AppSettings` in `src-tauri/src/settings.rs`
- [x] Add text input in settings panel (`index.html` + `src/styles.css`)
- [x] Add `extractYouTubeId()` helper to parse URLs/IDs in `src/main.js`
- [x] Use custom ID or fall back to random default in YouTube player
- [x] Reload player when URL changes on save (cue only if music not playing)

### 6. Always on Top (Medium) - DONE
- [x] Add `always_on_top: bool` to settings in `src-tauri/src/settings.rs`
- [x] Add `core:window:allow-set-always-on-top` permission in `capabilities/default.json`
- [x] Add pin button in bottom bar + checkbox in settings (`index.html`)
- [x] Use `getCurrentWindow().setAlwaysOnTop(bool)` in `src/main.js`
- [x] Apply on init from saved settings

### 7. Session Stats (Medium-High) - DONE
- [x] Create `src-tauri/src/stats.rs` module (HashMap of date -> count, persisted to `stats.json`)
- [x] Add `chrono = "0.4"` to `src-tauri/Cargo.toml`
- [x] Record focus completion in timer loop in `src-tauri/src/lib.rs`
- [x] Add `get_stats` command returning today/week counts
- [x] Display stats in bottom bar (`index.html` + `src/styles.css` + `src/main.js`)

### 8. Progress Ring (Medium-High) - DONE
- [x] Add `total_secs` field to `TimerStatus` in `src-tauri/src/timer.rs`
- [x] Add SVG circle ring wrapping `#timer-display` in `index.html`
- [x] Update `stroke-dashoffset` based on remaining/total ratio in `src/main.js`
- [x] Color ring per state via CSS: red (focus), green (short break), purple (long break)
- [x] Add progress ring toggle in settings
- [x] Chronograph design with tick marks, glow, and endpoint pulse

### 9. Mini Mode (High)
- [ ] Add window permissions (`set-size`, `set-decorations`) in `capabilities/default.json`
- [ ] Add toggle button in bottom bar (`index.html`)
- [ ] Resize window to ~260x100, remove decorations, force always-on-top (`src/main.js`)
- [ ] CSS hides everything except state label + timer + progress ring scaled down (`src/styles.css`)
- [ ] Add exit button + Escape key to restore full size
- [ ] Add drag region for borderless window

### 10. Themes (Medium-High) — NEEDS BRAINSTORM
- [ ] Predefined color themes the user can choose from in settings
- [ ] Default theme = current dark theme
- [ ] Theme controls: accent colors, background gradients, text colors, ring colors
- [ ] Persisted in settings

### 11. Multi-Platform Music Streaming (High) — PARTIAL
- [x] Tidal — Pake-style WebviewWindow with on_new_window(Allow) for login popup
- [x] User picks YouTube or Tidal in Settings > Music
- [x] Tidal login persists via WebView2 cookies
- [x] Toggle show/hide Tidal window, audio continues in background
- [ ] Spotify — investigate Web Playback SDK or similar approach
- [ ] Deezer — investigate embed player options

## Cross-Feature Dependencies
- **6 before 9**: Mini Mode integrates with Always on Top setting
- **8 before 9**: Mini Mode scales down the Progress Ring
- **2 before 9**: Keyboard shortcuts are primary control in Mini Mode
- **10 before 11**: Themes should be in place before multi-platform music (UI consistency)
