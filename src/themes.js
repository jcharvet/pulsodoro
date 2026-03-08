export const THEMES = {
  midnight: {
    name: "Midnight",
    description: "The classic PulsoDoro look",
    colors: {
      focus: "#e94560",
      focusRgb: "233, 69, 96",
      shortBreak: "#2ecc71",
      shortBreakRgb: "46, 204, 113",
      longBreak: "#9b59b6",
      longBreakRgb: "155, 89, 182",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      surface: "rgba(255, 255, 255, 0.08)",
      surfaceHover: "rgba(255, 255, 255, 0.15)",
      surfaceBorder: "rgba(255, 255, 255, 0.15)",
      text: "#e0e0e0",
      textMuted: "#aaaaaa",
      textDim: "#888888",
      settingsBg: "#1a1a2e",
      overlay: "rgba(0, 0, 0, 0.5)",
    },
    blur: "12px",
  },
  ember: {
    name: "Ember",
    description: "Warm and cozy",
    colors: {
      focus: "#e67e22",
      focusRgb: "230, 126, 34",
      shortBreak: "#27ae60",
      shortBreakRgb: "39, 174, 96",
      longBreak: "#f1c40f",
      longBreakRgb: "241, 196, 15",
      background: "linear-gradient(135deg, #1a1210 0%, #2c1810 50%, #3d2014 100%)",
      surface: "rgba(255, 200, 150, 0.06)",
      surfaceHover: "rgba(255, 200, 150, 0.12)",
      surfaceBorder: "rgba(255, 180, 120, 0.15)",
      text: "#f0e0d0",
      textMuted: "#c0a890",
      textDim: "#907060",
      settingsBg: "#1a1210",
      overlay: "rgba(10, 5, 0, 0.5)",
    },
    blur: "14px",
  },
  arctic: {
    name: "Arctic",
    description: "Cool and crisp",
    colors: {
      focus: "#3498db",
      focusRgb: "52, 152, 219",
      shortBreak: "#1abc9c",
      shortBreakRgb: "26, 188, 156",
      longBreak: "#a29bfe",
      longBreakRgb: "162, 155, 254",
      background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #1b2838 100%)",
      surface: "rgba(150, 200, 255, 0.06)",
      surfaceHover: "rgba(150, 200, 255, 0.12)",
      surfaceBorder: "rgba(150, 200, 255, 0.15)",
      text: "#e8f0f8",
      textMuted: "#a0b8d0",
      textDim: "#708898",
      settingsBg: "#0a0e1a",
      overlay: "rgba(0, 5, 15, 0.5)",
    },
    blur: "10px",
  },
};

/** Apply a theme by ID to the document */
export function applyTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;

  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty("--focus-color", c.focus);
  root.style.setProperty("--focus-color-rgb", c.focusRgb);
  root.style.setProperty("--short-break-color", c.shortBreak);
  root.style.setProperty("--short-break-color-rgb", c.shortBreakRgb);
  root.style.setProperty("--long-break-color", c.longBreak);
  root.style.setProperty("--long-break-color-rgb", c.longBreakRgb);
  root.style.setProperty("--bg-gradient", c.background);
  root.style.setProperty("--surface-color", c.surface);
  root.style.setProperty("--surface-hover", c.surfaceHover);
  root.style.setProperty("--surface-border", c.surfaceBorder);
  root.style.setProperty("--text-color", c.text);
  root.style.setProperty("--text-muted", c.textMuted);
  root.style.setProperty("--text-dim", c.textDim);
  root.style.setProperty("--settings-bg", c.settingsBg);
  root.style.setProperty("--overlay-color", c.overlay);
  root.style.setProperty("--blur-amount", theme.blur);

  // Update the background gradient for #bg-image
  const bgImage = document.getElementById("bg-image");
  if (bgImage && !bgImage.style.backgroundImage.startsWith("url")) {
    bgImage.style.background = c.background;
  }
}
