import { v4 as uuidv4 } from 'uuid';
import { Block, AnimationSequence, ShapeParams, ShapeTypes, AnimationTypes, AnimationParams } from '../types';
import { easeInOutQuad } from './animationEngine';

const TRANSITION_GAP = 200;

interface ExportResult {
  svgContent: string;
  jsContent: string;
  packageName: string;
  shareId: string;
}

const shapeParamsToString = (block: Block): string => {
  const params = block.params as ShapeParams & { _baseX?: number; _baseY?: number };
  const baseX = params._baseX ?? 200;
  const baseY = params._baseY ?? 200;

  switch (block.shapeType) {
    case ShapeTypes.CIRCLE:
      return `<circle id="shape-${block.id}" cx="${baseX}" cy="${baseY}" r="${params.radius ?? 40}" fill="${params.fill}" />`;
    case ShapeTypes.RECTANGLE:
      return `<rect id="shape-${block.id}" x="${baseX}" y="${baseY}" width="${params.width ?? 80}" height="${params.height ?? 60}" fill="${params.fill}" />`;
    case ShapeTypes.TRIANGLE: {
      const side = params.sideLength ?? 80;
      const h = (side * Math.sqrt(3)) / 2;
      const points = `${baseX + side / 2},${baseY} ${baseX},${baseY + h} ${baseX + side},${baseY + h}`;
      return `<polygon id="shape-${block.id}" points="${points}" fill="${params.fill}" />`;
    }
    case ShapeTypes.STAR: {
      const points = params.points ?? 5;
      const outerR = params.outerRadius ?? 45;
      const innerR = params.innerRadius ?? 20;
      const pts: string[] = [];
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${baseX + r * Math.cos(angle)},${baseY + r * Math.sin(angle)}`);
      }
      return `<polygon id="shape-${block.id}" points="${pts.join(' ')}" fill="${params.fill}" />`;
    }
    default:
      return '';
  }
};

const getShapeCenterOffset = (block: Block): { dx: number; dy: number } => {
  const params = block.params as ShapeParams & { _baseX?: number; _baseY?: number };
  switch (block.shapeType) {
    case ShapeTypes.CIRCLE:
      return { dx: params._baseX ?? 200, dy: params._baseY ?? 200 };
    case ShapeTypes.RECTANGLE:
      return {
        dx: (params._baseX ?? 200) + (params.width ?? 80) / 2,
        dy: (params._baseY ?? 200) + (params.height ?? 60) / 2
      };
    case ShapeTypes.TRIANGLE: {
      const side = params.sideLength ?? 80;
      return {
        dx: (params._baseX ?? 200) + side / 2,
        dy: (params._baseY ?? 200) + (side * Math.sqrt(3)) / 4
      };
    }
    case ShapeTypes.STAR:
      return { dx: params._baseX ?? 200, dy: params._baseY ?? 200 };
    default:
      return { dx: 200, dy: 200 };
  }
};

export const generateExportPackage = (
  blocks: Block[],
  sequences: AnimationSequence[]
): ExportResult => {
  const shareId = uuidv4().replace(/-/g, '').slice(0, 12);
  const packageName = `animblocks-${shareId}`;

  const shapeBlocks = blocks.filter(b => b.type === 'shape');

  const shapeElements = shapeBlocks.map(shapeParamsToString).join('\n  ');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" id="animblocks-svg">
  <style>
    svg { background: #0f3460; }
  </style>
  ${shapeElements}
  <script type="text/javascript"><![CDATA[
(function() {
${generateJsAnimationCode(blocks, sequences)}
})();
  ]]></script>
</svg>`;

  const jsContent = generateStandaloneJsCode(blocks, sequences);

  return {
    svgContent,
    jsContent,
    packageName,
    shareId
  };
};

const generateJsAnimationCode = (blocks: Block[], sequences: AnimationSequence[]): string => {
  const dataLines: string[] = [];

  const shapeBlocks = blocks.filter(b => b.type === 'shape');

  dataLines.push('  const shapeConfigs = [');
  for (const shape of shapeBlocks) {
    const params = shape.params as ShapeParams & { _baseX?: number; _baseY?: number };
    const center = getShapeCenterOffset(shape);
    const seq = sequences.find(s => s.shapeId === shape.id);
    const animIds = seq?.animationIds ?? [];
    const anims = animIds
      .map(id => blocks.find(b => b.id === id))
      .filter((b): b is Block => b !== undefined);

    const animConfig = anims.map(a => {
      const ap = a.params as AnimationParams;
      switch (a.animationType) {
        case AnimationTypes.MOVE:
          return `{ type: 'move', dx: ${ap.dx ?? 0}, dy: ${ap.dy ?? 0}, duration: ${ap.duration}, repeat: ${ap.repeat} }`;
        case AnimationTypes.ROTATE:
          return `{ type: 'rotate', angle: ${ap.angle ?? 0}, duration: ${ap.duration}, repeat: ${ap.repeat} }`;
        case AnimationTypes.SCALE:
          return `{ type: 'scale', factor: ${ap.factor ?? 1}, duration: ${ap.duration}, repeat: ${ap.repeat} }`;
        case AnimationTypes.COLOR:
          return `{ type: 'color', targetColor: '${ap.targetColor ?? '#ffffff'}', duration: ${ap.duration}, repeat: ${ap.repeat} }`;
        case AnimationTypes.BLINK:
          return `{ type: 'blink', frequency: ${ap.frequency ?? 2}, duration: ${ap.duration}, repeat: ${ap.repeat} }`;
        default:
          return '';
      }
    }).filter(Boolean);

    dataLines.push(`    {
      id: '${shape.id}',
      type: '${shape.shapeType}',
      baseX: ${params._baseX ?? 200},
      baseY: ${params._baseY ?? 200},
      baseColor: '${params.fill}',
      centerX: ${center.dx},
      centerY: ${center.dy},
      animations: [${animConfig.join(', ')}]
    },`);
  }
  dataLines.push('  ];');

  return `${dataLines.join('\n')}

  const easing = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const hex = c => {
    const m = c.match(/^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i);
    return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : {r:255,g:255,b:255};
  };
  const toHex = (r,g,b) => '#' + [r,g,b].map(x => {
    const h = Math.round(Math.max(0,Math.min(255,x))).toString(16);
    return h.length===1?'0'+h:h;
  }).join('');
  const mixColor = (c1,c2,t) => {
    const a=hex(c1),b=hex(c2);
    return toHex(a.r+(b.r-a.r)*t,a.g+(b.g-a.g)*t,a.b+(b.b-a.b)*t);
  };

  function applyAnim(state, anim, progress) {
    const e = easing(progress);
    switch(anim.type) {
      case 'move': return {...state, x: state.x+anim.dx*e, y: state.y+anim.dy*e};
      case 'rotate': return {...state, rotation: state.rotation+anim.angle*e};
      case 'scale': return {...state, scale: state.scale*(1+(anim.factor-1)*e)};
      case 'color': return {...state, fill: mixColor(state.fill, anim.targetColor, e)};
      case 'blink': {
        const freq = anim.frequency * anim.duration / 1000;
        const t = Math.sin(progress * Math.PI * 2 * freq);
        return {...state, opacity: 0.3 + 0.7 * Math.abs(t)};
      }
      default: return state;
    }
  }

  function getTotalDuration(anims) {
    return anims.reduce((t,a) => t + a.duration*a.repeat + ${TRANSITION_GAP}, 0);
  }

  function computeState(config, time) {
    let state = { x: config.baseX, y: config.baseY, rotation: 0, scale: 1, fill: config.baseColor, opacity: 1 };
    const total = getTotalDuration(config.animations);
    if (total === 0) return state;
    let t = time % total;
    for (const anim of config.animations) {
      const full = anim.duration * anim.repeat;
      const animDur = full + ${TRANSITION_GAP};
      if (t < full) {
        const p = t / anim.duration;
        const cycle = Math.floor(p);
        const lp = p - cycle;
        if (cycle < anim.repeat) state = applyAnim(state, anim, lp);
        break;
      } else if (t < animDur) {
        state = applyAnim(state, anim, 1);
        break;
      } else {
        state = applyAnim(state, anim, 1);
        t -= animDur;
      }
    }
    return state;
  }

  function renderShape(config, state) {
    const el = document.getElementById('shape-' + config.id);
    if (!el) return;
    const cx = config.centerX, cy = config.centerY;
    const tx = state.x - config.baseX, ty = state.y - config.baseY;
    el.setAttribute('transform', 'translate('+tx+','+ty+') rotate('+state.rotation+','+(cx - (state.x-config.baseX))+','+(cy - (state.y-config.baseY))+') scale('+state.scale+','+state.scale+','+cx+','+cy+')');
    if (config.animations.some(a => a.type === 'color')) el.setAttribute('fill', state.fill);
    if (config.animations.some(a => a.type === 'blink')) el.setAttribute('opacity', state.opacity);
  }

  let startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    for (const cfg of shapeConfigs) {
      renderShape(cfg, computeState(cfg, elapsed));
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);`;
};

const generateStandaloneJsCode = (blocks: Block[], sequences: AnimationSequence[]): string => {
  return `// AnimBlocks Standalone Animation Engine
// Generated at: ${new Date().toISOString()}
// This file works with the accompanying SVG file

${generateJsAnimationCode(blocks, sequences)}
`;
};

export const downloadExportPackage = (
  svgContent: string,
  jsContent: string,
  packageName: string
): void => {
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const jsBlob = new Blob([jsContent], { type: 'application/javascript;charset=utf-8' });

  const svgUrl = URL.createObjectURL(svgBlob);
  const jsUrl = URL.createObjectURL(jsBlob);

  const svgLink = document.createElement('a');
  svgLink.href = svgUrl;
  svgLink.download = `${packageName}.svg`;
  document.body.appendChild(svgLink);
  svgLink.click();
  document.body.removeChild(svgLink);

  const jsLink = document.createElement('a');
  jsLink.href = jsUrl;
  jsLink.download = `${packageName}.js`;
  document.body.appendChild(jsLink);
  jsLink.click();
  document.body.removeChild(jsLink);

  setTimeout(() => {
    URL.revokeObjectURL(svgUrl);
    URL.revokeObjectURL(jsUrl);
  }, 1000);
};

export const generateShareLink = (
  blocks: Block[],
  sequences: AnimationSequence[],
  baseUrl?: string
): string => {
  const exportData = {
    v: 1,
    b: blocks.map(b => ({
      i: b.id,
      t: b.type,
      st: b.shapeType,
      at: b.animationType,
      n: b.name,
      ic: b.icon,
      p: b.params,
      ps: b.parentShapeId
    })),
    s: sequences
  };

  const encoded = btoa(encodeURIComponent(JSON.stringify(exportData)));
  const base = baseUrl ?? window.location.origin + window.location.pathname;
  return `${base}?share=${encoded}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
};
