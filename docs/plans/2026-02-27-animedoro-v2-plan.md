# Anime Pomodoro v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the basic Pomodoro timer into a full Animedoro experience with anime background images in the app window, guided break activities, embedded lo-fi YouTube player, and a settings panel.

**Architecture:** All changes build on the existing Tauri v2 app. Frontend gets a major UI overhaul (larger window, background images, new sections). Rust backend gets a new `settings` module for persisting user preferences. Settings are stored as JSON in the Tauri app data directory.

**Tech Stack:** Tauri v2, Rust, Vanilla HTML/CSS/JS, YouTube IFrame API, `serde_json` for settings persistence

---

### Task 1: Resize Window and Add Anime Background Image to UI

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `index.html`
- Modify: `src/styles.css`

**Step 1: Update window size in tauri.conf.json**

In `src-tauri/tauri.conf.json`, change the window config:

```json
"windows": [
  {
    "title": "Anime Pomodoro",
    "width": 800,
    "height": 500,
    "resizable": false,
    "center": true,
    "decorations": true
  }
]
```

**Step 2: Update index.html with background image container**

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
    <div id="bg-image"></div>
    <div id="bg-overlay"></div>

    <div id="app">
        <div id="timer-section">
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

        <div id="break-activity" class="hidden">
            <div id="activity-card">
                <div id="activity-icon">&#127807;</div>
                <div id="activity-text">Take a break!</div>
            </div>
        </div>
    </div>

    <div id="bottom-bar">
        <div id="music-section">
            <button id="music-toggle" title="Toggle lo-fi music">&#9835; Lo-fi</button>
        </div>
        <button id="settings-btn" title="Settings">&#9881;</button>
    </div>

    <div id="settings-panel" class="hidden">
        <div id="settings-content">
            <h2>Settings</h2>
            <div class="setting-group">
                <label>Focus (minutes)</label>
                <input type="number" id="focus-duration" min="1" max="120" value="25" />
            </div>
            <div class="setting-group">
                <label>Short Break (minutes)</label>
                <input type="number" id="short-break-duration" min="1" max="60" value="5" />
            </div>
            <div class="setting-group">
                <label>Long Break (minutes)</label>
                <input type="number" id="long-break-duration" min="1" max="60" value="15" />
            </div>
            <div class="setting-group">
                <label>
                    <input type="checkbox" id="wallpaper-toggle" checked />
                    Change desktop wallpaper
                </label>
            </div>
            <div class="setting-group">
                <label>Background Image</label>
                <div id="bg-picker">
                    <div class="bg-option selected" data-bg="default">Default</div>
                    <div class="bg-option" data-bg="custom">Custom...</div>
                </div>
            </div>
            <div class="settings-actions">
                <button id="save-settings">Save</button>
                <button id="close-settings">Cancel</button>
            </div>
        </div>
    </div>

    <div id="youtube-player-container" class="hidden">
        <div id="youtube-player"></div>
    </div>

    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 3: Rewrite styles.css for the new layout**

Replace `src/styles.css` with the full new stylesheet. Key changes:
- `#bg-image`: absolute-positioned full-screen background with `background-size: cover`
- `#bg-overlay`: semi-transparent dark overlay so text is readable over any image
- `#app`: centered content area with `z-index: 1` above the background
- `#break-activity`: card shown during breaks with guided activity text
- `#bottom-bar`: fixed bottom bar with music toggle and settings button
- `#settings-panel`: slide-in overlay panel
- `#youtube-player-container`: small fixed-position player in bottom-left

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', sans-serif;
    color: #e0e0e0;
    height: 100vh;
    overflow: hidden;
    user-select: none;
    position: relative;
}

/* Background layers */
#bg-image {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    background-size: cover;
    background-position: center;
    z-index: 0;
    transition: background-image 0.5s ease;
}

#bg-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 0;
}

/* Main app */
#app {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 50px);
}

#timer-section {
    text-align: center;
}

#state-label {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 6px;
    color: #e94560;
    margin-bottom: 0.5rem;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

