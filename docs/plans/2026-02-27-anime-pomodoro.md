# Anime Pomodoro Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Tauri v2 desktop app that runs a Pomodoro timer from the system tray and changes the Windows desktop wallpaper based on timer state (focus vs break).

**Architecture:** Tauri v2 app with Rust backend handling timer logic, system tray, and Windows wallpaper API. Vanilla HTML/CSS/JS frontend shows a small timer popup. Timer state is managed in Rust and pushed to the frontend via Tauri events. Wallpaper changes happen on state transitions via the `wallpaper` crate.

**Tech Stack:** Tauri v2, Rust, Vanilla HTML/CSS/JS, `wallpaper` crate, `tauri-plugin-notification`

---

## Task 1: Initialize Tauri Project

**Files:**
- Create: entire project scaffold via `npm create tauri-app@latest`

**Step 1: Create the Tauri project**

```bash
cd E:/Projects/anime-pomodoro
npm create tauri-app@latest . -- --manager npm --template vanilla
```

If the interactive prompt runs, select:
- Project name: `anime-pomodoro`
- Frontend: JavaScript
- Package manager: npm
- Template: Vanilla

**Step 2: Install dependencies**

```bash
cd E:/Projects/anime-pomodoro
npm install
```

**Step 3: Verify project builds**

```bash
npm run tauri dev
```

Expected: A Tauri window opens with the default template. Close it.

**Step 4: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: initialize Tauri v2 project with vanilla JS template"
```

---

## Task 2: Add Rust Dependencies

**Files:**
- Modify: `src-tauri/Cargo.toml`

**Step 1: Add dependencies to Cargo.toml**

Add these dependencies to `src-tauri/Cargo.toml` under `[dependencies]`:

```toml
wallpaper = "4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri-plugin-notification = "2"
```

Also ensure `tauri` has the `tray-icon` feature:

```toml
tauri = { version = "2", features = ["tray-icon"] }
```

**Step 2: Add notification plugin to frontend**

```bash
npm install @tauri-apps/plugin-notification
```

**Step 3: Verify it compiles**

```bash
cd src-tauri && cargo check
```

Expected: Compiles with no errors.

**Step 4: Commit**

```bash
git add src-tauri/Cargo.toml Cargo.lock package.json package-lock.json
git commit -m "chore: add wallpaper, notification, and serde dependencies"
```

---

## Task 3: Implement Pomodoro Timer State Machine in Rust

**Files:**
- Create: `src-tauri/src/timer.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Create timer.rs with the state machine**

Create `src-tauri/src/timer.rs`:

```rust
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TimerState {
    Idle,
    Focus,
    ShortBreak,
    LongBreak,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerStatus {
    pub state: TimerState,
    pub remaining_secs: u32,
    pub cycle: u32, // 1-4, long break after cycle 4
    pub is_running: bool,
}

pub struct PomodoroTimer {
    pub status: Mutex<TimerStatus>,
}

const FOCUS_DURATION: u32 = 25 * 60;
const SHORT_BREAK_DURATION: u32 = 5 * 60;
const LONG_BREAK_DURATION: u32 = 15 * 60;

impl PomodoroTimer {
    pub fn new() -> Self {
        Self {
            status: Mutex::new(TimerStatus {
                state: TimerState::Idle,
                remaining_secs: FOCUS_DURATION,
                cycle: 1,
                is_running: false,
            }),
        }
    }

    pub fn start(&self) {
        let mut status = self.status.lock().unwrap();
        if status.state == TimerState::Idle {
            status.state = TimerState::Focus;
            status.remaining_secs = FOCUS_DURATION;
        }
        status.is_running = true;
    }

    pub fn pause(&self) {
        let mut status = self.status.lock().unwrap();
        status.is_running = false;
    }

    pub fn reset(&self) {
        let mut status = self.status.lock().unwrap();
        *status = TimerStatus {
            state: TimerState::Idle,
            remaining_secs: FOCUS_DURATION,
            cycle: 1,
            is_running: false,
        };
    }

    /// Tick one second. Returns Some(new_state) if a state transition occurred.
    pub fn tick(&self) -> Option<TimerState> {
        let mut status = self.status.lock().unwrap();
        if !status.is_running {
            return None;
        }

        if status.remaining_secs > 0 {
            status.remaining_secs -= 1;
            return None;
        }

        // Time's up — transition to next state
        let new_state = match status.state {
            TimerState::Focus => {
                if status.cycle >= 4 {
                    TimerState::LongBreak
                } else {
                    TimerState::ShortBreak
                }
            }
            TimerState::ShortBreak => {
                status.cycle += 1;
                TimerState::Focus
            }
            TimerState::LongBreak => {
                status.cycle = 1;
                TimerState::Focus
            }
            TimerState::Idle => return None,
        };

        status.state = new_state;
        status.remaining_secs = match new_state {
            TimerState::Focus => FOCUS_DURATION,
            TimerState::ShortBreak => SHORT_BREAK_DURATION,
            TimerState::LongBreak => LONG_BREAK_DURATION,
            TimerState::Idle => 0,
        };

        Some(new_state)
    }

    pub fn get_status(&self) -> TimerStatus {
        self.status.lock().unwrap().clone()
    }
}
```

