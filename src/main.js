const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { open } = window.__TAURI__.dialog;
const { getCurrentWindow } = window.__TAURI__.window;
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { THEMES, applyTheme } from "./themes.js";

// --- DOM Elements ---
const stateLabel = document.getElementById("state-label");
const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const skipBtn = document.getElementById("skip-btn");
const dots = document.querySelectorAll(".dot");
const progressRing = document.querySelector(".ring-progress");
const ringEndpoint = document.querySelector(".ring-endpoint");
const ringTicks = document.querySelector(".ring-ticks");

// Ring geometry constants
const RING_RADIUS = 130;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~816.81
const RING_CENTER = 150;

// Generate 60 tick marks
for (let i = 0; i < 60; i++) {
  const angle = (i * 6 - 90) * (Math.PI / 180); // -90 to start at 12 o'clock
  const isMajor = i % 5 === 0;
  const innerR = RING_RADIUS + 6;
  const outerR = isMajor ? RING_RADIUS + 18 : RING_RADIUS + 15;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", RING_CENTER + innerR * Math.cos(angle));
  line.setAttribute("y1", RING_CENTER + innerR * Math.sin(angle));
  line.setAttribute("x2", RING_CENTER + outerR * Math.cos(angle));
  line.setAttribute("y2", RING_CENTER + outerR * Math.sin(angle));
  if (isMajor) line.classList.add("major");
  ringTicks.appendChild(line);
}

// Set initial dasharray
progressRing.style.strokeDasharray = RING_CIRCUMFERENCE;
progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE; // fully hidden on idle

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
const musicSourceSelect = document.getElementById("music-source");
const youtubeSettings = document.getElementById("youtube-settings");
const tidalSettings = document.getElementById("tidal-settings");
const tidalUrlInput = document.getElementById("tidal-url");
const navBtns = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".settings-section");
const themeGrid = document.getElementById("theme-grid");
const pinBtn = document.getElementById("pin-btn");
const alwaysOnTopToggle = document.getElementById("always-on-top-toggle");
const progressRingToggle = document.getElementById("progress-ring-toggle");
const uiStyleSelect = document.getElementById("ui-style-select");
const fontSelect = document.getElementById("font-select");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const progressRingSvg = document.getElementById("progress-ring");
const statsDisplay = document.getElementById("stats-display");
const updateNotification = document.getElementById("update-notification");
const updateText = document.getElementById("update-text");
const updateDismiss = document.getElementById("update-dismiss");

// --- Current settings state (for the settings panel) ---
let pendingFocusBg = "";
let showProgressRing = true;
let pendingBreakBg = "";
let soundEnabled = true;
let alwaysOnTop = false;
let musicSource = "youtube";
let currentTheme = "midnight";
let pendingTheme = "midnight";

