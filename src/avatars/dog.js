import { mk, drawCollar, drawScarf, drawCrown, drawWings } from "./shared.js";

const P = {
  fur: "#C4956A",
  furDark: "#A07040",
  belly: "#F0DCC0",
  earInner: "#D4A87A",
  white: "#FFFFFF",
  pupil: "#1A1A2E",
  nose: "#2A2A2A",
  mouth: "#8B6040",
  tongue: "#FF8C9E",
  whisker: "#BBBBBB",
};

// Dog accessory positions
const POS = {
  collar: { path: "M21,37 Q32,41 43,37", bellCx: 32, bellCy: 40 },
  scarf: {
    path: "M19,36 Q32,42 45,36",
    endPath: "M39,38 Q43,43 41,49 Q39,47 37,43 Z",
  },
  crown: { x: 24, y: 8, w: 16 },
  wings: {
    left: "M19,44 Q3,34 7,20 Q13,30 19,36 Z",
    right: "M45,44 Q61,34 57,20 Q51,30 45,36 Z",
  },
};

// --- Body parts ---

function drawTail(svg) {
  const tail = mk("path", {
    d: "M44,44 Q52,38 50,28 Q49,24 46,26",
    fill: "none",
    stroke: P.fur,
    "stroke-width": 4,
    "stroke-linecap": "round",
  });
  tail.appendChild(
    mk("animateTransform", {
      attributeName: "transform",
      type: "rotate",
      values: "0 44 44;10 44 44;0 44 44;-6 44 44;0 44 44",
      dur: "2s",
      repeatCount: "indefinite",
    }),
  );
  svg.appendChild(tail);
}

function drawBody(svg) {
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 44, rx: 13, ry: 11, fill: P.fur }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 46, rx: 9, ry: 8, fill: P.belly }),
  );
}

function drawPaws(svg) {
  // Front paws (wider/rounder than cat)
  svg.appendChild(
    mk("ellipse", { cx: 24, cy: 54, rx: 5, ry: 3, fill: P.fur }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 24, cy: 54.5, rx: 3.5, ry: 2, fill: P.belly }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 40, cy: 54, rx: 5, ry: 3, fill: P.fur }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 40, cy: 54.5, rx: 3.5, ry: 2, fill: P.belly }),
  );
}

function drawHead(svg) {
  // Rounder head than cat
  svg.appendChild(mk("circle", { cx: 32, cy: 24, r: 15, fill: P.fur }));
  // Muzzle (distinct snout bump)
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 30, rx: 7, ry: 5, fill: P.belly }),
  );
}

function drawEars(svg) {
  // Floppy ears that hang down
  svg.appendChild(
    mk("ellipse", {
      cx: 17,
      cy: 22,
      rx: 6,
      ry: 10,
      fill: P.fur,
      transform: "rotate(15 17 22)",
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 18,
      cy: 23,
      rx: 4,
      ry: 7,
      fill: P.earInner,
      transform: "rotate(15 18 23)",
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 47,
      cy: 22,
      rx: 6,
      ry: 10,
      fill: P.fur,
      transform: "rotate(-15 47 22)",
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 46,
      cy: 23,
      rx: 4,
      ry: 7,
      fill: P.earInner,
      transform: "rotate(-15 46 23)",
    }),
  );
}

function drawEye(svg, cx) {
  const eye = mk("ellipse", {
    cx,
    cy: 22,
    rx: 3.5,
    ry: 3.5,
    fill: P.white,
  });
  eye.appendChild(
    mk("animate", {
      attributeName: "ry",
      values: "3.5;3.5;0.3;3.5;3.5",
      keyTimes: "0;0.46;0.5;0.54;1",
      dur: "4s",
      repeatCount: "indefinite",
    }),
  );
  svg.appendChild(eye);
  svg.appendChild(
    mk("circle", { cx: cx + 0.5, cy: 22.5, r: 2.2, fill: P.pupil }),
  );
  svg.appendChild(
    mk("circle", { cx: cx + 1.2, cy: 21, r: 1, fill: P.white }),
  );
}

function drawFace(svg) {
  drawEye(svg, 26);
  drawEye(svg, 38);

  // Nose (big black dog nose)
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 28, rx: 3, ry: 2.2, fill: P.nose }),
  );
  // Nose highlight
  svg.appendChild(
    mk("ellipse", {
      cx: 33,
      cy: 27.2,
      rx: 1.2,
      ry: 0.7,
      fill: "#444",
      opacity: 0.5,
    }),
  );

  // Mouth
  svg.appendChild(
    mk("path", {
      d: "M29,31 Q32,34 35,31",
      fill: "none",
      stroke: P.mouth,
      "stroke-width": 0.8,
      "stroke-linecap": "round",
    }),
  );

  // Tongue (small, peeking out)
  svg.appendChild(
    mk("ellipse", {
      cx: 32,
      cy: 33,
      rx: 2,
      ry: 1.5,
      fill: P.tongue,
      opacity: 0.8,
    }),
  );

  // Eyebrows (friendly raised brows)
  svg.appendChild(
    mk("path", {
      d: "M23,18 Q26,16 29,18",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 0.8,
      "stroke-linecap": "round",
      opacity: 0.4,
    }),
  );
  svg.appendChild(
    mk("path", {
      d: "M35,18 Q38,16 41,18",
      fill: "none",
      stroke: P.furDark,
      "stroke-width": 0.8,
      "stroke-linecap": "round",
      opacity: 0.4,
    }),
  );
}

// --- Render ---

export function renderDog(svg, stage) {
  if (stage >= 5) drawWings(svg, POS.wings.left, POS.wings.right);
  drawTail(svg);
  drawBody(svg);
  if (stage === 2 || stage >= 4)
    drawCollar(svg, POS.collar.path, POS.collar.bellCx, POS.collar.bellCy);
  if (stage === 3) drawScarf(svg, POS.scarf.path, POS.scarf.endPath);
  drawHead(svg);
  drawEars(svg);
  if (stage >= 4) drawCrown(svg, POS.crown.x, POS.crown.y, POS.crown.w);
  drawFace(svg);
  drawPaws(svg);
}