#timer-display {
    font-size: 6rem;
    font-weight: 200;
    letter-spacing: 6px;
    margin-bottom: 1.5rem;
    color: #ffffff;
    text-shadow: 0 0 30px rgba(233, 69, 96, 0.4), 0 2px 10px rgba(0, 0, 0, 0.5);
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
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
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
    border: 2px solid rgba(233, 69, 96, 0.8);
    background: rgba(0, 0, 0, 0.3);
    color: #e94560;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
}

button:hover:not(:disabled) {
    background: rgba(233, 69, 96, 0.8);
    color: #fff;
}

button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Break activity card */
#break-activity {
    margin-top: 1.5rem;
    transition: opacity 0.3s ease;
}

#activity-card {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 1.5rem 2.5rem;
    text-align: center;
}

#activity-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

#activity-text {
    font-size: 1rem;
    letter-spacing: 1px;
    color: #ccc;
}

/* Bottom bar */
#bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    z-index: 2;
}

#music-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

#music-toggle, #settings-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ccc;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    text-transform: none;
    letter-spacing: 0;
}

#music-toggle:hover, #settings-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
}

#music-toggle.active {
    background: rgba(233, 69, 96, 0.3);
    border-color: #e94560;
    color: #e94560;
}

/* Settings panel */
#settings-panel {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
}

#settings-content {
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    width: 350px;
    max-height: 80vh;
    overflow-y: auto;
}

#settings-content h2 {
    margin-bottom: 1.5rem;
    font-weight: 400;
    letter-spacing: 2px;
    color: #e94560;
}

.setting-group {
    margin-bottom: 1.2rem;
}

.setting-group label {
    display: block;
    font-size: 0.85rem;
    color: #aaa;
    margin-bottom: 0.4rem;
}

.setting-group input[type="number"] {
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: #fff;
    font-size: 0.9rem;
}

.setting-group input[type="checkbox"] {
    margin-right: 0.5rem;
}

#bg-picker {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.bg-option {
    padding: 0.4rem 0.8rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    color: #ccc;
}

.bg-option:hover {
    border-color: #e94560;
}

.bg-option.selected {
    border-color: #e94560;
    background: rgba(233, 69, 96, 0.2);
    color: #e94560;
}

.settings-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.5rem;
}

.settings-actions button {
    flex: 1;
}

/* YouTube player */
#youtube-player-container {
    position: fixed;
    bottom: 55px;
    left: 10px;
    z-index: 3;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

#youtube-player-container iframe {
    display: block;
}

/* State-specific accent colors */
body.short-break #state-label,
body.short-break #controls button {
    color: #2ecc71;
    border-color: rgba(46, 204, 113, 0.8);
}
body.short-break #controls button:hover:not(:disabled) {
    background: rgba(46, 204, 113, 0.8);
    color: #fff;
}
body.short-break .dot.active {
    background: #2ecc71;
    border-color: #2ecc71;
    box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
}

body.long-break #state-label,
body.long-break #controls button {
    color: #9b59b6;
    border-color: rgba(155, 89, 182, 0.8);
}
body.long-break #controls button:hover:not(:disabled) {
    background: rgba(155, 89, 182, 0.8);
    color: #fff;
}
body.long-break .dot.active {
    background: #9b59b6;
    border-color: #9b59b6;
    box-shadow: 0 0 10px rgba(155, 89, 182, 0.5);
}

/* Utility */
.hidden {
    display: none !important;
}
```

**Step 4: Verify it compiles and commit**

```bash
cd E:/Projects/anime-pomodoro/src-tauri && export PATH="$HOME/.cargo/bin:$PATH" && cargo check
cd E:/Projects/anime-pomodoro && git add index.html src/styles.css src-tauri/tauri.conf.json
git commit -m "feat: resize window to 800x500 and add anime background image layout"
```

---

### Task 2: Add Guided Break Activities

**Files:**
- Modify: `src/main.js`

**Step 1: Add break activities to main.js**

Add the following to `src/main.js`:

1. A `BREAK_ACTIVITIES` array of objects with `icon` and `text` fields
2. A `showBreakActivity()` function that picks a random activity and shows it
3. A `hideBreakActivity()` function
4. Update `updateUI()` to call `showBreakActivity()` when state is ShortBreak or LongBreak, and `hideBreakActivity()` when state is Focus or Idle

Break activities list:
```javascript
const BREAK_ACTIVITIES = [
  { icon: "\u{1F9D8}", text: "Close your eyes and take 10 deep breaths" },
  { icon: "\u{1F4AA}", text: "Stand up and stretch for 2 minutes" },
  { icon: "\u{1F440}", text: "Look at something 20 feet away for 20 seconds" },
  { icon: "\u{1F4A7}", text: "Get a glass of water and hydrate" },
  { icon: "\u{1F6B6}", text: "Take a short walk around the room" },
  { icon: "\u{1F64C}", text: "Do 10 shoulder rolls to release tension" },
  { icon: "\u{270B}", text: "Stretch your wrists and fingers" },
  { icon: "\u{1F33F}", text: "Step outside for some fresh air" },
];
```

The `showBreakActivity()` function should:
- Pick a random activity from the array
- Set `#activity-icon` textContent to the icon
- Set `#activity-text` textContent to the text
- Remove `hidden` class from `#break-activity`