// --- Sound Alert ---
async function playChime() {
  const ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  const t = ctx.currentTime;

  // Three-note chime: C6 → E6 → G6
  const notes = [
    { freq: 1047, start: 0, dur: 0.4 },
    { freq: 1319, start: 0.15, dur: 0.4 },
    { freq: 1568, start: 0.3, dur: 0.6 },
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, t + start);
    gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + start);
    osc.stop(t + start + dur);

    // Add a harmonic for a richer bell sound
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(0.08, t + start);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + start + dur * 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + start);
    osc2.stop(t + start + dur);
  });
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
  } else if (
    (state === "ShortBreak" || state === "LongBreak") &&
    savedBreakBg
  ) {
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

musicToggle.addEventListener("click", async () => {
  if (musicSource === "tidal") {
    try {
      await invoke("toggle_tidal", {
        url: tidalUrlInput.value.trim() || "https://listen.tidal.com",
      });
      musicToggle.classList.add("active");
      musicPlaying = true;
    } catch (e) {
      console.error("Failed to toggle Tidal window:", e);
      musicToggle.classList.remove("active");
      musicPlaying = false;
    }
    return;
  }
  // YouTube
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

function updateRing(status) {
  if (status.state === "Idle" || !status.total_secs) {
    // Hide ring on idle
    progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
    ringEndpoint.classList.remove("active");
    ringEndpoint.setAttribute("opacity", "0");
    return;
  }

  const progress = status.remaining_secs / status.total_secs; // 1.0 -> 0.0
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = offset;

  // Position endpoint dot along the arc
  const angle = (-90 + 360 * (1 - progress)) * (Math.PI / 180);
  const ex = RING_CENTER + RING_RADIUS * Math.cos(angle);
  const ey = RING_CENTER + RING_RADIUS * Math.sin(angle);
  ringEndpoint.setAttribute("cx", ex);
  ringEndpoint.setAttribute("cy", ey);
  ringEndpoint.setAttribute("opacity", "1");
  ringEndpoint.classList.add("active");
}

function updateUI(status) {
  updateRing(status);
  timerDisplay.textContent = formatTime(status.remaining_secs);

  const stateNames = {
    Idle: "IDLE",
    Focus: "FOCUS",
    ShortBreak: "SHORT BREAK",
    LongBreak: "LONG BREAK",
  };
  stateLabel.textContent = stateNames[status.state] || status.state;

  document.body.classList.remove("focus", "short-break", "long-break");
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

function applyUiStyle(style) {
  document.body.classList.toggle("glass", style === "glass");
}

const FONT_MAP = {
  segoe: "'Segoe UI', sans-serif",
  consolas: "'Consolas', 'Courier New', monospace",
  georgia: "'Georgia', 'Times New Roman', serif",
  arial: "'Arial', 'Helvetica', sans-serif",
};

function applyFont(fontId) {
  document.documentElement.style.setProperty(
    "--timer-font",
    FONT_MAP[fontId] || FONT_MAP.segoe,
  );
}

// --- Fullscreen ---
async function toggleFullscreen() {
  const win = getCurrentWindow();
  const isFullscreen = await win.isFullscreen();
  await win.setFullscreen(!isFullscreen);
  fullscreenBtn.classList.toggle("active", !isFullscreen);
}

fullscreenBtn.addEventListener("click", toggleFullscreen);

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
  musicSource = settings.music_source || "youtube";
  musicSourceSelect.value = musicSource;
  youtubeSettings.classList.toggle("hidden", musicSource !== "youtube");
  tidalSettings.classList.toggle("hidden", musicSource !== "tidal");
  tidalUrlInput.value = settings.tidal_url || "";
  alwaysOnTopToggle.checked = settings.always_on_top;
  progressRingToggle.checked = settings.show_progress_ring;
  uiStyleSelect.value = settings.ui_style || "classic";
  fontSelect.value = settings.font || "segoe";
  pendingFocusBg = settings.focus_background;
  pendingBreakBg = settings.break_background;
  focusBgName.textContent = fileNameFromPath(settings.focus_background);
  breakBgName.textContent = fileNameFromPath(settings.break_background);
  // Reset to Timer section
  navBtns.forEach((b) => b.classList.remove("active"));
  sections.forEach((s) => s.classList.remove("active"));
  navBtns[0].classList.add("active");
  sections[0].classList.add("active");
  // Load theme
  pendingTheme = settings.theme || "midnight";
  renderThemeCards(pendingTheme);
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
    music_source: musicSourceSelect.value,
    tidal_url: tidalUrlInput.value.trim(),
    always_on_top: alwaysOnTopToggle.checked,
    show_progress_ring: progressRingToggle.checked,
    focus_background: pendingFocusBg,
    break_background: pendingBreakBg,
    theme: pendingTheme,
    ui_style: uiStyleSelect.value,
    font: fontSelect.value,
  };
  await invoke("save_settings", { settings });

  // Apply new settings immediately
  soundEnabled = soundToggle.checked;
  showProgressRing = progressRingToggle.checked;
  progressRingSvg.classList.toggle("ring-hidden", !showProgressRing);
  setAlwaysOnTop(alwaysOnTopToggle.checked);
  applyUiStyle(uiStyleSelect.value);
  applyFont(fontSelect.value);
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
  // Close other player when source changes
  const newSource = musicSourceSelect.value;
  if (newSource !== musicSource) {
    if (musicSource === "tidal") {
      await invoke("close_tidal");
    } else if (musicSource === "youtube" && youtubePlayer) {
      youtubePlayer.pauseVideo();
      playerContainer.classList.add("hidden");
    }
    musicToggle.classList.remove("active");
    musicPlaying = false;
    musicSource = newSource;
  }
  savedFocusBg = pendingFocusBg;
  savedBreakBg = pendingBreakBg;
  currentBgState = null; // Force refresh
  const status = await invoke("get_timer_status");
  await setBackground(status.state);
  currentTheme = pendingTheme;
  applyTheme(currentTheme);

  settingsPanel.classList.add("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  if (pendingTheme !== currentTheme) {
    applyTheme(currentTheme);
  }
  settingsPanel.classList.add("hidden");
});

// --- Settings Navigation ---
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    navBtns.forEach((b) => b.classList.remove("active"));
    sections.forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document
      .getElementById(`section-${btn.dataset.section}`)
      .classList.add("active");
  });
});

