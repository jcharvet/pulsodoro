# Anime Pomodoro v2 — Design Document

## Core Concept

A focus-first Pomodoro timer with anime aesthetics and guided break activities. The anime theme provides motivation and ambiance, not distraction.

## Timer Settings

- **Focus: 25 min** (classic Pomodoro)
- **Short break: 5 min** with guided activities
- **Long break: 15 min** every 4 cycles
- Customizable durations in settings

## Window (800x500)

- Beautiful anime background image behind the timer
- Timer, state label, cycle dots overlaid on top with semi-transparent dark overlay
- Lo-fi YouTube player (small, bottom corner)
- Settings gear icon

## During Focus

- Calm anime background (studying/focused character)
- Desktop wallpaper changes to match
- Lo-fi music plays
- Timer counts down

## During Breaks — Guided Activities

Randomly suggests one activity each break:
- "Stand up and stretch for 2 minutes"
- "Close your eyes and take 10 deep breaths"
- "Look at something 20 feet away for 20 seconds" (20-20-20 rule)
- "Get a glass of water"
- "Do 10 shoulder rolls"

Displayed as a card over the anime break background.

## Settings Panel

- Adjust focus/break/long break durations
- Pick anime background from bundled set or load your own
- Toggle desktop wallpaper changing
- Toggle lo-fi music
- Volume control

## Tech Stack

- Tauri v2 (Rust + vanilla HTML/CSS/JS)
- wallpaper crate for desktop wallpaper
- YouTube iframe embed for lo-fi music
- Vite dev server
