# Anime Pomodoro — Design Document

## Overview

A Tauri desktop app (Rust + vanilla HTML/CSS/JS) that runs a Pomodoro timer from the system tray and changes the Windows desktop wallpaper based on timer state.

## Core Behavior

- **Focus mode (25 min):** Sets a "focus" anime wallpaper
- **Short break (5 min):** Sets a "break" anime wallpaper
- **Long break (15 min):** Every 4th cycle, 15 min long break
- Timer runs in the system tray with a small popup window showing time remaining
- System notifications when transitioning between states

## Components

### 1. Rust Backend
- Pomodoro timer logic (focus/short break/long break cycle)
- System tray icon with context menu (start, pause, reset, quit)
- Windows wallpaper changing via `SystemParametersInfoW` Win32 API
- Tauri commands to communicate timer state to frontend

### 2. HTML/CSS/JS Frontend
- Small timer popup window with anime-styled UI
- Displays current time remaining, current state (focus/break)
- Controls: start, pause, reset
- Visual indicator of which cycle you're on (1-4)

### 3. Wallpaper Assets
- Bundled default anime wallpapers for focus and break states
- Users can swap in their own images later

## Architecture

- System tray app with a small popup window (not a full desktop window)
- Timer state managed in Rust, communicated to frontend via Tauri commands/events
- Wallpaper changes via Windows API on state transitions
- State flow: Focus → Short Break → Focus → Short Break → Focus → Short Break → Focus → Long Break → repeat

## Tech Stack

- **Framework:** Tauri v2
- **Backend:** Rust
- **Frontend:** Vanilla HTML/CSS/JS
- **Platform:** Windows (wallpaper API is Windows-specific)