// --- Theme Cards ---
function renderThemeCards(activeThemeId) {
  themeGrid.innerHTML = "";
  for (const [id, theme] of Object.entries(THEMES)) {
    const card = document.createElement("div");
    card.className = "theme-card" + (id === activeThemeId ? " active" : "");
    card.dataset.theme = id;

    const preview = document.createElement("div");
    preview.className = "theme-card-preview";
    preview.style.background = theme.colors.background;

    const ring = document.createElement("div");
    ring.className = "theme-card-ring";
    ring.style.borderColor = theme.colors.focus;
    preview.appendChild(ring);

    const name = document.createElement("div");
    name.className = "theme-card-name";
    name.textContent = theme.name;

    const desc = document.createElement("div");
    desc.className = "theme-card-desc";
    desc.textContent = theme.description;

    const badge = document.createElement("div");
    badge.className = "theme-card-active-badge";
    badge.textContent = "\u2713 Active";

    card.appendChild(preview);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(badge);

    card.addEventListener("click", () => {
      pendingTheme = id;
      applyTheme(id);
      themeGrid
        .querySelectorAll(".theme-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
    });

    themeGrid.appendChild(card);
  }
}

// --- Music Source Toggle ---
musicSourceSelect.addEventListener("change", () => {
  youtubeSettings.classList.toggle(
    "hidden",
    musicSourceSelect.value !== "youtube",
  );
  tidalSettings.classList.toggle("hidden", musicSourceSelect.value !== "tidal");
});

// --- Events from Rust backend ---
listen("timer-update", (event) => {
  updateUI(event.payload);
});

listen("timer-notification", (event) => {
  if (soundEnabled) playChime();
  refreshStats();
  if (Notification.permission === "granted") {
    new Notification("PulsoDoro", { body: event.payload });
  }
});

listen("tidal-closed", () => {
  musicToggle.classList.remove("active");
  musicPlaying = false;
});

// --- Keyboard Shortcuts ---
document.addEventListener("keydown", async (e) => {
  // F11 fullscreen works regardless of context
  if (e.code === "F11") {
    e.preventDefault();
    toggleFullscreen();
    return;
  }

  // Escape closes settings panel
  if (!settingsPanel.classList.contains("hidden")) {
    if (e.code === "Escape") {
      closeSettingsBtn.click();
    }
    return;
  }
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

async function refreshStats() {
  const stats = await invoke("get_stats");
  statsDisplay.textContent = `Today: ${stats.today} | Week: ${stats.week}`;
}

// --- Auto-Update ---
let pendingUpdate = null;

async function checkForUpdate() {
  try {
    const update = await check();
    if (update) {
      pendingUpdate = update;
      updateText.textContent = `v${update.version} available`;
      updateNotification.classList.remove("hidden");
    }
  } catch (e) {
    console.error("Update check failed:", e);
  }
}

updateNotification.addEventListener("click", async (e) => {
  if (e.target === updateDismiss) return;
  if (!pendingUpdate) return;

  updateText.textContent = "Downloading...";
  updateNotification.classList.add("downloading");
  updateDismiss.classList.add("hidden");

  try {
    await pendingUpdate.downloadAndInstall((event) => {
      if (event.event === "Started") {
        const totalKB = Math.round((event.data.contentLength || 0) / 1024);
        if (totalKB > 0) {
          updateText.textContent = `Downloading... (${totalKB} KB)`;
        }
      } else if (event.event === "Finished") {
        updateText.textContent = "Restarting...";
      }
    });
    await relaunch();
  } catch (e) {
    console.error("Update install failed:", e);
    updateText.textContent = "Update failed";
    updateNotification.classList.remove("downloading");
    updateDismiss.classList.remove("hidden");
    setTimeout(() => {
      if (pendingUpdate) {
        updateText.textContent = `v${pendingUpdate.version} available`;
      }
    }, 5000);
  }
});

updateDismiss.addEventListener("click", (e) => {
  e.stopPropagation();
  updateNotification.classList.add("hidden");
});

// Load settings and apply backgrounds on startup
async function init() {
  const settings = await invoke("get_settings");
  savedFocusBg = settings.focus_background;
  savedBreakBg = settings.break_background;
  soundEnabled = settings.sound_enabled;
  customYouTubeId = settings.custom_youtube_id || "";
  musicSource = settings.music_source || "youtube";
  currentTheme = settings.theme || "midnight";
  pendingTheme = currentTheme;
  applyTheme(currentTheme);
  showProgressRing = settings.show_progress_ring ?? true;
  progressRingSvg.classList.toggle("ring-hidden", !showProgressRing);
  if (settings.always_on_top) setAlwaysOnTop(true);
  applyUiStyle(settings.ui_style || "classic");
  applyFont(settings.font || "segoe");

  const status = await invoke("get_timer_status");
  updateUI(status);
  await refreshStats();
  setBackground(status.state);
  checkForUpdate();
}

init();
