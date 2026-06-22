export interface FaceComponent {
  id: string;
  type: 'eyes' | 'mouth' | 'blush' | 'hair';
  name: string;
  svgContent: string;
  baseColor: string;
}

export interface CanvasComponent {
  id: string;
  type: string;
  componentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  zIndex: number;
}

export interface CanvasText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export const faceComponents: FaceComponent[] = [
  {
    id: 'eyes-1',
    type: 'eyes',
    name: '圆眼睛',
    baseColor: '#333333',
    svgContent: `
      <ellipse cx="30" cy="50" rx="8" ry="10" fill="currentColor"/>
      <ellipse cx="70" cy="50" rx="8" ry="10" fill="currentColor"/>
      <circle cx="32" cy="48" r="3" fill="white"/>
      <circle cx="72" cy="48" r="3" fill="white"/>
    `
  },
  {
    id: 'eyes-2',
    type: 'eyes',
    name: '笑眯眯',
    baseColor: '#333333',
    svgContent: `
      <path d="M20 50 Q30 40 40 50" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M60 50 Q70 40 80 50" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
    `
  },
  {
    id: 'eyes-3',
    type: 'eyes',
    name: '星星眼',
    baseColor: '#FFD700',
    svgContent: `
      <path d="M30 40 L33 50 L30 60 L27 50 Z M25 50 L35 50" fill="currentColor"/>
      <path d="M70 40 L73 50 L70 60 L67 50 Z M65 50 L75 50" fill="currentColor"/>
    `
  },
  {
    id: 'eyes-4',
    type: 'eyes',
    name: '爱心眼',
    baseColor: '#FF5252',
    svgContent: `
      <path d="M25 45 C25 40 30 38 30 43 C30 38 35 40 35 45 C35 50 30 55 30 55 C30 55 25 50 25 45" fill="currentColor"/>
      <path d="M65 45 C65 40 70 38 70 43 C70 38 75 40 75 45 C75 50 70 55 70 55 C70 55 65 50 65 45" fill="currentColor"/>
    `
  },
  {
    id: 'eyes-5',
    type: 'eyes',
    name: '泪眼',
    baseColor: '#333333',
    svgContent: `
      <ellipse cx="30" cy="48" rx="8" ry="10" fill="currentColor"/>
      <ellipse cx="70" cy="48" rx="8" ry="10" fill="currentColor"/>
      <ellipse cx="25" cy="60" rx="4" ry="6" fill="#64B5F6" opacity="0.8"/>
      <ellipse cx="75" cy="60" rx="4" ry="6" fill="#64B5F6" opacity="0.8"/>
    `
  },
  {
    id: 'eyes-6',
    type: 'eyes',
    name: '酷墨镜',
    baseColor: '#222222',
    svgContent: `
      <rect x="15" y="42" width="30" height="16" rx="4" fill="currentColor"/>
      <rect x="55" y="42" width="30" height="16" rx="4" fill="currentColor"/>
      <rect x="45" y="48" width="10" height="3" fill="currentColor"/>
    `
  },
  {
    id: 'mouth-1',
    type: 'mouth',
    name: '微笑',
    baseColor: '#333333',
    svgContent: `<path d="M30 50 Q50 70 70 50" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>`
  },
  {
    id: 'mouth-2',
    type: 'mouth',
    name: '大笑',
    baseColor: '#333333',
    svgContent: `
      <path d="M25 45 Q50 80 75 45" stroke="currentColor" stroke-width="4" fill="#FF5252" stroke-linejoin="round"/>
      <path d="M32 50 Q50 60 68 50" fill="white" stroke="none"/>
    `
  },
  {
    id: 'mouth-3',
    type: 'mouth',
    name: '嘟嘴',
    baseColor: '#FF80AB',
    svgContent: `<ellipse cx="50" cy="55" rx="12" ry="8" fill="currentColor"/>`
  },
  {
    id: 'mouth-4',
    type: 'mouth',
    name: 'O型嘴',
    baseColor: '#333333',
    svgContent: `<ellipse cx="50" cy="55" rx="8" ry="10" fill="currentColor"/>`
  },
  {
    id: 'mouth-5',
    type: 'mouth',
    name: '撇嘴',
    baseColor: '#333333',
    svgContent: `<path d="M30 60 Q50 50 70 65" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>`
  },
  {
    id: 'mouth-6',
    type: 'mouth',
    name: '吐舌',
    baseColor: '#333333',
    svgContent: `
      <path d="M30 50 Q50 65 70 50" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="62" rx="8" ry="10" fill="#FF5252"/>
    `
  },
  {
    id: 'blush-1',
    type: 'blush',
    name: '小圆脸红',
    baseColor: '#FFB6C1',
    svgContent: `
      <ellipse cx="20" cy="60" rx="10" ry="6" fill="currentColor" opacity="0.7"/>
      <ellipse cx="80" cy="60" rx="10" ry="6" fill="currentColor" opacity="0.7"/>
    `
  },
  {
    id: 'blush-2',
    type: 'blush',
    name: '线条腮红',
    baseColor: '#FF80AB',
    svgContent: `
      <path d="M10 60 L30 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      <path d="M70 60 L90 60" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    `
  },
  {
    id: 'blush-3',
    type: 'blush',
    name: '爱心腮红',
    baseColor: '#FF5252',
    svgContent: `
      <path d="M15 55 C15 52 18 50 20 52 C22 50 25 52 25 55 C25 58 20 62 20 62 C20 62 15 58 15 55" fill="currentColor" opacity="0.8"/>
      <path d="M75 55 C75 52 78 50 80 52 C82 50 85 52 85 55 C85 58 80 62 80 62 C80 62 75 58 75 55" fill="currentColor" opacity="0.8"/>
    `
  },
  {
    id: 'blush-4',
    type: 'blush',
    name: '星星腮红',
    baseColor: '#FFD700',
    svgContent: `
      <path d="M20 55 L22 60 L20 65 L18 60 Z M15 60 L25 60" fill="currentColor" opacity="0.8"/>
      <path d="M80 55 L82 60 L80 65 L78 60 Z M75 60 L85 60" fill="currentColor" opacity="0.8"/>
    `
  },
  {
    id: 'blush-5',
    type: 'blush',
    name: '眼泪',
    baseColor: '#64B5F6',
    svgContent: `
      <path d="M20 55 Q25 65 Q15 65 Z" fill="currentColor" opacity="0.6"/>
      <path d="M80 55 Q85 65 Q75 65 Z" fill="currentColor" opacity="0.6"/>
    `
  },
  {
    id: 'blush-6',
    type: 'blush',
    name: '斑点',
    baseColor: '#8B4513',
    svgContent: `
      <circle cx="18" cy="58" r="3" fill="currentColor" opacity="0.6"/>
      <circle cx="28" cy="62" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="78" cy="58" r="3" fill="currentColor" opacity="0.6"/>
      <circle cx="72" cy="62" r="2" fill="currentColor" opacity="0.6"/>
    `
  },
  {
    id: 'hair-1',
    type: 'hair',
    name: '齐刘海',
    baseColor: '#4A3728',
    svgContent: `<path d="M10 35 Q50 5 90 35 L90 45 Q50 20 10 45 Z" fill="currentColor"/>`
  },
  {
    id: 'hair-2',
    type: 'hair',
    name: '马尾',
    baseColor: '#8B4513',
    svgContent: `
      <path d="M15 40 Q50 0 85 40 L85 50 Q50 25 15 50 Z" fill="currentColor"/>
      <ellipse cx="90" cy="30" rx="8" ry="15" fill="currentColor"/>
    `
  },
  {
    id: 'hair-3',
    type: 'hair',
    name: '爆炸头',
    baseColor: '#2C1810',
    svgContent: `
      <circle cx="50" cy="25" r="35" fill="currentColor"/>
      <circle cx="20" cy="35" r="18" fill="currentColor"/>
      <circle cx="80" cy="35" r="18" fill="currentColor"/>
    `
  },
  {
    id: 'hair-4',
    type: 'hair',
    name: '双马尾',
    baseColor: '#FFB6C1',
    svgContent: `
      <path d="M15 40 Q50 5 85 40 L85 50 Q50 25 15 50 Z" fill="currentColor"/>
      <ellipse cx="8" cy="50" rx="10" ry="25" fill="currentColor"/>
      <ellipse cx="92" cy="50" rx="10" ry="25" fill="currentColor"/>
    `
  },
  {
    id: 'hair-5',
    type: 'hair',
    name: '光头',
    baseColor: '#FFDAB9',
    svgContent: `<path d="M15 45 Q50 15 85 45" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.3"/>`
  },
  {
    id: 'hair-6',
    type: 'hair',
    name: '帽子',
    baseColor: '#E53935',
    svgContent: `
      <path d="M5 45 Q50 5 95 45 Z" fill="currentColor"/>
      <rect x="0" y="40" width="100" height="8" rx="2" fill="#C62828"/>
    `
  }
];

