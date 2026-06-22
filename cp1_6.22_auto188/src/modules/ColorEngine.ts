export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export type GradientType = 'linear' | 'radial' | 'conic';
export type RadialShape = 'circle' | 'ellipse';

export interface GradientConfig {
  type: GradientType;
  stops: ColorStop[];
  angle: number;
  radialShape?: RadialShape;
  centerX?: number;
  centerY?: number;
}

export interface GradientPreset {
  name: string;
  config: GradientConfig;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function formatColorStops(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return sorted.map((s) => `${s.color} ${s.position.toFixed(1)}%`).join(', ');
}

export function generateCSSGradient(config: GradientConfig): string {
  const stopsStr = formatColorStops(config.stops);

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle}deg, ${stopsStr})`;
    case 'radial': {
      const shape = config.radialShape || 'circle';
      const cx = config.centerX ?? 50;
      const cy = config.centerY ?? 50;
      return `radial-gradient(${shape} at ${cx}% ${cy}%, ${stopsStr})`;
    }
    case 'conic': {
      const cx = config.centerX ?? 50;
      const cy = config.centerY ?? 50;
      return `conic-gradient(from ${config.angle}deg at ${cx}% ${cy}%, ${stopsStr})`;
    }
  }
}

export function generateSVGGradient(config: GradientConfig, id: string): string {
  const sorted = [...config.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sorted
    .map((s) => `      <stop offset="${s.position.toFixed(1)}%" stop-color="${s.color}" />`)
    .join('\n');

  if (config.type === 'linear') {
    const rad = (config.angle * Math.PI) / 180;
    const x1 = (50 - 50 * Math.sin(rad)).toFixed(1);
    const y1 = (50 + 50 * Math.cos(rad)).toFixed(1);
    const x2 = (50 + 50 * Math.sin(rad)).toFixed(1);
    const y2 = (50 - 50 * Math.cos(rad)).toFixed(1);
    return `<defs>
    <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
${stopsStr}
    </linearGradient>
  </defs>`;
  } else if (config.type === 'radial') {
    const cx = config.centerX ?? 50;
    const cy = config.centerY ?? 50;
    return `<defs>
    <radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="50%" fx="${cx}%" fy="${cy}%">
${stopsStr}
    </radialGradient>
  </defs>`;
  } else {
    return `<defs>
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
${stopsStr}
    </linearGradient>
  </defs>`;
  }
}

export function generateSVGExample(config: GradientConfig): string {
  const gradientId = 'gradient1';
  const defs = generateSVGGradient(config, gradientId);
  return `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="400" height="200" fill="url(#${gradientId})" rx="8" />
</svg>`;
}

export function generateCSSCode(config: GradientConfig): string {
  const gradient = generateCSSGradient(config);
  return `.gradient-element {
  background-image: ${gradient};
}`;
}

export const DEFAULT_PRESETS: GradientPreset[] = [
  {
    name: '日落橙',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { id: 's1', color: '#FF6B35', position: 0 },
        { id: 's2', color: '#F7C59F', position: 50 },
        { id: 's3', color: '#FF4444', position: 100 },
      ],
    },
  },
  {
    name: '海洋蓝',
    config: {
      type: 'linear',
      angle: 180,
      stops: [
        { id: 's1', color: '#0077B6', position: 0 },
        { id: 's2', color: '#00B4D8', position: 50 },
        { id: 's3', color: '#90E0EF', position: 100 },
      ],
    },
  },
  {
    name: '极光绿',
    config: {
      type: 'linear',
      angle: 45,
      stops: [
        { id: 's1', color: '#06D6A0', position: 0 },
        { id: 's2', color: '#118AB2', position: 50 },
        { id: 's3', color: '#073B4C', position: 100 },
      ],
    },
  },
  {
    name: '晚霞紫',
    config: {
      type: 'radial',
      angle: 0,
      radialShape: 'circle',
      centerX: 50,
      centerY: 50,
      stops: [
        { id: 's1', color: '#7209B7', position: 0 },
        { id: 's2', color: '#B5179E', position: 50 },
        { id: 's3', color: '#F72585', position: 100 },
      ],
    },
  },
  {
    name: '金属银',
    config: {
      type: 'linear',
      angle: 90,
      stops: [
        { id: 's1', color: '#ADB5BD', position: 0 },
        { id: 's2', color: '#DEE2E6', position: 50 },
        { id: 's3', color: '#6C757D', position: 100 },
      ],
    },
  },
  {
    name: '荧光粉',
    config: {
      type: 'conic',
      angle: 0,
      centerX: 50,
      centerY: 50,
      stops: [
        { id: 's1', color: '#FF006E', position: 0 },
        { id: 's2', color: '#FB5607', position: 50 },
        { id: 's3', color: '#FFBE0B', position: 100 },
      ],
    },
  },
];

export const DEFAULT_CONFIG: GradientConfig = {
  type: 'linear',
  angle: 135,
  stops: [
    { id: 'stop1', color: '#6366F1', position: 0 },
    { id: 'stop2', color: '#EC4899', position: 50 },
    { id: 'stop3', color: '#F59E0B', position: 100 },
  ],
  radialShape: 'circle',
  centerX: 50,
  centerY: 50,
};
