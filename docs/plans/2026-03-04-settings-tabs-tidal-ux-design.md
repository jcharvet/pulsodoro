# Settings Tabs + Tidal UX Improvements Design

## Goal

Reorganize the settings panel into tabs to reduce vertical length, and improve the Tidal music selection UX with a "Browse on Tidal" button.

## Architecture

### Tabbed Settings Panel

Three tabs: **Timer** | **Music** | **Appearance**

Only one tab's content is visible at a time. Tab state is not persisted (always opens to Timer tab).

**Timer tab:**
- Focus duration (minutes)
- Short break duration (minutes)
- Long break duration (minutes)

**Music tab:**
- Music Source dropdown (YouTube / Tidal)
- YouTube settings: URL/ID field (shown when YouTube selected)
- Tidal settings: Preset dropdown, custom URL input field (always visible, overrides preset when filled), "Browse on Tidal" button
- Sound alert on transition toggle

**Appearance tab:**
- Change desktop wallpaper toggle
- Focus background picker
- Break background picker
- Show progress ring toggle
- Always on top toggle

### "Browse on Tidal" Button

Opens `https://listen.tidal.com` in the user's default browser using Tauri's shell plugin (`opener`). User browses Tidal, copies a share link, pastes it back in PulsoDoro's custom URL field.

### Improved Custom URL Flow

The Tidal custom URL field is always visible below the preset dropdown instead of hidden behind "Custom URL..." option. When the URL field has content, it takes priority over the preset. When empty, the selected preset is used. The "Custom URL..." option is removed from the dropdown.

## Files Modified

1. `index.html` - Restructure settings panel into tabs with tab navigation
2. `src/styles.css` - Tab styles, active tab indicator, tab content panels
3. `src/main.js` - Tab switching logic, "Browse on Tidal" handler, updated Tidal URL priority logic
4. `src-tauri/Cargo.toml` - Add `tauri-plugin-opener` dependency (for opening URLs)
5. `src-tauri/src/lib.rs` - Register opener plugin
6. `src-tauri/capabilities/default.json` - Add opener permission

## Not In Scope

- Persisting which tab was last open
- Tidal API authentication or in-app search
- Drag-and-drop URL from browser
