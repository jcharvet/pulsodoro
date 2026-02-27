# PulseDoro

A distraction-free Pomodoro timer for Windows, built with Tauri v2.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![Rust](https://img.shields.io/badge/Rust-backend-orange)
![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey)

## Features

- **Pomodoro Timer** - Classic 25/5/15 cycle with 4-session rounds
- **Custom Backgrounds** - Set different background images for focus and break sessions
- **Desktop Wallpaper Switching** - Automatically changes your Windows wallpaper based on timer state
- **Guided Break Activities** - Random suggestions during breaks (stretch, hydrate, breathe, walk)
- **Lo-fi Music** - Built-in YouTube lo-fi streams toggle for ambient focus music
- **System Tray** - Start, pause, reset from the tray without opening the window
- **Configurable Durations** - Adjust focus, short break, and long break lengths
- **Settings Persistence** - All preferences saved locally as JSON

## Screenshots

> Coming soon

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend:** Rust (Tauri v2)
- **Desktop Integration:** Windows wallpaper API via `wallpaper` crate
- **Build Tool:** Vite

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Windows 10/11

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/pulsedoro.git
cd pulsedoro
npm install
```

### Development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

The installer will be generated in `src-tauri/target/release/bundle/`.

## Usage

1. Click **Start** to begin a 25-minute focus session
2. When the timer ends, a break starts automatically with a suggested activity
3. After 4 focus sessions, you get a long break
4. Open **Settings** (gear icon) to customize durations and backgrounds
5. Click the **Lo-fi** button to toggle ambient music
6. The app lives in your system tray for quick access

## Project Structure

```
pulsedoro/
├── index.html              # Main app layout
├── src/
│   ├── main.js             # Frontend logic (timer UI, settings, music)
│   └── styles.css           # Dark theme with state-based accent colors
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── lib.rs           # Tauri setup, commands, tray, timer loop
│   │   ├── timer.rs         # Pomodoro state machine
│   │   ├── settings.rs      # Settings persistence (JSON)
│   │   └── wallpaper_manager.rs  # Windows wallpaper switching
│   ├── capabilities/        # Tauri v2 permissions
│   ├── resources/wallpapers/ # Bundled wallpaper images
│   └── tauri.conf.json      # Tauri configuration
└── package.json
```

## License

MIT
