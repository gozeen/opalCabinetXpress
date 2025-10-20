export function calculatePanels(width, height, depth, thickness, options = {}) {
  const w = Number(width);
  const h = Number(height);
  const d = Number(depth);
  const t = Number(thickness);

  const panels = [];

  const backType = options.backType || "screwed";
  const topStyle = options.topStyle || "betweenSides";
  const rebutted = options.rebutted || "rebutted";

  // Left Side
  panels.push({
    name: "Left Side",
    length: h,
    width: d,
    thickness: t,
    position: { x: t / 2, y: h / 2, z: d / 2 + t },
    rotation: { rx: 90, ry: 90, rz: 0 }
  });

  // Right Side
  panels.push({
    name: "Right Side",
    length: h,
    width: d,
    thickness: t,
    position: { x: w - t / 2, y: h / 2, z: d / 2 + t },
    rotation: { rx: 90, ry: 90, rz: 0 }
  });

  // Bottom
  panels.push({
    name: "Bottom",
    length: w - 2 * t,
    width: d,
    thickness: t,
    position: { x: w / 2, y: t / 2, z: d / 2 + t },
    rotation: { rx: 90, ry: 0, rz: 0 }
  });

  // Top (rules: between sides vs flush)
  if (topStyle === "betweenSides") {
    panels.push({
      name: "Top",
      length: w - 2 * t,
      width: d,
      thickness: t,
      position: { x: w / 2, y: h - t / 2, z: d / 2 + t },
      rotation: { rx: 90, ry: 0, rz: 0 }
    });
  } else if (topStyle === "flushWithSides") {
    panels.push({
      name: "Top",
      length: w,
      width: d,
      thickness: t,
      position: { x: w / 2, y: h - t / 2, z: d / 2 + t },
      rotation: { rx: 90, ry: 0, rz: 0 }
    });
  }

  // Back (rules: screwed vs groove vs rebate)
  if (backType === "screwed") {
    panels.push({
      name: "Back",
      length: w,
      width: h,
      thickness: t,
      position: { x: w / 2, y: h / 2, z: t / 2 },
      rotation: { rx: 0, ry: 0, rz: 0 }
    });
  } else if (backType === "groove") {
    panels.push({
      name: "Back",
      length: w - 2 * t,
      width: h - 2 * t,
      thickness: t,
      position: { x: w / 2, y: h / 2, z: t },
      rotation: { rx: 0, ry: 0, rz: 0 }
    });
  }

  return panels;
}
