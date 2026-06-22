import type { PatternType, PatternLayerConfig, WallpaperConfig } from '../canvas/CanvasRenderer';

export type Template = {
  id: string;
  name: string;
  description: string;
  config: WallpaperConfig;
  previewColors: string[];
};

const STORAGE_KEY = 'wallpaper_custom_templates';

const presetTemplates: Template[] = [
  {
    id: 'aurora',
    name: '极光',
    description: '极光般的径向渐变，纯净而梦幻',
    config: {
      templateId: 'aurora',
      primaryColor: '#00d2ff',
      secondaryColor: '#928dab',
      gradientAngle: 0,
      gradientType: 'radial',
      patterns: [],
    },
    previewColors: ['#00d2ff', '#928dab'],
  },
  {
    id: 'geometric-layers',
    name: '几何叠层',
    description: '六边形网格叠加的几何美感',
    config: {
      templateId: 'geometric-layers',
      primaryColor: '#ff6b6b',
      secondaryColor: '#556270',
      gradientAngle: 135,
      gradientType: 'linear',
      patterns: [
        { type: 'hexagons', opacity: 0.4, scale: 1.2, rotation: 0, enabled: true },
        { type: 'hexagons', opacity: 0.2, scale: 0.6, rotation: 30, enabled: true },
      ],
    },
    previewColors: ['#ff6b6b', '#556270'],
  },
  {
    id: 'micro-texture',
    name: '微纹理',
    description: '细腻的圆点纹理，低调而有质感',
    config: {
      templateId: 'micro-texture',
      primaryColor: '#2c3e50',
      secondaryColor: '#4ca1af',
      gradientAngle: 180,
      gradientType: 'linear',
      patterns: [
        { type: 'dots', opacity: 0.3, scale: 0.5, rotation: 0, enabled: true },
      ],
    },
    previewColors: ['#2c3e50', '#4ca1af'],
  },
  {
    id: 'ripples',
    name: '波纹',
    description: '多层波纹交织的律动感',
    config: {
      templateId: 'ripples',
      primaryColor: '#6441a5',
      secondaryColor: '#2a0845',
      gradientAngle: 0,
      gradientType: 'radial',
      patterns: [
        { type: 'waves', opacity: 0.35, scale: 1.0, rotation: 0, enabled: true },
        { type: 'waves', opacity: 0.2, scale: 0.7, rotation: 90, enabled: true },
      ],
    },
    previewColors: ['#6441a5', '#2a0845'],
  },
  {
    id: 'diamond-grid',
    name: '菱形网格',
    description: '三角形与六边形组合的网格图案',
    config: {
      templateId: 'diamond-grid',
      primaryColor: '#f7971e',
      secondaryColor: '#ffd200',
      gradientAngle: 45,
      gradientType: 'linear',
      patterns: [
        { type: 'triangles', opacity: 0.3, scale: 1.0, rotation: 0, enabled: true },
        { type: 'hexagons', opacity: 0.2, scale: 0.8, rotation: 0, enabled: true },
      ],
    },
    previewColors: ['#f7971e', '#ffd200'],
  },
  {
    id: 'deep-space',
    name: '深空',
    description: '深邃的星空般点点光芒',
    config: {
      templateId: 'deep-space',
      primaryColor: '#0f0c29',
      secondaryColor: '#302b63',
      gradientAngle: 0,
      gradientType: 'radial',
      patterns: [
        { type: 'dots', opacity: 0.5, scale: 0.3, rotation: 0, enabled: true },
      ],
    },
    previewColors: ['#0f0c29', '#302b63'],
  },
  {
    id: 'coral-reef',
    name: '珊瑚礁',
    description: '柔和的波纹与圆点构成海底世界',
    config: {
      templateId: 'coral-reef',
      primaryColor: '#ff9a9e',
      secondaryColor: '#fecfef',
      gradientAngle: 160,
      gradientType: 'linear',
      patterns: [
        { type: 'waves', opacity: 0.3, scale: 0.8, rotation: 15, enabled: true },
        { type: 'waves', opacity: 0.15, scale: 1.1, rotation: -20, enabled: true },
        { type: 'dots', opacity: 0.2, scale: 0.6, rotation: 0, enabled: true },
      ],
    },
    previewColors: ['#ff9a9e', '#fecfef'],
  },
  {
    id: 'minimal-lines',
    name: '极简线条',
    description: '极低透明度的三角线条，简约优雅',
    config: {
      templateId: 'minimal-lines',
      primaryColor: '#e8e8e8',
      secondaryColor: '#c4c4c4',
      gradientAngle: 90,
      gradientType: 'linear',
      patterns: [
        { type: 'triangles', opacity: 0.1, scale: 1.0, rotation: 0, enabled: true },
      ],
    },
    previewColors: ['#e8e8e8', '#c4c4c4'],
  },
];

export function getPresetTemplates(): Template[] {
  return presetTemplates;
}

export function getTemplateById(id: string): Template | undefined {
  const preset = presetTemplates.find((t) => t.id === id);
  if (preset) return preset;
  const customs = getCustomTemplates();
  return customs.find((t) => t.id === id);
}

export function saveCustomTemplate(template: Template): void {
  const customs = getCustomTemplates();
  const idx = customs.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    customs[idx] = template;
  } else {
    customs.push(template);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function getCustomTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Template[];
  } catch {
    return [];
  }
}

export function deleteCustomTemplate(id: string): void {
  const customs = getCustomTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}