export const componentCategories: { type: 'eyes' | 'mouth' | 'blush' | 'hair'; label: string }[] = [
  { type: 'eyes', label: '眼睛' },
  { type: 'mouth', label: '嘴巴' },
  { type: 'hair', label: '发型' },
  { type: 'blush', label: '腮红' }
];

export function getComponentStyle(component: CanvasComponent): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${component.x}px`,
    top: `${component.y}px`,
    transform: `translate(-50%, -50%) scale(${component.scale}) rotate(${component.rotation}deg)`,
    color: component.color,
    zIndex: component.zIndex,
    width: '100px',
    height: '100px',
    pointerEvents: 'none'
  };
}

export function getTextStyle(text: CanvasText): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${text.x}px`,
    top: `${text.y}px`,
    transform: 'translate(-50%, -50%)',
    fontSize: `${text.fontSize}px`,
    color: text.color,
    fontFamily: text.fontFamily,
    fontWeight: 'bold',
    zIndex: 999,
    whiteSpace: 'nowrap',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
    pointerEvents: 'none'
  };
}

export function renderComponentSVG(comp: FaceComponent): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${comp.svgContent}</svg>`;
}

export function getComponentByTypeAndId(type: string, componentId: string): FaceComponent | undefined {
  return faceComponents.find((c) => c.type === type && c.id === componentId);
}
