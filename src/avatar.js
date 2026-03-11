const SVG_NS = "http://www.w3.org/2000/svg";

const STAGE_THRESHOLDS = [0, 3, 8, 15, 25];

export function getStageForLevel(level) {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (level >= STAGE_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// Orange tabby palette
const P = {
  fur: "#E8943D",
  furDark: "#C47A2A",
  belly: "#FCDCB4",
  earPink: "#FFB6C1",
  white: "#FFFFFF",
  pupil: "#1A1A2E",
  nose: "#FF8C9E",
  mouth: "#C47A2A",
  whisker: "#AAAAAA",
  gold: "#FFD700",
  goldDark: "#DAA520",
};

function mk(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  if (attrs)
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export class AvatarRenderer {
  constructor(containerEl, size = 80) {
    this.container = containerEl;
    this.size = size;
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

    // Layers back-to-front
    if (stage >= 5) this._wings(svg);
    this._tail(svg);
    this._body(svg);
    if (stage === 2 || stage >= 4) this._collar(svg);
    if (stage === 3) this._scarf(svg);
    this._head(svg);
    this._ears(svg);
    if (stage >= 4) this._crown(svg);
    this._face(svg);
    this._stripes(svg);
    this._paws(svg);

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

  _tail(svg) {
    const tail = mk("path", {
      d: "M44,46 Q56,42 54,32 Q52,26 48,28",
      fill: "none",
      stroke: P.fur,
      "stroke-width": 3.5,
      "stroke-linecap": "round",
    });
    tail.appendChild(
      mk("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        values: "0 44 46;8 44 46;0 44 46;-4 44 46;0 44 46",
        dur: "3s",
        repeatCount: "indefinite",
      }),
    );
    svg.appendChild(tail);
  }

  _body(svg) {
    svg.appendChild(
      mk("ellipse", { cx: 32, cy: 44, rx: 12, ry: 10, fill: P.fur }),
    );
    svg.appendChild(
      mk("ellipse", { cx: 32, cy: 46, rx: 8, ry: 7, fill: P.belly }),
    );
  }

  _paws(svg) {
    svg.appendChild(
      mk("ellipse", { cx: 25, cy: 53, rx: 4.5, ry: 2.5, fill: P.fur }),
    );
    svg.appendChild(
      mk("ellipse", { cx: 25, cy: 53.5, rx: 3, ry: 1.5, fill: P.belly }),
    );
    svg.appendChild(
      mk("ellipse", { cx: 39, cy: 53, rx: 4.5, ry: 2.5, fill: P.fur }),
    );
    svg.appendChild(
      mk("ellipse", { cx: 39, cy: 53.5, rx: 3, ry: 1.5, fill: P.belly }),
    );
  }

  _head(svg) {
    svg.appendChild(mk("circle", { cx: 32, cy: 24, r: 14, fill: P.fur }));
    svg.appendChild(
      mk("ellipse", { cx: 21, cy: 29, rx: 4, ry: 3, fill: P.fur }),
    );
    svg.appendChild(
      mk("ellipse", { cx: 43, cy: 29, rx: 4, ry: 3, fill: P.fur }),
    );
  }

  _ears(svg) {
    svg.appendChild(mk("polygon", { points: "20,24 15,6 28,16", fill: P.fur }));
    svg.appendChild(
      mk("polygon", { points: "21,22 17,9 27,17", fill: P.earPink }),
    );
    svg.appendChild(mk("polygon", { points: "44,24 49,6 36,16", fill: P.fur }));
    svg.appendChild(
      mk("polygon", { points: "43,22 47,9 37,17", fill: P.earPink }),
    );
  }

  _face(svg) {
    this._eye(svg, 26);
    this._eye(svg, 38);

    // Nose
    svg.appendChild(
      mk("ellipse", { cx: 32, cy: 29, rx: 2, ry: 1.3, fill: P.nose }),
    );

    // Mouth (cat w-shape)
    svg.appendChild(
      mk("path", {
        d: "M29.5,30.5 Q31,33 32,30.5 Q33,33 34.5,30.5",
        fill: "none",
        stroke: P.mouth,
        "stroke-width": 0.7,
        "stroke-linecap": "round",
      }),
    );

    // Whiskers
    const w = [
      [25, 28, 12, 26],
      [25, 29, 11, 29],
      [25, 30, 12, 32],
      [39, 28, 52, 26],
      [39, 29, 53, 29],
      [39, 30, 52, 32],
    ];
    w.forEach(([ix, iy, ox, oy]) => {
      svg.appendChild(
        mk("line", {
          x1: ox,
          y1: oy,
          x2: ix,
          y2: iy,
          stroke: P.whisker,
          "stroke-width": 0.4,
          opacity: 0.5,
        }),
      );
    });
  }

  _eye(svg, cx) {
    const eye = mk("ellipse", { cx, cy: 23, rx: 3.5, ry: 4, fill: P.white });
    eye.appendChild(
      mk("animate", {
        attributeName: "ry",
        values: "4;4;0.3;4;4",
        keyTimes: "0;0.46;0.5;0.54;1",
        dur: "4s",
        repeatCount: "indefinite",
      }),
    );
    svg.appendChild(eye);
    svg.appendChild(
      mk("circle", { cx: cx + 0.8, cy: 23.5, r: 2.2, fill: P.pupil }),
    );
    svg.appendChild(
      mk("circle", { cx: cx + 1.5, cy: 22, r: 1, fill: P.white }),
    );
  }

  _stripes(svg) {
    svg.appendChild(
      mk("path", {
        d: "M27,16 L29,13 L32,16.5 L35,13 L37,16",
        fill: "none",
        stroke: P.furDark,
        "stroke-width": 1.2,
        "stroke-linecap": "round",
        opacity: 0.4,
      }),
    );
  }

  _collar(svg) {
    const band = mk("path", {
      d: "M22,36 Q32,40 42,36",
      fill: "none",
      "stroke-width": 2.5,
      "stroke-linecap": "round",
    });
    band.style.stroke = "var(--avatar-color, #e94560)";
    svg.appendChild(band);
    svg.appendChild(mk("circle", { cx: 32, cy: 39, r: 2, fill: P.gold }));
    svg.appendChild(
      mk("circle", { cx: 32, cy: 39.5, r: 0.6, fill: P.goldDark }),
    );
  }

  _scarf(svg) {
    const band = mk("path", {
      d: "M20,35 Q32,41 44,35",
      fill: "none",
      "stroke-width": 4,
      "stroke-linecap": "round",
    });
    band.style.stroke = "var(--avatar-color, #e94560)";
    svg.appendChild(band);
    const end = mk("path", { d: "M38,37 Q42,42 40,48 Q38,46 36,42 Z" });
    end.style.fill = "var(--avatar-color, #e94560)";
    svg.appendChild(end);
  }

  _crown(svg) {
    svg.appendChild(
      mk("rect", { x: 24, y: 9, width: 16, height: 4, rx: 1, fill: P.gold }),
    );
    svg.appendChild(mk("polygon", { points: "24,9 26,3 28,9", fill: P.gold }));
    svg.appendChild(mk("polygon", { points: "30,9 32,2 34,9", fill: P.gold }));
    svg.appendChild(mk("polygon", { points: "36,9 38,3 40,9", fill: P.gold }));
    svg.appendChild(mk("circle", { cx: 26, cy: 5, r: 1, fill: "#FF4444" }));
    svg.appendChild(mk("circle", { cx: 32, cy: 4, r: 1.2, fill: "#4488FF" }));
    svg.appendChild(mk("circle", { cx: 38, cy: 5, r: 1, fill: "#44CC44" }));
  }

  _wings(svg) {
    const addWing = (d) => {
      const w = mk("path", { d, opacity: 0.3 });
      w.style.fill = "var(--avatar-color, #e94560)";
      w.appendChild(
        mk("animate", {
          attributeName: "opacity",
          values: "0.3;0.5;0.3",
          dur: "2s",
          repeatCount: "indefinite",
        }),
      );
      svg.appendChild(w);
    };
    addWing("M20,44 Q4,34 8,20 Q14,30 20,36 Z");
    addWing("M44,44 Q60,34 56,20 Q50,30 44,36 Z");
  }
}
