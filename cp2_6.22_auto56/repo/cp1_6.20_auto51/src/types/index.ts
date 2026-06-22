export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface Palette {
  id: string;
  name: string;
  colors: string[];
  baseColor: string;
  harmonyRule: HarmonyRule;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  paletteId?: string;
  colorIndex?: number;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: ProjectMember[];
  palettes: string[];
  comments: Comment[];
  createdAt: string;
}

export type HarmonyRule = 
  | 'complementary' 
  | 'analogous' 
  | 'triadic' 
  | 'splitComplementary' 
  | 'doubleComplementary';

export type ColorBlindMode = 
  | 'normal' 
  | 'protanopia' 
  | 'deuteranopia' 
  | 'tritanopia' 
  | 'achromatopsia';

export const HARMONY_RULES: { value: HarmonyRule; label: string; description: string }[] = [
  { value: 'complementary', label: '互补色', description: '色环上相对的颜色' },
  { value: 'analogous', label: '类似色', description: '色环上相邻的颜色' },
  { value: 'triadic', label: '三角配色', description: '色环上等距的三种颜色' },
  { value: 'splitComplementary', label: '分裂互补', description: '互补色的变体' },
  { value: 'doubleComplementary', label: '双互补色', description: '两对互补色' },
];

export const COLOR_BLIND_MODES: { value: ColorBlindMode; label: string }[] = [
  { value: 'normal', label: '正常视觉' },
  { value: 'protanopia', label: '红色盲' },
  { value: 'deuteranopia', label: '绿色盲' },
  { value: 'tritanopia', label: '蓝黄色盲' },
  { value: 'achromatopsia', label: '全色盲' },
];
