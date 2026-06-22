import { v4 as uuidv4 } from 'uuid';
import { Building } from '../modules/editor/editorStore';

export type TemplateName = 'newyork' | 'shanghai' | 'future' | 'classic' | 'nature';

export interface Template {
  name: TemplateName;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  generate: () => Building[];
}

const CANVAS_HEIGHT = 600;
const GROUND_Y = CANVAS_HEIGHT - 60;

const building = (
  x: number,
  width: number,
  height: number,
  color: string
): Building => ({
  id: uuidv4(),
  x,
  y: GROUND_Y - height,
  width,
  height,
  color,
});

const newyork = (): Building[] => {
  const result: Building[] = [];
  const palette = ['#8b8d91', '#6b7280', '#9ca3af', '#7f8c8d', '#a0a3a8'];
  const widths = [35, 45, 55, 60, 40, 50, 65, 30];
  const heights = [180, 260, 300, 220, 280, 200, 240, 150, 190, 270];
  let x = 40;

  for (let i = 0; i < 12; i++) {
    const w = widths[i % widths.length] + Math.random() * 20 - 10;
    const h = heights[i % heights.length] + Math.random() * 50 - 25;
    const c = palette[i % palette.length];
    result.push(building(x, w, Math.max(80, h), c));
    x += w + 15 + Math.random() * 10;
  }

  result.push(building(450, 55, 340, '#5a5e66'));
  result.push(building(550, 45, 280, '#6b7280'));
  return result;
};

const shanghai = (): Building[] => {
  const result: Building[] = [];
  const palette = ['#5b4b8a', '#7b68ee', '#483d8b', '#6a5acd', '#836fff', '#9370db'];
  const widths = [40, 50, 35, 60, 45, 55, 30, 65, 50];
  let x = 30;

  const heights = [160, 230, 200, 320, 190, 290, 170, 340, 250, 210, 180, 270];

  for (let i = 0; i < 11; i++) {
    const w = widths[i % widths.length] + Math.random() * 15 - 7;
    const h = heights[i % heights.length] + Math.random() * 40 - 20;
    const c = palette[i % palette.length];
    result.push(building(x, w, Math.max(70, h), c));
    x += w + 12 + Math.random() * 8;
  }

  result.push(building(350, 30, 400, '#daa520'));
  result.push(building(385, 70, 320, '#b8860b'));
  result.push(building(600, 55, 360, '#ffd700'));
  return result;
};

const future = (): Building[] => {
  const result: Building[] = [];
  const palette = ['#00ffff', '#1e90ff', '#00ced1', '#40e0d0', '#20b2aa', '#48d1cc'];
  const widths = [30, 50, 40, 70, 45, 35, 60, 55, 25, 65];
  let x = 20;

  for (let i = 0; i < 14; i++) {
    const w = widths[i % widths.length];
    const baseH = 120 + (i % 5) * 45;
    const h = baseH + Math.random() * 80;
    const c = palette[i % palette.length];
    result.push(building(x, w, Math.min(380, h), c));
    x += w + 10 + Math.random() * 12;
  }

  result.push(building(280, 80, 420, '#00ffff'));
  result.push(building(450, 45, 380, '#7b68ee'));
  result.push(building(560, 75, 350, '#4169e1'));
  return result;
};

const classic = (): Building[] => {
  const result: Building[] = [];
  const palette = ['#deb887', '#d2b48c', '#f5deb3', '#bc8f8f', '#cd853f', '#daa520'];
  const widths = [45, 55, 65, 50, 60, 40, 70, 45];
  const heights = [130, 100, 85, 110, 95, 140, 120, 75, 105, 115, 90, 130];
  let x = 30;

  for (let i = 0; i < 12; i++) {
    const w = widths[i % widths.length] + Math.random() * 15 - 7;
    const h = heights[i % heights.length] + Math.random() * 25 - 12;
    const c = palette[i % palette.length];
    result.push(building(x, w, Math.max(55, h), c));
    x += w + 18 + Math.random() * 8;
  }

  result.push(building(500, 80, 160, '#b8860b'));
  result.push(building(620, 60, 140, '#cd853f'));
  return result;
};

const nature = (): Building[] => {
  const result: Building[] = [];
  const palette = ['#90ee90', '#3cb371', '#8fbc8f', '#2e8b57', '#98fb98', '#66cdaa'];
  const widths = [40, 55, 50, 45, 60, 35, 50, 40, 65];
  let x = 30;

  const heights = [90, 110, 75, 130, 85, 100, 70, 120, 95, 115, 80, 105];

  for (let i = 0; i < 13; i++) {
    const w = widths[i % widths.length];
    const h = heights[i % heights.length] + Math.random() * 30 - 15;
    const c = palette[i % palette.length];
    result.push(building(x, w, Math.max(50, h), c));
    x += w + 15 + Math.random() * 15;
  }

  result.push(building(400, 70, 180, '#228b22'));
  result.push(building(550, 55, 150, '#32cd32'));
  return result;
};

export const TEMPLATES: Record<TemplateName, Template> = {
  newyork: {
    name: 'newyork',
    displayName: '纽约式',
    description: '复古Art Deco风格，灰色调石材质感',
    icon: '🗽',
    color: '#6b7280',
    generate: newyork,
  },
  shanghai: {
    name: 'shanghai',
    displayName: '上海式',
    description: '东方明珠紫金流光，现代霓虹都市',
    icon: '🌆',
    color: '#7b68ee',
    generate: shanghai,
  },
  future: {
    name: 'future',
    displayName: '未来风',
    description: '赛博朋克科技感，冷蓝霓虹发光',
    icon: '🚀',
    color: '#00ffff',
    generate: future,
  },
  classic: {
    name: 'classic',
    displayName: '古典风',
    description: '欧洲传统巴洛克，暖棕石砌建筑',
    icon: '🏛️',
    color: '#deb887',
    generate: classic,
  },
  nature: {
    name: 'nature',
    displayName: '自然风',
    description: '绿色生态垂直森林，融入自然环境',
    icon: '🌳',
    color: '#3cb371',
    generate: nature,
  },
};

export const getTemplateNames = (): TemplateName[] =>
  Object.keys(TEMPLATES) as TemplateName[];

export const generateTemplate = (name: TemplateName): Building[] => {
  return TEMPLATES[name].generate();
};

export interface SavedScheme {
  id: string;
  name: string;
  buildings: Building[];
  createdAt: number;
  thumbnail?: string;
}
