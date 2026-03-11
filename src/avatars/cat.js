import { mk, drawCollar, drawScarf, drawCrown, drawWings } from "./shared.js";

// --- Palettes ---

const TABBY = {
  fur: "#E8943D",
  furDark: "#C47A2A",
  belly: "#FCDCB4",
  earPink: "#FFB6C1",
  white: "#FFFFFF",
  pupil: "#1A1A2E",
  nose: "#FF8C9E",
  mouth: "#C47A2A",
  whisker: "#AAAAAA",
};

const BENGAL = {
  fur: "#706058",
  furDark: "#3A3530",
  belly: "#F0EDE8",
  earPink: "#C4A0A0",
  white: "#FFFFFF",
  pupil: "#1A1A2E",
  iris: "#6B8E4E",
  nose: "#CC8A7A",
  mouth: "#5A4A40",
  whisker: "#E0E0E0",
};

// --- Cat accessory positions (shared by all cat variants) ---

const POS = {
  collar: { path: "M22,36 Q32,40 42,36", bellCx: 32, bellCy: 39 },
  scarf: {
    path: "M20,35 Q32,41 44,35",
    endPath: "M38,37 Q42,42 40,48 Q38,46 36,42 Z",
  },
  crown: { x: 24, y: 9, w: 16 },
  wings: {
    left: "M20,44 Q4,34 8,20 Q14,30 20,36 Z",
    right: "M44,44 Q60,34 56,20 Q50,30 44,36 Z",
  },
};

// --- Body parts ---

function drawTail(svg, P) {
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

function drawBody(svg, P) {
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 44, rx: 12, ry: 10, fill: P.fur }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 46, rx: 8, ry: 7, fill: P.belly }),
  );
}

function drawPaws(svg, P) {
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

function drawHead(svg, P) {
  svg.appendChild(mk("circle", { cx: 32, cy: 24, r: 14, fill: P.fur }));
  // Cheek puffs
  svg.appendChild(
    mk("ellipse", { cx: 21, cy: 29, rx: 4, ry: 3, fill: P.fur }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 43, cy: 29, rx: 4, ry: 3, fill: P.fur }),
  );
}

function drawEars(svg, P) {
  svg.appendChild(
    mk("polygon", { points: "20,24 15,6 28,16", fill: P.fur }),
  );
  svg.appendChild(
    mk("polygon", { points: "21,22 17,9 27,17", fill: P.earPink }),
  );
  svg.appendChild(
    mk("polygon", { points: "44,24 49,6 36,16", fill: P.fur }),
  );
  svg.appendChild(
    mk("polygon", { points: "43,22 47,9 37,17", fill: P.earPink }),
  );
}

function drawEye(svg, P, cx) {
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
  if (P.iris) {
    svg.appendChild(
      mk("circle", { cx: cx + 0.5, cy: 23.2, r: 2.8, fill: P.iris }),
    );
  }
  svg.appendChild(
    mk("circle", {
      cx: cx + 0.8,
      cy: 23.5,
      r: P.iris ? 1.6 : 2.2,
      fill: P.pupil,
    }),
  );
  svg.appendChild(
    mk("circle", { cx: cx + 1.5, cy: 22, r: 1, fill: P.white }),
  );
}

function drawFace(svg, P) {
  drawEye(svg, P, 26);
  drawEye(svg, P, 38);

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

// --- Markings ---

function drawTabbyMarkings(svg, P) {
  // M-mark on forehead
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

function drawBengalMarkings(svg, P) {
  // Bold M-mark on forehead
  svg.appendChild(
    mk("path", {
      d: "M27,16 L29,12.5 L32,16.5 L35,12.5 L37,16",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1.5,
      "stroke-linecap": "round",
      opacity: 0.6,
    }),
  );
  // Head stripes
  svg.appendChild(
    mk("path", {
      d: "M24,18 Q22,14 20,12",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1,
      "stroke-linecap": "round",
      opacity: 0.4,
    }),
  );
  svg.appendChild(
    mk("path", {
      d: "M40,18 Q42,14 44,12",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1,
      "stroke-linecap": "round",
      opacity: 0.4,
    }),
  );
  // Body stripes (mackerel pattern)
  svg.appendChild(
    mk("path", {
      d: "M23,40 Q22,44 23,48",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1.2,
      "stroke-linecap": "round",
      opacity: 0.35,
    }),
  );
  svg.appendChild(
    mk("path", {
      d: "M26,39 Q25,43 26,47",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1,
      "stroke-linecap": "round",
      opacity: 0.3,
    }),
  );
  svg.appendChild(
    mk("path", {
      d: "M38,39 Q39,43 38,47",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1,
      "stroke-linecap": "round",
      opacity: 0.3,
    }),
  );
  svg.appendChild(
    mk("path", {
      d: "M41,40 Q42,44 41,48",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 1.2,
      "stroke-linecap": "round",
      opacity: 0.35,
    }),
  );
  // White chest patch
  svg.appendChild(
    mk("ellipse", {
      cx: 32,
      cy: 38,
      rx: 5,
      ry: 4,
      fill: P.belly,
      opacity: 0.8,
    }),
  );
  // White paw tips
  svg.appendChild(
    mk("ellipse", { cx: 25, cy: 53.5, rx: 4, ry: 2, fill: P.belly }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 39, cy: 53.5, rx: 4, ry: 2, fill: P.belly }),
  );
}

// --- Render entry points ---

function renderCat(svg, stage, palette, markingsFn) {
  if (stage >= 5) drawWings(svg, POS.wings.left, POS.wings.right);
  drawTail(svg, palette);
  drawBody(svg, palette);
  if (stage === 2 || stage >= 4) drawCollar(svg, POS.collar.path, POS.collar.bellCx, POS.collar.bellCy);
  if (stage === 3) drawScarf(svg, POS.scarf.path, POS.scarf.endPath);
  drawHead(svg, palette);
  drawEars(svg, palette);
  if (stage >= 4) drawCrown(svg, POS.crown.x, POS.crown.y, POS.crown.w);
  drawFace(svg, palette);
  markingsFn(svg, palette);
  drawPaws(svg, palette);
}

export function renderTabby(svg, stage) {
  renderCat(svg, stage, TABBY, drawTabbyMarkings);
}

export function renderBengal(svg, stage) {
  renderCat(svg, stage, BENGAL, drawBengalMarkings);
}
