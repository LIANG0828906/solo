import type { CategoryType, PresetElement } from '@/types';

const NEON_MAGENTA = '#ff2d95';
const NEON_CYAN = '#00f0ff';
const NEON_GREEN = '#39ff14';
const NEON_ORANGE = '#ffb347';
const NEON_PURPLE = '#c77dff';

const basicShapes: PresetElement[] = [
  {
    id: 'shape-circle',
    category: 'basic',
    name: '圆形',
    type: 'shape',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultColor: NEON_MAGENTA,
    svgContent: `<circle cx="50%" cy="50%" r="48%" fill="currentColor"/>`,
  },
  {
    id: 'shape-square',
    category: 'basic',
    name: '正方形',
    type: 'shape',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultColor: NEON_CYAN,
    svgContent: `<rect x="4%" y="4%" width="92%" height="92%" rx="6" fill="currentColor"/>`,
  },
  {
    id: 'shape-triangle',
    category: 'basic',
    name: '三角形',
    type: 'shape',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultColor: NEON_GREEN,
    svgContent: `<polygon points="50,6 96,92 4,92" fill="currentColor"/>`,
  },
  {
    id: 'shape-hexagon',
    category: 'basic',
    name: '六边形',
    type: 'shape',
    defaultWidth: 180,
    defaultHeight: 160,
    defaultColor: NEON_PURPLE,
    svgContent: `<polygon points="25,4 75,4 98,50 75,96 25,96 2,50" fill="currentColor"/>`,
  },
  {
    id: 'shape-star',
    category: 'basic',
    name: '星形',
    type: 'shape',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultColor: NEON_ORANGE,
    svgContent: `<polygon points="50,3 61,38 98,38 68,59 79,94 50,73 21,94 32,59 2,38 39,38" fill="currentColor"/>`,
  },
  {
    id: 'shape-ring',
    category: 'basic',
    name: '圆环',
    type: 'shape',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultColor: NEON_CYAN,
    svgContent: `<circle cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor" stroke-width="12"/>`,
  },
  {
    id: 'shape-diamond',
    category: 'basic',
    name: '菱形',
    type: 'shape',
    defaultWidth: 140,
    defaultHeight: 180,
    defaultColor: NEON_MAGENTA,
    svgContent: `<polygon points="50,3 97,50 50,97 3,50" fill="currentColor"/>`,
  },
];

const lineDecorations: PresetElement[] = [
  {
    id: 'line-h',
    category: 'line',
    name: '横线',
    type: 'line',
    defaultWidth: 240,
    defaultHeight: 12,
    defaultColor: NEON_CYAN,
    svgContent: `<rect x="0" y="40%" width="100%" height="20%" rx="4" fill="currentColor"/>`,
  },
  {
    id: 'line-v',
    category: 'line',
    name: '竖线',
    type: 'line',
    defaultWidth: 12,
    defaultHeight: 240,
    defaultColor: NEON_MAGENTA,
    svgContent: `<rect x="40%" y="0" width="20%" height="100%" rx="4" fill="currentColor"/>`,
  },
  {
    id: 'line-diagonal',
    category: 'line',
    name: '斜线',
    type: 'line',
    defaultWidth: 200,
    defaultHeight: 200,
    defaultColor: NEON_GREEN,
    svgContent: `<line x1="4" y1="196" x2="196" y2="4" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>`,
  },
  {
    id: 'line-arrow',
    category: 'line',
    name: '箭头',
    type: 'line',
    defaultWidth: 220,
    defaultHeight: 100,
    defaultColor: NEON_ORANGE,
    svgContent: `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs><line x1="10" y1="50" x2="190" y2="50" stroke="currentColor" stroke-width="10" stroke-linecap="round" marker-end="url(#arr)"/>`,
  },
  {
    id: 'line-cross',
    category: 'line',
    name: '十字线',
    type: 'line',
    defaultWidth: 160,
    defaultHeight: 160,
    defaultColor: NEON_PURPLE,
    svgContent: `<line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    id: 'line-radial',
    category: 'line',
    name: '放射线',
    type: 'line',
    defaultWidth: 180,
    defaultHeight: 180,
    defaultColor: NEON_CYAN,
    svgContent: `<g stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="90" y1="10" x2="90" y2="38"/><line x1="90" y1="142" x2="90" y2="170"/><line x1="10" y1="90" x2="38" y2="90"/><line x1="142" y1="90" x2="170" y2="90"/><line x1="34" y1="34" x2="54" y2="54"/><line x1="126" y1="126" x2="146" y2="146"/><line x1="146" y1="34" x2="126" y2="54"/><line x1="54" y1="126" x2="34" y2="146"/></g>`,
  },
  {
    id: 'line-frame',
    category: 'line',
    name: '方框',
    type: 'line',
    defaultWidth: 200,
    defaultHeight: 160,
    defaultColor: NEON_MAGENTA,
    svgContent: `<rect x="8" y="8" width="184" height="144" rx="8" fill="none" stroke="currentColor" stroke-width="6"/>`,
  },
  {
    id: 'line-wave',
    category: 'line',
    name: '波浪线',
    type: 'line',
    defaultWidth: 260,
    defaultHeight: 80,
    defaultColor: NEON_GREEN,
    svgContent: `<path d="M10 40 Q 40 10, 70 40 T 130 40 T 190 40 T 250 40" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
  },
];

