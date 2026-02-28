const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { open } = window.__TAURI__.dialog;
const { getCurrentWindow } = window.__TAURI__.window;

// --- DOM Elements ---
const stateLabel = document.getElementById("state-label");
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const skipBtn = document.getElementById("skip-btn");
const dots = document.querySelectorAll(".dot");
const bgImage = document.getElementById("bg-image");
const breakActivity = document.getElementById("break-activity");
const activityIcon = document.getElementById("activity-icon");
const activityText = document.getElementById("activity-text");
const musicToggle = document.getElementById("music-toggle");
const playerContainer = document.getElementById("youtube-player-container");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const saveSettingsBtn = document.getElementById("save-settings");
const closeSettingsBtn = document.getElementById("close-settings");
const focusInput = document.getElementById("focus-duration");
const shortBreakInput = document.getElementById("short-break-duration");
const longBreakInput = document.getElementById("long-break-duration");
const wallpaperToggle = document.getElementById("wallpaper-toggle");
const pickFocusBg = document.getElementById("pick-focus-bg");
const clearFocusBg = document.getElementById("clear-focus-bg");
const pickBreakBg = document.getElementById("pick-break-bg");
const clearBreakBg = document.getElementById("clear-break-bg");
const focusBgName = document.getElementById("focus-bg-name");
const breakBgName = document.getElementById("break-bg-name");
const soundToggle = document.getElementById("sound-toggle");
const youtubeUrlInput = document.getElementById("youtube-url");
const pinBtn = document.getElementById("pin-btn");
const alwaysOnTopToggle = document.getElementById("always-on-top-toggle");

// --- Current settings state (for the settings panel) ---
let pendingFocusBg = "";
let pendingBreakBg = "";
let soundEnabled = true;
let alwaysOnTop = false;

// --- Sound Alert ---
function playChime() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

// --- Break Activities ---
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

let previousState = null;

function showBreakActivity() {
  const activity =
    BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];
  activityIcon.textContent = activity.icon;
  activityText.textContent = activity.text;
  breakActivity.classList.remove("hidden");
}

function hideBreakActivity() {
  breakActivity.classList.add("hidden");
}

// --- Background Images ---
let currentBgState = null;
let savedFocusBg = "";
let savedBreakBg = "";
const bgCache = {};

async function loadBgDataUrl(path) {
  if (!path) return "";
  if (bgCache[path]) return bgCache[path];
  try {
    const dataUrl = await invoke("load_image", { path });
    bgCache[path] = dataUrl;
    return dataUrl;
  } catch (e) {
    console.error("Failed to load image:", e);
    return "";
  }
}

async function setBackground(state) {
  if (state === currentBgState) return;
  currentBgState = state;

  let dataUrl = "";
  if (state === "Focus" && savedFocusBg) {
    dataUrl = await loadBgDataUrl(savedFocusBg);
  } else if ((state === "ShortBreak" || state === "LongBreak") && savedBreakBg) {
    dataUrl = await loadBgDataUrl(savedBreakBg);
  }

  bgImage.style.backgroundImage = dataUrl ? `url('${dataUrl}')` : "";
}

// --- YouTube Lo-fi Player ---
const LOFI_STREAMS = [
  "jfKfPfyJRdk", // Lofi Girl
  "4xDzrJKXOOY", // Synthwave Boy
  "7NOSDKb0HlU", // ChilledCow study beats
];

let youtubePlayer = null;
let musicPlaying = false;
let customYouTubeId = "";

function extractYouTubeId(input) {
  if (!input) return "";
  const trimmed = input.trim();
  // Already a bare video ID (11 chars, alphanumeric + - _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  // URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return "";
}

function getYouTubeVideoId() {
  if (customYouTubeId) return customYouTubeId;
  return LOFI_STREAMS[Math.floor(Math.random() * LOFI_STREAMS.length)];
}

function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  const videoId = getYouTubeVideoId();
  youtubePlayer = new YT.Player("youtube-player", {
    height: "60",
    width: "200",
    videoId: videoId,
    playerVars: {
      autoplay: 1,
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

// --- Timer UI ---
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

  document.body.className = "";
  if (status.state === "Focus") document.body.classList.add("focus");
  else if (status.state === "ShortBreak")
    document.body.classList.add("short-break");
  else if (status.state === "LongBreak")
    document.body.classList.add("long-break");

  dots.forEach((dot, i) => {
    dot.className = "dot";
    if (i + 1 < status.cycle) dot.classList.add("completed");
    else if (i + 1 === status.cycle && status.state !== "Idle")
      dot.classList.add("active");
  });

  startBtn.disabled = status.is_running;
  pauseBtn.disabled = !status.is_running;

  if (status.state !== previousState) {
    if (status.state === "ShortBreak" || status.state === "LongBreak") {
      showBreakActivity();
    } else {
      hideBreakActivity();
    }
    setBackground(status.state);
    previousState = status.state;
  }
}

// --- Controls ---
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

skipBtn.addEventListener("click", async () => {
  const status = await invoke("skip_timer");
  updateUI(status);
});

// --- Always on Top ---
async function setAlwaysOnTop(value) {
  alwaysOnTop = value;
  await getCurrentWindow().setAlwaysOnTop(value);
  pinBtn.classList.toggle("active", value);
}

pinBtn.addEventListener("click", () => {
  setAlwaysOnTop(!alwaysOnTop);
});

// --- Settings Panel ---
function fileNameFromPath(path) {
  if (!path) return "Default gradient";
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1];
}

async function pickImage() {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"],
      },
    ],
  });
  return selected || "";
}

