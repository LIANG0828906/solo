import type { PlantData, Leaf, Mood } from './plantGenerator';

export interface RenderOptions {
  animate?: boolean;
  compact?: boolean;
  id?: string;
}

const id = (name: string, suffix: string) => `${name}-${suffix}`;

function hsl(c: { h: number; s: number; l: number }, lOffset = 0, sOffset = 0): string {
  return `hsl(${c.h}, ${Math.max(0, Math.min(100, c.s + sOffset))}%, ${Math.max(
    0,
    Math.min(100,
      c.l + lOffset
    )
  )}%)`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function renderGround(viewW: number, viewH: number, groundY: number, prefix: string): string {
  const gradId = id(prefix, 'ground-grad');
  return `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c9b99a" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#a89880" stop-opacity="0.5"/>
      </linearGradient>
    </defs>
    <ellipse cx="${viewW / 2}" cy="${groundY + 14}" rx="${viewW * 0.42}" ry="16" fill="url(#${gradId})"/>
    <ellipse cx="${viewW / 2}" cy="${groundY + 6}" rx="${viewW * 0.3}" ry="7" fill="#b5a488" opacity="0.35"/>
  `;
}

function renderRoots(plant: PlantData, animate: boolean, duration: number, prefix: string): string {
  const parts: string[] = [];
  const groundY = plant.trunk.baseY;
  const growStart = 0;
  const growEnd = 0.22;

  for (let i = 0; i < plant.roots.length; i++) {
    const r = plant.roots[i];
    const endX = r.startX + Math.cos((r.angle * Math.PI) / 180) * r.length;
    const endY = r.startY + Math.sin((r.angle * Math.PI) / 180) * r.length + r.length * 0.25;
    const ctrlX = r.startX + Math.cos((r.angle * Math.PI) / 180) * r.length * 0.5;
    const ctrlY =
      r.startY +
      Math.sin((r.angle * Math.PI) / 180) * r.length * 0.5 +
      r.length * 0.35 +
      (i % 2 === 0 ? 4 : -4);

    const d = `M ${r.startX} ${r.startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    const strokeColor = `hsl(${28 + (i % 3) * 2}, 32%, 40%)`;

    if (animate) {
      const delay = growStart * duration + i * 30;
      const growDur = (growEnd - growStart) * duration;
      const pathId = id(prefix, `root-${i}`);
      parts.push(`
        <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${r.thickness}"
              stroke-linecap="round" opacity="0.85">
          <animate id="${pathId}" attributeName="stroke-dasharray"
                   from="0,1000" to="300,1000"
                   dur="${growDur}ms" begin="${delay}ms" fill="freeze"
                   calcMode="spline" keySplines="0.33 1 0.68 1"/>
          <animate attributeName="opacity" from="0" to="0.85"
                   dur="120ms" begin="${delay}ms" fill="freeze"/>
        </path>
      `);
    } else {
      parts.push(`
        <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${r.thickness}"
              stroke-linecap="round" opacity="0.85"/>
      `);
    }
  }

  return parts.join('');
}

function renderTrunk(plant: PlantData, animate: boolean, duration: number, prefix: string): string {
  const { trunk, colorPalette } = plant;
  const gradId = id(prefix, 'trunk-grad');
  const growStart = 0.1;
  const growEnd = 0.55;

  const segs = trunk.segments;
  let pathD = '';
  let pathD2 = '';

  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const leftX = s.x - s.thickness / 2;
    const rightX = s.x + s.thickness / 2;
    if (i === 0) {
      pathD = `M ${leftX} ${s.y}`;
      pathD2 = `M ${rightX} ${s.y}`;
    } else {
      const prev = segs[i - 1];
      const prevLeftX = prev.x - prev.thickness / 2;
      const prevRightX = prev.x + prev.thickness / 2;
      const cly = (prev.y + s.y) / 2;
      pathD += ` Q ${prevLeftX} ${cly} ${leftX} ${s.y}`;
      pathD2 += ` Q ${prevRightX} ${cly} ${rightX} ${s.y}`;
    }
  }

  const last = segs[segs.length - 1];
  const fullD = `${pathD} A ${last.thickness / 2} ${last.thickness / 2.5} 0 0 1 ${last.x + last.thickness / 2} ${last.y} ${pathD2.split(' ').reverse().join(' ')} Z`;

  const outlineD = (() => {
    const pts: string[] = [];
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (i === 0) {
        pts.push(`M ${s.x} ${s.y}`);
      } else {
        const prev = segs[i - 1];
        const cpx = (prev.x + s.x) / 2;
        const cpy = (prev.y + s.y) / 2;
        pts.push(`Q ${cpx} ${cpy} ${s.x} ${s.y}`);
      }
    }
    return pts.join(' ');
  })();

  const clipId = id(prefix, 'trunk-clip');
  const trunkGroupId = id(prefix, 'trunk-g');

  if (animate) {
    const delay = growStart * duration;
    const growDur = (growEnd - growStart) * duration;
    return `
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="${hsl(colorPalette.trunkStart)}"/>
          <stop offset="100%" stop-color="${hsl(colorPalette.trunkEnd)}"/>
        </linearGradient>
        <clipPath id="${clipId}">
          <rect x="${segs[0].x - trunk.thickness}" y="${last.y}"
                width="${trunk.thickness * 2}" height="${trunk.height + 5}">
            <animate attributeName="height" from="0" to="${trunk.height + 5}"
                     dur="${growDur}ms" begin="${delay}ms" fill="freeze"
                     calcMode="spline" keySplines="0.33 1 0.68 1"/>
            <animate attributeName="y" from="${segs[0].y}" to="${last.y}"
                     dur="${growDur}ms" begin="${delay}ms" fill="freeze"
                     calcMode="spline" keySplines="0.33 1 0.68 1"/>
          </rect>
        </clipPath>
      </defs>
      <g id="${trunkGroupId}" clip-path="url(#${clipId})">
        <path d="${fullD}" fill="url(#${gradId})"/>
        <path d="${outlineD}" fill="none" stroke="${hsl(colorPalette.trunkEnd, -8, -5)}"
              stroke-width="1" opacity="0.35"/>
      </g>
    `;
  } else {
    return `
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="${hsl(colorPalette.trunkStart)}"/>
          <stop offset="100%" stop-color="${hsl(colorPalette.trunkEnd)}"/>
        </linearGradient>
      </defs>
      <g id="${trunkGroupId}">
        <path d="${fullD}" fill="url(#${gradId})"/>
        <path d="${outlineD}" fill="none" stroke="${hsl(colorPalette.trunkEnd, -8, -5)}"
              stroke-width="1" opacity="0.35"/>
      </g>
    `;
  }
}

function renderBranches(plant: PlantData, animate: boolean, duration: number, prefix: string): string {
  const parts: string[] = [];
  const { colorPalette, animation } = plant;
  const growStart = 0.35;
  const growEnd = 0.8;
  const totalBranches = plant.branches.length;

  for (let i = 0; i < totalBranches; i++) {
    const b = plant.branches[i];
    const endX = b.startX + Math.cos((b.angle * Math.PI) / 180) * b.length;
    const endY = b.startY + Math.sin((b.angle * Math.PI) / 180) * b.length;
    const midT = 0.55;
    const midX =
      b.startX +
      Math.cos((b.angle * Math.PI) / 180) * b.length * midT +
      Math.sin(midT * Math.PI) * b.curve;
    const midY =
      b.startY +
      Math.sin((b.angle * Math.PI) / 180) * b.length * midT +
      Math.cos(midT * Math.PI) * b.curve * 0.3;

    const d = `M ${b.startX} ${b.startY} Q ${midX} ${midY} ${endX} ${endY}`;
    const gradId = id(prefix, `branch-${i}-grad`);

    const delay =
      growStart * duration +
      (i / Math.max(1, totalBranches - 1)) * (growEnd - growStart) * duration * 0.7;
    const growDur = duration * (0.18 + Math.random() * 0.08);

    if (animate) {
      parts.push(`
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${hsl(colorPalette.branchStart, b.level === 2 ? -3 : 0)}"/>
            <stop offset="100%" stop-color="${hsl(colorPalette.branchEnd, b.level === 2 ? 2 : 0)}"/>
          </linearGradient>
        </defs>
      `);
    } else {
      parts.push(`
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${hsl(colorPalette.branchStart, b.level === 2 ? -3 : 0)}"/>
            <stop offset="100%" stop-color="${hsl(colorPalette.branchEnd, b.level === 2 ? 2 : 0)}"/>
          </linearGradient>
        </defs>
      `);
    }

    const animAttrs = animate
      ? `
        <animate attributeName="stroke-dasharray" from="0,500" to="400,500"
                 dur="${growDur}ms" begin="${delay}ms" fill="freeze"
                 calcMode="spline" keySplines="0.33 1 0.68 1"/>
        <animate attributeName="opacity" from="0" to="0.95"
                 dur="80ms" begin="${delay}ms" fill="freeze"/>
      `
      : '';

    parts.push(`
      <path d="${d}" fill="none" stroke="url(#${gradId})" stroke-width="${b.thickness}"
            stroke-linecap="round" opacity="0.95" ${animate ? 'stroke-dasharray="0,500"' : ''}>
        ${animAttrs}
      </path>
    `);
  }

  if (animation.swayAmount > 0) {
    const swayDur = 3000 / animation.floatSpeed;
    const swayDelay = animate ? duration : 0;
    parts.push(`
      <animateTransform attributeName="transform" type="rotate"
                        values="0 ${plant.trunk.baseX} ${plant.trunk.baseY - plant.trunk.height * 0.5};
                                ${animation.swayAmount} ${plant.trunk.baseX} ${plant.trunk.baseY - plant.trunk.height * 0.5};
                                0 ${plant.trunk.baseX} ${plant.trunk.baseY - plant.trunk.height * 0.5};
                                ${-animation.swayAmount} ${plant.trunk.baseX} ${plant.trunk.baseY - plant.trunk.height * 0.5};
                                0 ${plant.trunk.baseX} ${plant.trunk.baseY - plant.trunk.height * 0.5}"
                        dur="${swayDur}ms" begin="${swayDelay}ms" repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="${
                          animation.floatType === 'irregular'
                            ? '0.2 0.8 0.4 1; 0.6 0.1 0.8 0.3; 0.1 0.7 0.3 0.9; 0.5 0.2 0.7 0.6'
                            : '0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1'
                        }"/>
    `);
  }

  return `<g id="${id(prefix, 'branches')}">${parts.join('')}</g>`;
}

function renderLeafShape(
  leaf: Leaf,
  idx: number,
  prefix: string
): { d: string; veinD: string } {
  const { x, y, size, angle, shape } = leaf;
  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const rotate = (px: number, py: number): [number, number] => {
    const rx = px * cosA - py * sinA;
    const ry = px * sinA + py * cosA;
    return [x + rx, y + ry];
  };

  let d = '';
  let veinD = '';
  const s = size;

  switch (shape) {
    case 'round': {
      const [p0] = rotate(-s * 0.7, 0);
      const [x1, y1] = rotate(-s * 0.3, -s * 0.85);
      const [x2, y2] = rotate(s * 0.3, -s * 0.85);
      const [p1x, p1y] = rotate(s * 0.7, 0);
      const [x3, y3] = rotate(s * 0.3, s * 0.55);
      const [x4, y4] = rotate(-s * 0.3, s * 0.55);
      d = `M ${p0} ${rotate(-s * 0.7, 0)[1]} C ${x1} ${y1}, ${x2} ${y2}, ${p1x} ${p1y} C ${x3} ${y3}, ${x4} ${y4}, ${p0} ${rotate(-s * 0.7, 0)[1]} Z`;
      const [tipX, tipY] = rotate(0, -s * 0.85);
      const [baseX, baseY] = rotate(0, s * 0.35);
      veinD = `M ${baseX} ${baseY} Q ${x} ${y}, ${tipX} ${tipY}`;
      break;
    }
    case 'pointed': {
      const [tipX, tipY] = rotate(0, -s * 1.1);
      const [rx1, ry1] = rotate(s * 0.6, -s * 0.2);
      const [rx2, ry2] = rotate(s * 0.4, s * 0.55);
      const [lx1, ly1] = rotate(-s * 0.6, -s * 0.2);
      const [lx2, ly2] = rotate(-s * 0.4, s * 0.55);
      const [baseX, baseY] = rotate(0, s * 0.6);
      d = `M ${tipX} ${tipY} C ${rx1} ${ry1}, ${rx2} ${ry2}, ${baseX} ${baseY} C ${lx2} ${ly2}, ${lx1} ${ly1}, ${tipX} ${tipY} Z`;
      veinD = `M ${baseX} ${baseY} Q ${x} ${y}, ${tipX} ${tipY}`;
      break;
    }
    case 'heart': {
      const [botX, botY] = rotate(0, s * 0.75);
      const [rtX, rtY] = rotate(s * 0.65, -s * 0.15);
      const [rbX, rbY] = rotate(s * 0.4, s * 0.3);
      const [ltX, ltY] = rotate(-s * 0.65, -s * 0.15);
      const [lbX, lbY] = rotate(-s * 0.4, s * 0.3);
      const [topMidX, topMidY] = rotate(0, -s * 0.35);
      d = `M ${botX} ${botY} C ${rbX} ${rbY}, ${rtX} ${rtY}, ${topMidX} ${topMidY} C ${ltX} ${ltY}, ${lbX} ${lbY}, ${botX} ${botY} Z`;
      veinD = `M ${botX} ${botY} Q ${x} ${y - s * 0.1}, ${topMidX} ${topMidY}`;
      break;
    }
    case 'long':
    default: {
      const [tipX, tipY] = rotate(0, -s * 1.25);
      const [midRX, midRY] = rotate(s * 0.38, -s * 0.3);
      const [baseRX, baseRY] = rotate(s * 0.28, s * 0.7);
      const [midLX, midLY] = rotate(-s * 0.38, -s * 0.3);
      const [baseLX, baseLY] = rotate(-s * 0.28, s * 0.7);
      const [baseX, baseY] = rotate(0, s * 0.75);
      d = `M ${tipX} ${tipY} C ${midRX} ${midRY}, ${baseRX} ${baseRY}, ${baseX} ${baseY} C ${baseLX} ${baseLY}, ${midLX} ${midLY}, ${tipX} ${tipY} Z`;
      veinD = `M ${baseX} ${baseY} L ${tipX} ${tipY}`;
      break;
    }
  }

  return { d, veinD };
}

function renderLeaves(plant: PlantData, animate: boolean, duration: number, prefix: string): string {
  const parts: string[] = [];
  const { leaves, animation } = plant;

  const growStart = 0.6;
  const growEnd = 1.0;

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    const gradId = id(prefix, `leaf-${i}-grad`);
    const { d, veinD } = renderLeafShape(leaf, i, prefix);

    const yRatio = (plant.trunk.baseY - leaf.y) / Math.max(1, plant.trunk.height);
    const delay =
      growStart * duration +
      easeOutQuad(Math.min(1, Math.max(0, yRatio))) *
        (growEnd - growStart) *
        duration *
        0.85 +
      (i % 7) * 20;
    const growDur = duration * 0.22;
    const opacityDur = 120;

    parts.push(`
      <defs>
        <radialGradient id="${gradId}" cx="40%" cy="60%" r="70%">
          <stop offset="0%" stop-color="${hsl(leaf.color, 6)}"/>
          <stop offset="100%" stop-color="${hsl(leaf.color, -6)}"/>
        </radialGradient>
      </defs>
    `);

    if (animate) {
      const scaleId = id(prefix, `leaf-${i}-scale`);
      const opacityId = id(prefix, `leaf-${i}-op`);
      parts.push(`
        <g style="transform-origin: ${leaf.x}px ${leaf.y}px">
          <animate id="${scaleId}" attributeName="transform" type="scale"
                   from="0" to="1"
                   dur="${growDur}ms" begin="${delay}ms" fill="freeze"
                   calcMode="spline" keySplines="0.34 1.56 0.64 1"/>
          <animate id="${opacityId}" attributeName="opacity"
                   from="0" to="0.95"
                   dur="${opacityDur}ms" begin="${delay}ms" fill="freeze"/>
          <path d="${d}" fill="url(#${gradId})" opacity="0.95"
                stroke="${hsl(leaf.veinColor, -5)}" stroke-width="0.35"/>
          <path d="${veinD}" fill="none" stroke="${hsl(leaf.veinColor)}"
                stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
        </g>
      `);
    } else {
      parts.push(`
        <g>
          <path d="${d}" fill="url(#${gradId})" opacity="0.95"
                stroke="${hsl(leaf.veinColor, -5)}" stroke-width="0.35"/>
          <path d="${veinD}" fill="none" stroke="${hsl(leaf.veinColor)}"
                stroke-width="0.6" stroke-linecap="round" opacity="0.8"/>
        </g>
      `);
    }
  }

  if (animation.floatType !== 'steady') {
    const floatDur = 4000 / animation.floatSpeed;
    const floatAmp =
      animation.floatType === 'fast'
        ? 2.5
        : animation.floatType === 'irregular'
        ? 3
        : 1.5;
    const delay = animate ? duration * 0.8 : 0;
    parts.push(`
      <animateTransform attributeName="transform" type="translate"
                        values="0,0; ${floatAmp}px,${-floatAmp}px; 0,0; ${-floatAmp}px,${floatAmp * 0.6}px; 0,0"
                        dur="${floatDur}ms" begin="${delay}ms" repeatCount="indefinite"
                        calcMode="${animation.floatType === 'irregular' ? 'linear' : 'spline'}"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"/>
    `);
  }

  return `<g id="${id(prefix, 'leaves')}">${parts.join('')}</g>`;
}

export function renderPlantSVG(plant: PlantData, options: RenderOptions = {}): string {
  const { animate = true, compact = false, id: idPrefix = 'p' } = options;
  const { viewBox } = plant;

  const duration = plant.animation.totalDuration;
  const prefix = idPrefix;

  const groundY = plant.trunk.baseY;

  return `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}"
     preserveAspectRatio="xMidYMid meet"
     ${compact ? '' : 'width="100%" height="100%"'}>
  <defs>
    <filter id="${id(prefix, 'soft-shadow')}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feOffset in="blur" dx="0" dy="2" result="offset"/>
      <feFlood flood-color="#2d6a4f" flood-opacity="0.15" result="color"/>
      <feComposite in="color" in2="offset" operator="in" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  ${renderGround(viewBox.w, viewBox.h, groundY, prefix)}

  <g filter="url(#${id(prefix, 'soft-shadow')})">
    <g id="${id(prefix, 'roots')}">
      ${renderRoots(plant, animate, duration, prefix)}
    </g>

    ${renderTrunk(plant, animate, duration, prefix)}

    ${renderBranches(plant, animate, duration, prefix)}

    ${renderLeaves(plant, animate, duration, prefix)}
  </g>
</svg>
  `.trim();
}

export function renderMoodIconSVG(mood: Mood, size = 24): string {
  const colors: Record<Mood, { bg: string; accent: string }> = {
    happy: { bg: '#fff3b0', accent: '#e9c46a' },
    calm: { bg: '#d8f0e2', accent: '#74c69d' },
    anxious: { bg: '#e6d9f5', accent: '#9d8ec4' },
    tired: { bg: '#d6e4f0', accent: '#7b9cb8' },
  };
  const c = colors[mood];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <defs>
    <radialGradient id="mg-${mood}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff"/>
      <stop offset="100%" stop-color="${c.bg}"/>
    </radialGradient>
  </defs>
  <circle cx="12" cy="12" r="10" fill="url(#mg-${mood})" stroke="${c.accent}" stroke-width="1.5"/>
</svg>
  `.trim();
}