The `hideBreakActivity()` function should:
- Add `hidden` class to `#break-activity`

In `updateUI()`, after setting body class:
- If state is "ShortBreak" or "LongBreak", call `showBreakActivity()` only on transition (track previous state to avoid re-randomizing every second)
- If state is "Focus" or "Idle", call `hideBreakActivity()`

**Step 2: Verify and commit**

```bash
cd E:/Projects/anime-pomodoro && git add src/main.js
git commit -m "feat: add guided break activities during breaks"
```

---

### Task 3: Add Embedded YouTube Lo-fi Player

**Files:**
- Modify: `src/main.js`
- Modify: `src-tauri/tauri.conf.json` (CSP for YouTube)

**Step 1: Update CSP in tauri.conf.json**

Change the `security` section to allow YouTube iframes:

```json
"security": {
  "csp": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com; frame-src https://www.youtube.com; style-src 'self' 'unsafe-inline'"
}
```

**Step 2: Add YouTube player logic to main.js**

Add to `src/main.js`:

1. A `LOFI_STREAMS` array with YouTube video IDs for popular lo-fi streams:
```javascript
const LOFI_STREAMS = [
  "jfKfPfyJRdk",  // Lofi Girl
  "4xDzrJKXOOY",  // Synthwave Boy
  "7NOSDKb0HlU",  // ChilledCow study beats
];
```

2. YouTube player management:
```javascript
let youtubePlayer = null;
let musicPlaying = false;

const musicToggle = document.getElementById("music-toggle");
const playerContainer = document.getElementById("youtube-player-container");

function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  const videoId = LOFI_STREAMS[Math.floor(Math.random() * LOFI_STREAMS.length)];
  youtubePlayer = new YT.Player("youtube-player", {
    height: "60",
    width: "200",
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      loop: 1,
      playlist: videoId,
    },
  });
};

musicToggle.addEventListener("click", () => {
  if (!youtubePlayer) {
    loadYouTubeAPI();
    playerContainer.classList.remove("hidden");
    musicToggle.classList.add("active");
    musicPlaying = true;
    return;
  }

  if (musicPlaying) {
    youtubePlayer.pauseVideo();
    playerContainer.classList.add("hidden");
    musicToggle.classList.remove("active");
  } else {
    youtubePlayer.playVideo();
    playerContainer.classList.remove("hidden");
    musicToggle.classList.add("active");
  }
  musicPlaying = !musicPlaying;
});
```

**Step 3: Verify and commit**

```bash
cd E:/Projects/anime-pomodoro && git add src/main.js src-tauri/tauri.conf.json
git commit -m "feat: add embedded YouTube lo-fi music player"
```

---

### Task 4: Add Settings Module in Rust

**Files:**
- Create: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/timer.rs`

**Step 1: Create settings.rs**

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub focus_minutes: u32,
    pub short_break_minutes: u32,
    pub long_break_minutes: u32,
    pub change_wallpaper: bool,
    pub background_image: String, // "default" or a file path
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            focus_minutes: 25,
            short_break_minutes: 5,
            long_break_minutes: 15,
            change_wallpaper: true,
            background_image: "default".to_string(),
        }
    }
}

impl AppSettings {
    pub fn load(config_dir: &PathBuf) -> Self {
        let path = config_dir.join("settings.json");
        if let Ok(data) = fs::read_to_string(&path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            Self::default()
        }
    }

    pub fn save(&self, config_dir: &PathBuf) {
        let path = config_dir.join("settings.json");
        let _ = fs::create_dir_all(config_dir);
        let _ = fs::write(&path, serde_json::to_string_pretty(self).unwrap_or_default());
    }
}
```

