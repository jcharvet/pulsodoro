# PulsoDoro

## Project
- Tauri v2 desktop Pomodoro timer (vanilla JS + Rust backend)
- GitHub repo — use `gh` for PRs/issues
- Version tracked in 3 files: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`

## Architecture
- **Frontend**: Vanilla JS (`src/main.js`), CSS custom properties (`src/styles.css`), HTML (`index.html`)
- **Backend**: Rust via Tauri v2 commands (`src-tauri/src/lib.rs`)
- **Timer**: State machine in `src-tauri/src/timer.rs` (Idle → Focus → ShortBreak/LongBreak, 4-cycle rounds)
- **Settings**: JSON persistence via `settings.rs` → `~/.config/pulsodoro/settings.json`
- **Stats**: Session tracking via `stats.rs` → `~/.config/pulsodoro/stats.json`
- **Themes**: 5 themes defined in `src/themes.js`, applied via CSS custom properties on `:root`
- **Build**: Vite (frontend) + Tauri CLI (desktop bundle)

## Code Conventions
- Frontend–backend communication via `window.__TAURI__.core.invoke()` and `window.__TAURI__.event.listen()`
- Settings struct uses `#[serde(default)]` for backwards compatibility — new fields must have defaults
- Timer state machine must never panic on I/O — use `.ok()` / `.unwrap_or_default()`
- CSS theming: all colors via `var(--custom-property)`, never hardcoded hex in styles
- No frameworks — keep it vanilla JS/CSS

## Git & Commits
- Never include `Co-Authored-By` in commit messages
- Commit style: `feat:`, `fix:`, `refactor:`, `chore:`, or plain description
- Never commit `.claude/` directory

## Dev & Build
- `npm run tauri:dev` — dev mode (Vite on port 1420 + Tauri debug)
- `npm run tauri:build` — production build (installers in `src-tauri/target/release/bundle/`)
- Rust tests: `cd src-tauri && cargo test`

## Release
- Push `v*` tag to `main` → GitHub Actions builds Windows + Linux installers
- Version must be bumped in all 3 files before tagging