**Step 2: Register module in lib.rs**

Add to top of `src-tauri/src/lib.rs`:

```rust
mod timer;
```

**Step 3: Verify it compiles**

```bash
cd src-tauri && cargo check
```

Expected: Compiles with no errors.

**Step 4: Commit**

```bash
git add src-tauri/src/timer.rs src-tauri/src/lib.rs
git commit -m "feat: implement Pomodoro timer state machine"
```

---

## Task 4: Implement Wallpaper Changer

**Files:**
- Create: `src-tauri/src/wallpaper_manager.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add default wallpaper images**

Create directory `src-tauri/resources/wallpapers/` and place two anime wallpaper images:
- `focus.jpg` — a calm/focused anime scene
- `break.jpg` — a relaxing anime scene

For now, use any two placeholder images. The user can replace them later.

**Step 2: Create wallpaper_manager.rs**

Create `src-tauri/src/wallpaper_manager.rs`:

```rust
use crate::timer::TimerState;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub struct WallpaperManager {
    original_wallpaper: Option<String>,
}

impl WallpaperManager {
    pub fn new() -> Self {
        // Save the current wallpaper so we can restore it later
        let original = wallpaper::get().ok();
        Self {
            original_wallpaper: original,
        }
    }

    pub fn set_wallpaper_for_state(&self, app: &AppHandle, state: TimerState) {
        let filename = match state {
            TimerState::Focus => "focus.jpg",
            TimerState::ShortBreak | TimerState::LongBreak => "break.jpg",
            TimerState::Idle => {
                self.restore_wallpaper();
                return;
            }
        };

        if let Some(resource_path) = app
            .path()
            .resolve(format!("resources/wallpapers/{}", filename), tauri::path::BaseDirectory::Resource)
            .ok()
        {
            let _ = wallpaper::set_from_path(resource_path.to_str().unwrap_or_default());
        }
    }

    pub fn restore_wallpaper(&self) {
        if let Some(ref path) = self.original_wallpaper {
            let _ = wallpaper::set_from_path(path);
        }
    }
}
```

**Step 3: Register module in lib.rs**

Add to `src-tauri/src/lib.rs`:

```rust
mod wallpaper_manager;
```

**Step 4: Configure resource bundling in tauri.conf.json**

Add to `tauri.conf.json` inside the `"bundle"` object:

```json
"resources": ["resources/wallpapers/*"]
```

**Step 5: Verify it compiles**

```bash
cd src-tauri && cargo check
```

**Step 6: Commit**

```bash
git add src-tauri/src/wallpaper_manager.rs src-tauri/src/lib.rs src-tauri/tauri.conf.json src-tauri/resources/
git commit -m "feat: add wallpaper manager with state-based wallpaper switching"
```

---

## Task 5: Wire Up Tauri Commands, System Tray, and Timer Loop

**Files:**
- Modify: `src-tauri/src/lib.rs`

This is the main integration task — connect timer, wallpaper, tray, and frontend.

**Step 1: Rewrite lib.rs with full app setup**

Replace `src-tauri/src/lib.rs` with:

```rust
mod timer;
mod wallpaper_manager;

use std::sync::Mutex;
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use timer::{PomodoroTimer, TimerStatus};
use wallpaper_manager::WallpaperManager;

struct AppState {
    timer: PomodoroTimer,
    wallpaper: Mutex<WallpaperManager>,
}

#[tauri::command]
fn start_timer(state: State<AppState>) -> TimerStatus {
    state.timer.start();
    state.timer.get_status()
}

#[tauri::command]
fn pause_timer(state: State<AppState>) -> TimerStatus {
    state.timer.pause();
    state.timer.get_status()
}

#[tauri::command]
fn reset_timer(state: State<AppState>, app: AppHandle) -> TimerStatus {
    state.timer.reset();
    state.wallpaper.lock().unwrap().restore_wallpaper();
    state.timer.get_status()
}

#[tauri::command]
fn get_timer_status(state: State<AppState>) -> TimerStatus {
    state.timer.get_status()
}