**Step 2: Make timer durations configurable**

In `src-tauri/src/timer.rs`, change the constants to a method and add `set_durations`:

Replace the three `const` lines and add a durations struct:

```rust
#[derive(Debug, Clone)]
pub struct TimerDurations {
    pub focus: u32,
    pub short_break: u32,
    pub long_break: u32,
}

impl Default for TimerDurations {
    fn default() -> Self {
        Self {
            focus: 25 * 60,
            short_break: 5 * 60,
            long_break: 15 * 60,
        }
    }
}
```

Update `PomodoroTimer` to store durations:

```rust
pub struct PomodoroTimer {
    pub status: Mutex<TimerStatus>,
    pub durations: Mutex<TimerDurations>,
}
```

Update `new()`, `start()`, `reset()`, and `tick()` to use `self.durations.lock().unwrap()` instead of the constants.

Add a `set_durations` method:

```rust
pub fn set_durations(&self, focus_mins: u32, short_break_mins: u32, long_break_mins: u32) {
    let mut durations = self.durations.lock().unwrap();
    durations.focus = focus_mins * 60;
    durations.short_break = short_break_mins * 60;
    durations.long_break = long_break_mins * 60;
}
```

**Step 3: Add settings commands to lib.rs**

Add `mod settings;` and new Tauri commands:

```rust
use settings::AppSettings;

// Add to AppState:
struct AppState {
    timer: PomodoroTimer,
    wallpaper: Mutex<WallpaperManager>,
    settings: Mutex<AppSettings>,
    config_dir: PathBuf,
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> AppSettings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(state: State<AppState>, settings: AppSettings) -> AppSettings {
    // Update timer durations
    state.timer.set_durations(
        settings.focus_minutes,
        settings.short_break_minutes,
        settings.long_break_minutes,
    );
    // Save to disk
    settings.save(&state.config_dir);
    // Update state
    let mut current = state.settings.lock().unwrap();
    *current = settings;
    current.clone()
}
```

Update the `run()` function setup to load settings and pass config_dir:

```rust
.setup(|app| {
    let config_dir = app.path().app_config_dir().expect("failed to get config dir");
    let settings = AppSettings::load(&config_dir);

    // Apply loaded durations to timer
    let app_state = app.state::<AppState>();
    app_state.timer.set_durations(
        settings.focus_minutes,
        settings.short_break_minutes,
        settings.long_break_minutes,
    );

    // ... rest of setup
})
```

Wait — `manage` is called before `setup`, so we need to restructure. Load settings before `manage`:

```rust
pub fn run() {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("anime-pomodoro");
    let settings = AppSettings::load(&config_dir);

    let timer = PomodoroTimer::new();
    timer.set_durations(
        settings.focus_minutes,
        settings.short_break_minutes,
        settings.long_break_minutes,
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            timer,
            wallpaper: Mutex::new(WallpaperManager::new()),
            settings: Mutex::new(settings),
            config_dir,
        })
        // ...
```

Add `dirs = "6"` to `src-tauri/Cargo.toml` dependencies.

Register the new commands in the invoke_handler:

```rust
.invoke_handler(tauri::generate_handler![
    start_timer,
    pause_timer,
    reset_timer,
    get_timer_status,
    get_settings,
    save_settings
])
```

Also conditionally skip wallpaper changes if `change_wallpaper` is false. In the timer loop transition handler:

```rust
if let Some(new_state) = transition {
    let settings = state.settings.lock().unwrap();
    if settings.change_wallpaper {
        state
            .wallpaper
            .lock()
            .unwrap()
            .set_wallpaper_for_state(&app, new_state);
    }
    // ... notification code
}
```

Same check in the tray "start" menu event.

**Step 4: Verify compilation**

```bash
cd E:/Projects/anime-pomodoro/src-tauri && export PATH="$HOME/.cargo/bin:$PATH" && cargo check
```

**Step 5: Commit**