pickFocusBg.addEventListener("click", async () => {
  const path = await pickImage();
  if (path) {
    pendingFocusBg = path;
    focusBgName.textContent = fileNameFromPath(path);
  }
});

clearFocusBg.addEventListener("click", () => {
  pendingFocusBg = "";
  focusBgName.textContent = "Default gradient";
});

pickBreakBg.addEventListener("click", async () => {
  const path = await pickImage();
  if (path) {
    pendingBreakBg = path;
    breakBgName.textContent = fileNameFromPath(path);
  }
});

clearBreakBg.addEventListener("click", () => {
  pendingBreakBg = "";
  breakBgName.textContent = "Default gradient";
});

settingsBtn.addEventListener("click", async () => {
  const settings = await invoke("get_settings");
  focusInput.value = settings.focus_minutes;
  shortBreakInput.value = settings.short_break_minutes;
  longBreakInput.value = settings.long_break_minutes;
  wallpaperToggle.checked = settings.change_wallpaper;
  soundToggle.checked = settings.sound_enabled;
  youtubeUrlInput.value = settings.custom_youtube_id;
  alwaysOnTopToggle.checked = settings.always_on_top;
  pendingFocusBg = settings.focus_background;
  pendingBreakBg = settings.break_background;
  focusBgName.textContent = fileNameFromPath(settings.focus_background);
  breakBgName.textContent = fileNameFromPath(settings.break_background);
  settingsPanel.classList.remove("hidden");
});

saveSettingsBtn.addEventListener("click", async () => {
  const settings = {
    focus_minutes: parseInt(focusInput.value) || 25,
    short_break_minutes: parseInt(shortBreakInput.value) || 5,
    long_break_minutes: parseInt(longBreakInput.value) || 15,
    change_wallpaper: wallpaperToggle.checked,
    sound_enabled: soundToggle.checked,
    custom_youtube_id: extractYouTubeId(youtubeUrlInput.value),
    always_on_top: alwaysOnTopToggle.checked,
    focus_background: pendingFocusBg,
    break_background: pendingBreakBg,
  };
  await invoke("save_settings", { settings });

  // Apply new settings immediately
  soundEnabled = soundToggle.checked;
  setAlwaysOnTop(alwaysOnTopToggle.checked);
  const newYtId = extractYouTubeId(youtubeUrlInput.value);
  if (newYtId !== customYouTubeId) {
    customYouTubeId = newYtId;
    if (youtubePlayer && typeof youtubePlayer.cueVideoById === "function") {
      const vid = getYouTubeVideoId();
      if (musicPlaying) {
        youtubePlayer.loadVideoById({ videoId: vid });
      } else {
        youtubePlayer.cueVideoById({ videoId: vid });
      }
    }
  }
  savedFocusBg = pendingFocusBg;
  savedBreakBg = pendingBreakBg;
  currentBgState = null; // Force refresh
  const status = await invoke("get_timer_status");
  setBackground(status.state);

  settingsPanel.classList.add("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

// --- Events from Rust backend ---
listen("timer-update", (event) => {
  updateUI(event.payload);
});

listen("timer-notification", (event) => {
  if (soundEnabled) playChime();
  if (Notification.permission === "granted") {
    new Notification("PulsoDoro", { body: event.payload });
  }
});

// --- Keyboard Shortcuts ---
document.addEventListener("keydown", async (e) => {
  // Skip when settings panel is open or typing in an input
  if (!settingsPanel.classList.contains("hidden")) return;
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  switch (e.code) {
    case "Space":
      e.preventDefault();
      {
        const status = await invoke("get_timer_status");
        if (status.is_running) {
          updateUI(await invoke("pause_timer"));
        } else {
          updateUI(await invoke("start_timer"));
        }
      }
      break;
    case "KeyR":
      updateUI(await invoke("reset_timer"));
      break;
    case "KeyS":
      updateUI(await invoke("skip_timer"));
      break;
  }
});

// --- Init ---
if ("Notification" in window) {
  Notification.requestPermission();
}

// Load settings and apply backgrounds on startup
async function init() {
  const settings = await invoke("get_settings");
  savedFocusBg = settings.focus_background;
  savedBreakBg = settings.break_background;
  soundEnabled = settings.sound_enabled;
  customYouTubeId = settings.custom_youtube_id || "";
  if (settings.always_on_top) setAlwaysOnTop(true);

  const status = await invoke("get_timer_status");
  updateUI(status);
  setBackground(status.state);
}

init();
