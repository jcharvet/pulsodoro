export const SVG_NS = "http://www.w3.org/2000/svg";

export const GOLD = { main: "#FFD700", dark: "#DAA520" };

export function mk(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  if (attrs)
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// --- Shared accessory renderers (position params so each body type can specify placement) ---

export function drawCollar(svg, pathD, bellCx, bellCy) {
  const band = mk("path", {
    d: pathD,
    fill: "none",
    "stroke-width": 2.5,
    "stroke-linecap": "round",
  });
  band.style.stroke = "var(--avatar-color, #e94560)";
  svg.appendChild(band);
  svg.appendChild(
    mk("circle", { cx: bellCx, cy: bellCy, r: 2, fill: GOLD.main }),
  );
  svg.appendChild(
    mk("circle", { cx: bellCx, cy: bellCy + 0.5, r: 0.6, fill: GOLD.dark }),
  );
}

export function drawScarf(svg, pathD, endPathD) {
  const band = mk("path", {
    d: pathD,
    fill: "none",
    "stroke-width": 4,
    "stroke-linecap": "round",
  });
  band.style.stroke = "var(--avatar-color, #e94560)";
  svg.appendChild(band);
  const end = mk("path", { d: endPathD });
  end.style.fill = "var(--avatar-color, #e94560)";
  svg.appendChild(end);
}

export function drawCrown(svg, x, y, w) {
  const cx = x + w / 2;
  svg.appendChild(
    mk("rect", { x, y, width: w, height: 4, rx: 1, fill: GOLD.main }),
  );
  // Three points
  svg.appendChild(
    mk("polygon", {
      points: `${x},${y} ${x + 2},${y - 6} ${x + 4},${y}`,
      fill: GOLD.main,
    }),
  );
  svg.appendChild(
    mk("polygon", {
      points: `${cx - 2},${y} ${cx},${y - 7} ${cx + 2},${y}`,
      fill: GOLD.main,
    }),
  );
  svg.appendChild(
    mk("polygon", {
      points: `${x + w - 4},${y} ${x + w - 2},${y - 6} ${x + w},${y}`,
      fill: GOLD.main,
    }),
  );
  // Jewels
  svg.appendChild(
    mk("circle", { cx: x + 2, cy: y - 4, r: 1, fill: "#FF4444" }),
  );
  svg.appendChild(
    mk("circle", { cx, cy: y - 5, r: 1.2, fill: "#4488FF" }),
  );
  svg.appendChild(
    mk("circle", { cx: x + w - 2, cy: y - 4, r: 1, fill: "#44CC44" }),
  );
}

export function drawWings(svg, leftD, rightD) {
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
  addWing(leftD);
  addWing(rightD);
}
