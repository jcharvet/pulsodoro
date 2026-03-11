import { mk, drawCollar, drawScarf, drawCrown, drawWings } from "./shared.js";

const P = {
  white: "#FFFFFF",
  black: "#2A2A2A",
  grey: "#E8E8E8",
  pink: "#FFB6C1",
  pupil: "#1A1A2E",
  nose: "#2A2A2A",
  mouth: "#555555",
  cheek: "#FFB6C1",
};

// Panda accessory positions (rounder, chubbier body)
const POS = {
  collar: { path: "M21,38 Q32,42 43,38", bellCx: 32, bellCy: 41 },
  scarf: {
    path: "M19,37 Q32,43 45,37",
    endPath: "M39,39 Q43,44 41,50 Q39,48 37,44 Z",
  },
  crown: { x: 24, y: 7, w: 16 },
  wings: {
    left: "M18,44 Q2,34 6,20 Q12,30 18,36 Z",
    right: "M46,44 Q62,34 58,20 Q52,30 46,36 Z",
  },
};

// --- Body parts ---

function drawTail(svg) {
  // Tiny round tail
  svg.appendChild(
    mk("circle", { cx: 45, cy: 48, r: 3, fill: P.black }),
  );
}

function drawBody(svg) {
  // Round white body
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 45, rx: 14, ry: 12, fill: P.white }),
  );
  // Belly patch (slightly grey)
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 47, rx: 9, ry: 8, fill: P.grey }),
  );
  // Black shoulder patches
  svg.appendChild(
    mk("ellipse", {
      cx: 20,
      cy: 42,
      rx: 5,
      ry: 6,
      fill: P.black,
      transform: "rotate(15 20 42)",
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 44,
      cy: 42,
      rx: 5,
      ry: 6,
      fill: P.black,
      transform: "rotate(-15 44 42)",
    }),
  );
}

function drawLegs(svg) {
  // Black legs
  svg.appendChild(
    mk("ellipse", { cx: 24, cy: 55, rx: 5, ry: 3, fill: P.black }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 40, cy: 55, rx: 5, ry: 3, fill: P.black }),
  );
  // Paw pads
  svg.appendChild(
    mk("ellipse", { cx: 24, cy: 55.5, rx: 3, ry: 1.5, fill: "#444" }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 40, cy: 55.5, rx: 3, ry: 1.5, fill: "#444" }),
  );
}

function drawHead(svg) {
  // Round white head
  svg.appendChild(mk("circle", { cx: 32, cy: 23, r: 15, fill: P.white }));
}

function drawEars(svg) {
  // Round black ears
  svg.appendChild(mk("circle", { cx: 18, cy: 12, r: 6, fill: P.black }));
  svg.appendChild(mk("circle", { cx: 46, cy: 12, r: 6, fill: P.black }));
}

function drawEyePatch(svg, cx) {
  // Black eye patch (panda signature)
  svg.appendChild(
    mk("ellipse", {
      cx,
      cy: 22,
      rx: 6,
      ry: 5,
      fill: P.black,
      transform: `rotate(${cx < 32 ? -10 : 10} ${cx} 22)`,
    }),
  );
}

function drawEye(svg, cx) {
  const eye = mk("ellipse", {
    cx,
    cy: 22,
    rx: 3,
    ry: 3.2,
    fill: P.white,
  });
  eye.appendChild(
    mk("animate", {
      attributeName: "ry",
      values: "3.2;3.2;0.3;3.2;3.2",
      keyTimes: "0;0.46;0.5;0.54;1",
      dur: "4s",
      repeatCount: "indefinite",
    }),
  );
  svg.appendChild(eye);
  svg.appendChild(
    mk("circle", { cx: cx + 0.5, cy: 22.5, r: 1.8, fill: P.pupil }),
  );
  svg.appendChild(
    mk("circle", { cx: cx + 1, cy: 21.2, r: 0.8, fill: P.white }),
  );
}

function drawFace(svg) {
  // Eye patches first, then eyes on top
  drawEyePatch(svg, 26);
  drawEyePatch(svg, 38);
  drawEye(svg, 26);
  drawEye(svg, 38);

  // Nose
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 28, rx: 2.5, ry: 1.8, fill: P.nose }),
  );

  // Mouth
  svg.appendChild(
    mk("path", {
      d: "M30,30 Q32,33 34,30",
      fill: "none",
      stroke: P.mouth,
      "stroke-width": 0.8,
      "stroke-linecap": "round",
    }),
  );

  // Blush cheeks
  svg.appendChild(
    mk("ellipse", {
      cx: 22,
      cy: 28,
      rx: 3,
      ry: 1.5,
      fill: P.cheek,
      opacity: 0.3,
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 42,
      cy: 28,
      rx: 3,
      ry: 1.5,
      fill: P.cheek,
      opacity: 0.3,
    }),
  );
}

// --- Render ---

export function renderPanda(svg, stage) {
  if (stage >= 5) drawWings(svg, POS.wings.left, POS.wings.right);
  drawTail(svg);
  drawLegs(svg);
  drawBody(svg);
  if (stage === 2 || stage >= 4)
    drawCollar(svg, POS.collar.path, POS.collar.bellCx, POS.collar.bellCy);
  if (stage === 3) drawScarf(svg, POS.scarf.path, POS.scarf.endPath);
  drawHead(svg);
  drawEars(svg);
  if (stage >= 4) drawCrown(svg, POS.crown.x, POS.crown.y, POS.crown.w);
  drawFace(svg);
}