fn start_timer_loop(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));

        let state = app.state::<AppState>();
        let transition = state.timer.tick();
        let status = state.timer.get_status();

        // Emit status to frontend every second
        let _ = app.emit("timer-update", &status);

        // If state transitioned, change wallpaper and notify
        if let Some(new_state) = transition {
            state
                .wallpaper
                .lock()
                .unwrap()
                .set_wallpaper_for_state(&app, new_state);

            let message = match new_state {
                timer::TimerState::Focus => "Focus time! Let's get to work.",
                timer::TimerState::ShortBreak => "Short break! Take a breather.",
                timer::TimerState::LongBreak => "Long break! You've earned it.",
                timer::TimerState::Idle => "Timer stopped.",
            };

            // Send system notification
            let _ = app.emit("timer-notification", message);
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            timer: PomodoroTimer::new(),
            wallpaper: Mutex::new(WallpaperManager::new()),
        })
        .setup(|app| {
            // System tray
            let start_item = MenuItem::with_id(app, "start", "Start", true, None::<&str>)?;
            let pause_item = MenuItem::with_id(app, "pause", "Pause", true, None::<&str>)?;
            let reset_item = MenuItem::with_id(app, "reset", "Reset", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&start_item, &pause_item, &reset_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "start" => {
                        let state = app.state::<AppState>();
                        state.timer.start();
                        let status = state.timer.get_status();
                        state
                            .wallpaper
                            .lock()
                            .unwrap()
                            .set_wallpaper_for_state(app, status.state);
                    }
                    "pause" => {
                        app.state::<AppState>().timer.pause();
                    }
                    "reset" => {
                        let state = app.state::<AppState>();
                        state.timer.reset();
                        state.wallpaper.lock().unwrap().restore_wallpaper();
                    }
                    "quit" => {
                        app.state::<AppState>()
                            .wallpaper
                            .lock()
                            .unwrap()
                            .restore_wallpaper();
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Start the timer tick loop
            start_timer_loop(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_timer,
            pause_timer,
            reset_timer,
            get_timer_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 2: Verify it compiles**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: wire up Tauri commands, system tray, and timer loop"
```

---

## Task 6: Build the Frontend Timer UI

**Files:**
- Modify: `index.html`
- Modify: `src/main.js` (or create `src/main.js`)
- Create: `src/styles.css`

**Step 1: Create the HTML**

Replace `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Anime Pomodoro</title>
    <link rel="stylesheet" href="/src/styles.css" />
</head>
<body>
    <div id="app">
        <div id="state-label">IDLE</div>
        <div id="timer-display">25:00</div>
        <div id="cycle-dots">
            <span class="dot" data-cycle="1"></span>
            <span class="dot" data-cycle="2"></span>
            <span class="dot" data-cycle="3"></span>
            <span class="dot" data-cycle="4"></span>
        </div>
        <div id="controls">
            <button id="start-btn">Start</button>
            <button id="pause-btn" disabled>Pause</button>
            <button id="reset-btn">Reset</button>
        </div>
    </div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 2: Create the CSS**

Create `src/styles.css`:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: #e0e0e0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    user-select: none;
}

#app {
    text-align: center;
    padding: 2rem;
}

#state-label {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 4px;
    color: #e94560;
    margin-bottom: 0.5rem;
}

#timer-display {
    font-size: 5rem;
    font-weight: 300;
    letter-spacing: 4px;
    margin-bottom: 1.5rem;
    color: #ffffff;
    text-shadow: 0 0 20px rgba(233, 69, 96, 0.3);
}

#cycle-dots {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #333;
    border: 2px solid #555;
    transition: all 0.3s ease;
}

.dot.active {
    background: #e94560;
    border-color: #e94560;
    box-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
}

.dot.completed {
    background: #533483;
    border-color: #533483;
}

#controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

button {
    padding: 0.6rem 1.5rem;
    border: 2px solid #e94560;
    background: transparent;
    color: #e94560;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
}

button:hover:not(:disabled) {
    background: #e94560;
    color: #fff;
}

