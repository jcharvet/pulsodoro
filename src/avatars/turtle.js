import { mk, drawCollar, drawScarf, drawCrown, drawWings } from "./shared.js";

const P = {
  shell: "#5B8C3E",
  shellDark: "#3D6B2A",
  shellLight: "#7DB356",
  skin: "#8FB86A",
  skinDark: "#6A9A4A",
  belly: "#C8D9A0",
  white: "#FFFFFF",
  pupil: "#1A1A2E",
  mouth: "#5A8040",
  cheek: "#B8D488",
};

// Turtle accessory positions (smaller head, shell-based body)
const POS = {
  collar: { path: "M24,38 Q32,41 40,38", bellCx: 32, bellCy: 40 },
  scarf: {
    path: "M22,37 Q32,42 42,37",
    endPath: "M37,39 Q40,44 38,49 Q36,47 34,43 Z",
  },
  crown: { x: 27, y: 12, w: 10 },
  wings: {
    left: "M20,40 Q4,30 8,18 Q14,28 20,34 Z",
    right: "M44,40 Q60,30 56,18 Q50,28 44,34 Z",
  },
};

// --- Body parts ---

function drawTail(svg) {
  const tail = mk("path", {
    d: "M42,52 Q48,52 46,48",
    fill: "none",
    stroke: P.skin,
    "stroke-width": 2.5,
    "stroke-linecap": "round",
  });
  tail.appendChild(
    mk("animateTransform", {
      attributeName: "transform",
      type: "rotate",
      values: "0 42 52;5 42 52;0 42 52;-3 42 52;0 42 52",
      dur: "4s",
      repeatCount: "indefinite",
    }),
  );
  svg.appendChild(tail);
}

function drawLegs(svg) {
  // Back legs (stubby, visible behind shell)
  svg.appendChild(
    mk("ellipse", { cx: 22, cy: 54, rx: 5, ry: 3, fill: P.skin }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 42, cy: 54, rx: 5, ry: 3, fill: P.skin }),
  );
  // Front legs
  svg.appendChild(
    mk("ellipse", { cx: 24, cy: 52, rx: 4, ry: 2.5, fill: P.skin }),
  );
  svg.appendChild(
    mk("ellipse", { cx: 40, cy: 52, rx: 4, ry: 2.5, fill: P.skin }),
  );
}

function drawShell(svg) {
  // Shell dome
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 44, rx: 14, ry: 12, fill: P.shell }),
  );
  // Shell belly/underside
  svg.appendChild(
    mk("ellipse", { cx: 32, cy: 50, rx: 12, ry: 5, fill: P.belly }),
  );
  // Scute pattern (hexagonal sections on shell)
  // Center scute
  svg.appendChild(
    mk("ellipse", {
      cx: 32,
      cy: 40,
      rx: 5,
      ry: 4,
      fill: "none",
      stroke: P.shellDark,
      "stroke-width": 0.8,
      opacity: 0.5,
    }),
  );
  // Top scutes
  svg.appendChild(
    mk("ellipse", {
      cx: 26,
      cy: 38,
      rx: 3.5,
      ry: 3,
      fill: "none",
      stroke: P.shellDark,
      "stroke-width": 0.7,
      opacity: 0.4,
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 38,
      cy: 38,
      rx: 3.5,
      ry: 3,
      fill: "none",
      stroke: P.shellDark,
      "stroke-width": 0.7,
      opacity: 0.4,
    }),
  );
  // Bottom scutes
  svg.appendChild(
    mk("ellipse", {
      cx: 27,
      cy: 45,
      rx: 3,
      ry: 2.5,
      fill: "none",
      stroke: P.shellDark,
      "stroke-width": 0.7,
      opacity: 0.35,
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 37,
      cy: 45,
      rx: 3,
      ry: 2.5,
      fill: "none",
      stroke: P.shellDark,
      "stroke-width": 0.7,
      opacity: 0.35,
    }),
  );
  // Shell highlight
  svg.appendChild(
    mk("ellipse", {
      cx: 30,
      cy: 36,
      rx: 3,
      ry: 2,
      fill: P.shellLight,
      opacity: 0.3,
    }),
  );
}

function drawHead(svg) {
  // Small round head poking out from shell
  svg.appendChild(mk("circle", { cx: 32, cy: 24, r: 10, fill: P.skin }));
  // Cheeks
  svg.appendChild(
    mk("ellipse", {
      cx: 25,
      cy: 27,
      rx: 2.5,
      ry: 1.5,
      fill: P.cheek,
      opacity: 0.5,
    }),
  );
  svg.appendChild(
    mk("ellipse", {
      cx: 39,
      cy: 27,
      rx: 2.5,
      ry: 1.5,
      fill: P.cheek,
      opacity: 0.5,
    }),
  );
}

function drawEye(svg, cx) {
  const eye = mk("ellipse", { cx, cy: 22, rx: 3, ry: 3.2, fill: P.white });
  eye.appendChild(
    mk("animate", {
      attributeName: "ry",
      values: "3.2;3.2;0.3;3.2;3.2",
      keyTimes: "0;0.46;0.5;0.54;1",
      dur: "5s",
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
  drawEye(svg, 28);
  drawEye(svg, 36);

  // Smile
  svg.appendChild(
    mk("path", {
      d: "M29,28 Q32,31 35,28",
      fill: "none",
      stroke: P.mouth,
      "stroke-width": 0.8,
      "stroke-linecap": "round",
    }),
  );
}

// --- Render ---

export function renderTurtle(svg, stage) {
  if (stage >= 5) drawWings(svg, POS.wings.left, POS.wings.right);
  drawTail(svg);
  drawLegs(svg);
  drawShell(svg);
  if (stage === 2 || stage >= 4)
    drawCollar(svg, POS.collar.path, POS.collar.bellCx, POS.collar.bellCy);
  if (stage === 3) drawScarf(svg, POS.scarf.path, POS.scarf.endPath);
  drawHead(svg);
  if (stage >= 4) drawCrown(svg, POS.crown.x, POS.crown.y, POS.crown.w);
  drawFace(svg);
}