const textTitles: PresetElement[] = [
  {
    id: 'text-neon',
    category: 'text',
    name: 'NEON',
    type: 'text',
    defaultWidth: 260,
    defaultHeight: 90,
    defaultColor: NEON_MAGENTA,
    svgContent: `<text x="50%" y="68%" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="900" font-size="72" fill="currentColor" letter-spacing="4">NEON</text>`,
  },
  {
    id: 'text-cyber',
    category: 'text',
    name: 'CYBER',
    type: 'text',
    defaultWidth: 300,
    defaultHeight: 90,
    defaultColor: NEON_CYAN,
    svgContent: `<text x="50%" y="68%" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="900" font-size="68" fill="currentColor" letter-spacing="4">CYBER</text>`,
  },
  {
    id: 'text-2088',
    category: 'text',
    name: '2088',
    type: 'text',
    defaultWidth: 240,
    defaultHeight: 90,
    defaultColor: NEON_GREEN,
    svgContent: `<text x="50%" y="68%" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="900" font-size="80" fill="currentColor" letter-spacing="6">2088</text>`,
  },
  {
    id: 'text-future',
    category: 'text',
    name: '未来城市',
    type: 'text',
    defaultWidth: 320,
    defaultHeight: 100,
    defaultColor: NEON_PURPLE,
    svgContent: `<defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ff2d95"/><stop offset="100%" stop-color="#00f0ff"/></linearGradient></defs><text x="50%" y="65%" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="800" font-size="52" fill="currentColor" letter-spacing="8">未来城市</text>`,
  },
  {
    id: 'text-sign',
    category: 'text',
    name: 'STREET',
    type: 'text',
    defaultWidth: 300,
    defaultHeight: 90,
    defaultColor: NEON_ORANGE,
    svgContent: `<text x="50%" y="68%" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="900" font-size="64" fill="currentColor" letter-spacing="6">STREET</text>`,
  },
  {
    id: 'text-punk',
    category: 'text',
    name: 'PUNK',
    type: 'text',
    defaultWidth: 260,
    defaultHeight: 90,
    defaultColor: NEON_MAGENTA,
    svgContent: `<text x="50%" y="68%" text-anchor="middle" font-family="Orbitron, sans-serif" font-weight="900" font-size="76" fill="currentColor" letter-spacing="8">PUNK</text>`,
  },
];

const textures: PresetElement[] = [
  {
    id: 'tex-scanlines',
    category: 'texture',
    name: '扫描线',
    type: 'texture',
    defaultWidth: 320,
    defaultHeight: 240,
    defaultColor: NEON_CYAN,
    svgContent: `<defs><pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="currentColor" opacity="0.35"/></pattern></defs><rect width="100%" height="100%" fill="url(#sl)"/>`,
  },
  {
    id: 'tex-noise',
    category: 'texture',
    name: '噪点块',
    type: 'texture',
    defaultWidth: 280,
    defaultHeight: 200,
    defaultColor: NEON_MAGENTA,
    svgContent: `<defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 0.17  0 0 0 0 0.58  0 0 0 0.6 0"/></filter></defs><rect width="100%" height="100%" filter="url(#n)" opacity="0.75"/>`,
  },
  {
    id: 'tex-glitchbars',
    category: 'texture',
    name: '故障条',
    type: 'texture',
    defaultWidth: 300,
    defaultHeight: 220,
    defaultColor: NEON_GREEN,
    svgContent: `<g fill="currentColor" opacity="0.7"><rect x="0" y="18" width="100%" height="6"/><rect x="20" y="54" width="70%" height="4"/><rect x="0" y="92" width="85%" height="8"/><rect x="50" y="138" width="60%" height="3"/><rect x="0" y="176" width="92%" height="5"/></g>`,
  },
  {
    id: 'tex-halo',
    category: 'texture',
    name: '光晕',
    type: 'texture',
    defaultWidth: 240,
    defaultHeight: 240,
    defaultColor: NEON_CYAN,
    svgContent: `<defs><radialGradient id="hg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="currentColor" stop-opacity="0.9"/><stop offset="45%" stop-color="currentColor" stop-opacity="0.3"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><circle cx="50%" cy="50%" r="50%" fill="url(#hg)"/>`,
  },
  {
    id: 'tex-vhs',
    category: 'texture',
    name: 'VHS信号条',
    type: 'texture',
    defaultWidth: 320,
    defaultHeight: 180,
    defaultColor: NEON_PURPLE,
    svgContent: `<defs><linearGradient id="vh" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ff2d95"/><stop offset="50%" stop-color="#00f0ff"/><stop offset="100%" stop-color="#39ff14"/></linearGradient></defs><g><rect x="0" y="30" width="100%" height="3" fill="url(#vh)" opacity="0.9"/><rect x="0" y="72" width="100%" height="5" fill="url(#vh)" opacity="0.7"/><rect x="0" y="118" width="100%" height="2" fill="url(#vh)" opacity="0.85"/><rect x="0" y="152" width="100%" height="4" fill="url(#vh)" opacity="0.6"/></g>`,
  },
];

export const ALL_PRESETS: PresetElement[] = [
  ...basicShapes,
  ...lineDecorations,
  ...textTitles,
  ...textures,
];

export const CATEGORIES: { key: CategoryType; label: string }[] = [
  { key: 'basic', label: '基本形状' },
  { key: 'line', label: '装饰线条' },
  { key: 'text', label: '文字标题' },
  { key: 'texture', label: '噪点纹理' },
];

export const NEON_COLORS: string[] = [
  NEON_MAGENTA,
  NEON_CYAN,
  NEON_GREEN,
  NEON_ORANGE,
  NEON_PURPLE,
];

export function getPresetsByCategory(category: CategoryType): PresetElement[] {
  return ALL_PRESETS.filter((p) => p.category === category);
}

export function getPresetById(id: string): PresetElement | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}

export function getPresetsMap(): Record<string, PresetElement> {
  const map: Record<string, PresetElement> = {};
  ALL_PRESETS.forEach((p) => (map[p.id] = p));
  return map;
}