button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* State-specific colors */
body.focus {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

body.short-break {
    background: linear-gradient(135deg, #0a3d2e 0%, #11574a 50%, #1a7a6a 100%);
}

body.long-break {
    background: linear-gradient(135deg, #2e1a3d 0%, #4a1166 50%, #6a1a8a 100%);
}

body.short-break #state-label,
body.short-break button {
    color: #2ecc71;
    border-color: #2ecc71;
}
body.short-break button:hover:not(:disabled) {
    background: #2ecc71;
    color: #fff;
}
body.short-break .dot.active {
    background: #2ecc71;
    border-color: #2ecc71;
}

body.long-break #state-label,
body.long-break button {
    color: #9b59b6;
    border-color: #9b59b6;
}
body.long-break button:hover:not(:disabled) {
    background: #9b59b6;
    color: #fff;
}
body.long-break .dot.active {
    background: #9b59b6;
    border-color: #9b59b6;
}
```

**Step 3: Create the JavaScript**

Replace `src/main.js`:

```javascript
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const stateLabel = document.getElementById("state-label");
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const dots = document.querySelectorAll(".dot");

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateUI(status) {
  timerDisplay.textContent = formatTime(status.remaining_secs);

  const stateNames = {
    Idle: "IDLE",
    Focus: "FOCUS",
    ShortBreak: "SHORT BREAK",
    LongBreak: "LONG BREAK",
  };
  stateLabel.textContent = stateNames[status.state] || status.state;

  // Update body class for theme colors
  document.body.className = "";
  if (status.state === "Focus") document.body.classList.add("focus");
  else if (status.state === "ShortBreak")
    document.body.classList.add("short-break");
  else if (status.state === "LongBreak")
    document.body.classList.add("long-break");

  // Update cycle dots
  dots.forEach((dot, i) => {
    dot.className = "dot";
    if (i + 1 < status.cycle) dot.classList.add("completed");
    else if (i + 1 === status.cycle && status.state !== "Idle")
      dot.classList.add("active");
  });

  // Update button states
  startBtn.disabled = status.is_running;
  pauseBtn.disabled = !status.is_running;
}

startBtn.addEventListener("click", async () => {
  const status = await invoke("start_timer");
  updateUI(status);
});

pauseBtn.addEventListener("click", async () => {
  const status = await invoke("pause_timer");
  updateUI(status);
});

resetBtn.addEventListener("click", async () => {
  const status = await invoke("reset_timer");
  updateUI(status);
});

// Listen for timer updates from Rust backend
listen("timer-update", (event) => {
  updateUI(event.payload);
});

// Listen for notifications
listen("timer-notification", (event) => {
  if (Notification.permission === "granted") {
    new Notification("Anime Pomodoro", { body: event.payload });
  }
});

// Request notification permission
if ("Notification" in window) {
  Notification.requestPermission();
}

// Get initial status
invoke("get_timer_status").then(updateUI);
```

**Step 4: Configure window size in tauri.conf.json**

In `tauri.conf.json`, update the window config to be a small popup:

```json
"windows": [
  {
    "title": "Anime Pomodoro",
    "width": 400,
    "height": 350,
    "resizable": false,
    "decorations": true,
    "center": true
  }
]
```

Also add `"withGlobalTauri": true` to the `"app"` config so `window.__TAURI__` is available:

In `tauri.conf.json`, ensure this exists:

```json
"app": {
  "withGlobalTauri": true,
  ...
}
```

**Step 5: Verify it runs**

```bash
npm run tauri dev
```

Expected: Timer window opens with the UI. Start/Pause/Reset buttons work. Wallpaper changes on state transitions.

**Step 6: Commit**

```bash
git add index.html src/styles.css src/main.js src-tauri/tauri.conf.json
git commit -m "feat: build anime-themed Pomodoro timer frontend UI"
```

---

## Task 7: Add Placeholder Wallpaper Assets

**Files:**
- Create: `src-tauri/resources/wallpapers/focus.jpg`
- Create: `src-tauri/resources/wallpapers/break.jpg`

**Step 1: Create placeholder wallpapers**

Generate or download two anime-style wallpapers (1920x1080 recommended):
- `focus.jpg` — a focused/studying anime character scene
- `break.jpg` — a relaxing/chill anime scene

For initial development, any two JPG images will work as placeholders.

**Step 2: Verify resource bundling**

Run `npm run tauri dev` and verify no errors about missing resources.

**Step 3: Commit**

```bash
git add src-tauri/resources/wallpapers/
git commit -m "feat: add placeholder wallpaper assets"
```

---

## Task 8: Final Testing and Polish

**Step 1: Full end-to-end test**

Run `npm run tauri dev` and verify:
- [ ] Timer starts at 25:00 in Idle state
- [ ] Clicking Start begins countdown and changes wallpaper to focus
- [ ] Clicking Pause stops the countdown
- [ ] Timer transitions to Short Break (5:00) after Focus ends, wallpaper changes
- [ ] After 4 focus sessions, Long Break (15:00) triggers
- [ ] Clicking Reset returns to Idle and restores original wallpaper
- [ ] System tray icon appears with working menu (Start/Pause/Reset/Quit)
- [ ] Left-clicking tray icon shows/focuses the window
- [ ] Quit from tray restores wallpaper before exiting
- [ ] Cycle dots update correctly

**Step 2: Build for production**

```bash
npm run tauri build
```

Expected: Produces an installer/executable in `src-tauri/target/release/bundle/`.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final polish and build verification"
```
