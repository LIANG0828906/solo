export interface GeomElement {
  type: 'circle' | 'rect' | 'bezier';
  x: number;
  y: number;
  rotation: number;
  fillColor: string;
  strokeColor: string;
  opacity: number;
  radius?: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  lineWidth?: number;
  size: number;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function overlaps(
  elem: GeomElement,
  existing: GeomElement[],
  padding: number
): boolean {
  for (const other of existing) {
    const dx = elem.x - other.x;
    const dy = elem.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = (elem.size + other.size) / 2 + padding;
    if (dist < minDist) return true;
  }
  return false;
}

export interface GenerateOptions {
  lineDensity: number;
  shapeComplexity: number;
  hueShift: number;
  opacity: number;
  primaryColor: string;
  canvasWidth: number;
  canvasHeight: number;
  seed?: number;
}

export function generateArt(options: GenerateOptions): GeomElement[] {
  const {
    lineDensity,
    shapeComplexity,
    hueShift,
    opacity,
    primaryColor,
    canvasWidth,
    canvasHeight,
  } = options;

  const rng = seededRandom(options.seed ?? Date.now());
  const elements: GeomElement[] = [];
  const hsl = hexToHSL(primaryColor);
  const padding = 10;
  const minElements = Math.max(20, lineDensity);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  function tryAddElement(elem: GeomElement): boolean {
    for (let attempt = 0; attempt < 50; attempt++) {
      elem.x = rng() * canvasWidth;
      elem.y = rng() * canvasHeight;
      if (!overlaps(elem, elements, padding)) {
        elements.push(elem);
        return true;
      }
    }
    return false;
  }

  const circleCount = Math.max(7, Math.floor(minElements * 0.35));
  for (let i = 0; i < circleCount; i++) {
    const radius = 5 + rng() * 55;
    const hue = (hsl.h + hueShift + rng() * 60 - 30) % 360;
    const sat = Math.max(20, hsl.s + rng() * 30 - 15);
    const lit = Math.max(20, Math.min(80, hsl.l + rng() * 40 - 20));
    const elem: GeomElement = {
      type: 'circle',
      x: 0,
      y: 0,
      rotation: rng() * 360,
      fillColor: hslToHex(hue, sat, lit),
      strokeColor: 'transparent',
      opacity: 0.3 + rng() * opacity * 0.7,
      radius,
      size: radius * 2,
    };
    tryAddElement(elem);
  }

  const rectCount = Math.max(7, Math.floor(minElements * 0.35));
  for (let i = 0; i < rectCount; i++) {
    const w = 10 + rng() * 40;
    const h = 10 + rng() * 40;
    const compHue = (hsl.h + 180 + rng() * 30 - 15) % 360;
    const sat = Math.max(20, hsl.s + rng() * 20 - 10);
    const lit = Math.max(30, Math.min(70, hsl.l + rng() * 20 - 10));
    const elem: GeomElement = {
      type: 'rect',
      x: 0,
      y: 0,
      rotation: rng() * 90,
      fillColor: hslToHex(compHue, sat, lit),
      strokeColor: 'transparent',
      opacity: opacity * (0.4 + rng() * 0.6),
      width: w,
      height: h,
      size: Math.max(w, h),
    };
    tryAddElement(elem);
  }

  const bezierCount = Math.max(6, Math.floor(minElements * 0.3));
  for (let i = 0; i < bezierCount; i++) {
    const numPoints = 5 + Math.floor(rng() * 6);
    const points: { x: number; y: number }[] = [];
    const baseX = rng() * canvasWidth;
    const baseY = rng() * canvasHeight;
    for (let j = 0; j < numPoints; j++) {
      points.push({
        x: baseX + (rng() - 0.5) * 200,
        y: baseY + (rng() - 0.5) * 200,
      });
    }
    const hue = (hsl.h + rng() * 360) % 360;
    const sat = Math.max(30, hsl.s);
    const lit = Math.max(30, Math.min(80, hsl.l + rng() * 30));
    const elem: GeomElement = {
      type: 'bezier',
      x: baseX,
      y: baseY,
      rotation: 0,
      fillColor: 'transparent',
      strokeColor: hslToHex(hue, sat, lit),
      opacity: opacity * (0.5 + rng() * 0.5),
      points,
      lineWidth: 1 + rng() * 2,
      size: 80,
    };
    tryAddElement(elem);
  }

  while (elements.length < minElements) {
    const extraSize = 8 + rng() * 30;
    const hue = (hsl.h + hueShift + rng() * 120) % 360;
    const elem: GeomElement = {
      type: 'circle',
      x: 0,
      y: 0,
      rotation: rng() * 360,
      fillColor: hslToHex(hue, hsl.s, hsl.l),
      strokeColor: 'transparent',
      opacity: opacity * 0.5,
      radius: extraSize,
      size: extraSize * 2,
    };
    if (!tryAddElement(elem)) break;
  }

  return elements;
}

export function renderElements(
  ctx: CanvasRenderingContext2D,
  elements: GeomElement[],
  bgColor: string,
  progress: number
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  const gridSpacing = 30;
  ctx.strokeStyle = `rgba(200, 200, 200, 0.3)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let x = gridSpacing; x < w; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = gridSpacing; y < h; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const eased = 1 - Math.pow(1 - progress, 3);

  for (const elem of elements) {
    ctx.save();

    const dx = elem.x - cx;
    const dy = elem.y - cy;
    const animX = cx + dx * eased;
    const animY = cy + dy * eased;
    const animScale = eased;
    const animOpacity = elem.opacity * eased;

    ctx.globalAlpha = Math.max(0, Math.min(1, animOpacity));
    ctx.translate(animX, animY);
    ctx.rotate((elem.rotation * Math.PI) / 180);
    ctx.scale(animScale, animScale);

    switch (elem.type) {
      case 'circle': {
        if (elem.radius !== undefined) {
          ctx.beginPath();
          ctx.arc(0, 0, elem.radius, 0, Math.PI * 2);
          ctx.fillStyle = elem.fillColor;
          ctx.fill();
        }
        break;
      }
      case 'rect': {
        const rw = elem.width ?? 20;
        const rh = elem.height ?? 20;
        ctx.fillStyle = elem.fillColor;
        ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
        break;
      }
      case 'bezier': {
        if (elem.points && elem.points.length >= 2) {
          ctx.beginPath();
          const offsetX = animX - elem.x;
          const offsetY = animY - elem.y;
          ctx.moveTo(
            elem.points[0].x + offsetX - animX,
            elem.points[0].y + offsetY - animY
          );
          for (let i = 1; i < elem.points.length - 1; i += 1) {
            const cp = elem.points[i];
            const ep =
              i + 1 < elem.points.length
                ? elem.points[i + 1]
                : elem.points[i];
            ctx.quadraticCurveTo(
              cp.x + offsetX - animX,
              cp.y + offsetY - animY,
              (cp.x + ep.x) / 2 + offsetX - animX,
              (cp.y + ep.y) / 2 + offsetY - animY
            );
          }
          const last = elem.points[elem.points.length - 1];
          ctx.lineTo(
            last.x + offsetX - animX,
            last.y + offsetY - animY
          );
          ctx.strokeStyle = elem.strokeColor;
          ctx.lineWidth = elem.lineWidth ?? 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }
}