```bash
cd E:/Projects/anime-pomodoro && git add src-tauri/src/settings.rs src-tauri/src/timer.rs src-tauri/src/lib.rs src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "feat: add settings module with configurable timer durations and wallpaper toggle"
```

---

### Task 5: Wire Settings Panel in Frontend

**Files:**
- Modify: `src/main.js`

**Step 1: Add settings panel JavaScript**

Add to `src/main.js`:

```javascript
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const saveSettingsBtn = document.getElementById("save-settings");
const closeSettingsBtn = document.getElementById("close-settings");
const focusInput = document.getElementById("focus-duration");
const shortBreakInput = document.getElementById("short-break-duration");
const longBreakInput = document.getElementById("long-break-duration");
const wallpaperToggle = document.getElementById("wallpaper-toggle");

settingsBtn.addEventListener("click", async () => {
  const settings = await invoke("get_settings");
  focusInput.value = settings.focus_minutes;
  shortBreakInput.value = settings.short_break_minutes;
  longBreakInput.value = settings.long_break_minutes;
  wallpaperToggle.checked = settings.change_wallpaper;
  settingsPanel.classList.remove("hidden");
});

saveSettingsBtn.addEventListener("click", async () => {
  const settings = {
    focus_minutes: parseInt(focusInput.value) || 25,
    short_break_minutes: parseInt(shortBreakInput.value) || 5,
    long_break_minutes: parseInt(longBreakInput.value) || 15,
    change_wallpaper: wallpaperToggle.checked,
    background_image: "default",
  };
  await invoke("save_settings", { settings });
  settingsPanel.classList.add("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});
```

**Step 2: Verify and commit**

```bash
cd E:/Projects/anime-pomodoro && git add src/main.js
git commit -m "feat: wire settings panel to backend"
```

---

### Task 6: Add Real Anime Background Images

**Files:**
- Modify: `src/main.js`
- Add: anime wallpaper images to `src-tauri/resources/wallpapers/` and `public/backgrounds/`

**Step 1: Create public/backgrounds directory**

```bash
mkdir -p E:/Projects/anime-pomodoro/public/backgrounds
```

Place anime background images here:
- `focus-1.jpg` — a calm studying anime scene
- `break-1.jpg` — a relaxing anime scene

For development, use any two landscape JPG images. The user can replace them with real anime wallpapers later.

**Step 2: Add background switching logic to main.js**

Add to `src/main.js`:

```javascript
const bgImage = document.getElementById("bg-image");

const BACKGROUNDS = {
  focus: ["/backgrounds/focus-1.jpg"],
  break: ["/backgrounds/break-1.jpg"],
};

let currentBgState = null;

function setBackground(state) {
  if (state === currentBgState) return;
  currentBgState = state;

  let images;
  if (state === "Focus") {
    images = BACKGROUNDS.focus;
  } else if (state === "ShortBreak" || state === "LongBreak") {
    images = BACKGROUNDS.break;
  } else {
    bgImage.style.backgroundImage = "";
    return;
  }

  const img = images[Math.floor(Math.random() * images.length)];
  bgImage.style.backgroundImage = `url('${img}')`;
}
```

Call `setBackground(status.state)` in `updateUI()`.

**Step 3: Commit**

```bash
cd E:/Projects/anime-pomodoro && git add public/ src/main.js
git commit -m "feat: add anime background image switching per timer state"
```

---

### Task 7: Final Integration and Testing

**Step 1: End-to-end verification**

Run `npm run tauri dev` and verify:
- [ ] App opens at 800x500 with dark background
- [ ] Start/Pause/Reset buttons work
- [ ] Timer counts down correctly
- [ ] Break activity card appears during breaks with random activity
- [ ] Break activity hides when focus resumes
- [ ] Lo-fi music button loads YouTube player and toggles play/pause
- [ ] Settings panel opens, shows current values, saves changes
- [ ] Changing focus duration takes effect on next cycle
- [ ] Desktop wallpaper changes on state transitions (if toggle enabled)
- [ ] Wallpaper restores on quit
- [ ] Cycle dots track progress correctly

**Step 2: Final commit**

```bash
cd E:/Projects/anime-pomodoro && git add -A
git commit -m "feat: complete Anime Pomodoro v2 with backgrounds, guided breaks, lo-fi music, and settings"
```
