import { mk } from "./avatars/shared.js";
import { AVATAR_TYPES } from "./avatars/types.js";

const STAGE_THRESHOLDS = [0, 3, 8, 15, 25];

export function getStageForLevel(level) {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (level >= STAGE_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export class AvatarRenderer {
  constructor(containerEl, size = 80, type = "tabby") {
    this.container = containerEl;
    this.size = size;
    this.type = type;
    this.currentStage = 0;
    this.currentMood = "idle";
  }

  render(stage, mood = "idle") {
    this.currentStage = stage;
    this.currentMood = mood;
    this.container.innerHTML = "";

    const svg = mk("svg", {
      viewBox: "0 0 64 64",
      width: this.size,
      height: this.size,
    });
    svg.classList.add("avatar-svg");

    const avatarType = AVATAR_TYPES[this.type] || AVATAR_TYPES.tabby;
    avatarType.render(svg, stage);

    this.container.appendChild(svg);
    this._applyMoodClass(mood);
  }

  setMood(mood) {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    this._applyMoodClass(mood);
  }

  setStage(stage) {
    if (this.currentStage === stage) return;
    this.render(stage, this.currentMood);
  }

  setType(type) {
    if (this.type === type) return;
    this.type = type;
    this.render(this.currentStage, this.currentMood);
  }

  _applyMoodClass(mood) {
    const all = [
      "mood-idle",
      "mood-focus",
      "mood-short-break",
      "mood-long-break",
    ];
    all.forEach((c) => this.container.classList.remove(c));
    this.container.classList.add(`mood-${mood}`);
  }
}
