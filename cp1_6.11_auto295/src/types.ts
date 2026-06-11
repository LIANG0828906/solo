export type IngredientType = 'radish' | 'cabbage' | 'pork' | 'fish';
export type SpiceType = 'starAnise' | 'cinnamon' | 'pepper' | 'ginger' | 'scallion';
export type CutStyle = 'dice' | 'slice' | 'strip' | 'chunk';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation?: number;
  vr?: number;
  shape?: 'circle' | 'star' | 'strip' | 'curl';
}

export interface Ingredient {
  id: string;
  type: IngredientType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseColor: string;
  cookedColor: string;
  cutPieces: CutPiece[];
  cookingProgress: number;
  inPot: boolean;
  dragging: boolean;
  originalShape: 'round' | 'oval' | 'rect' | 'leaf';
}

export interface CutPiece {
  id: string;
  parentId: string;
  x: number;
  y: number;
  localX: number;
  localY: number;
  width: number;
  height: number;
  color: string;
  textureAngle: number;
  cookingProgress: number;
  inPot: boolean;
  potX: number;
  potY: number;
  dragging: boolean;
}

export interface SpiceAura {
  type: SpiceType;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Flame {
  x: number;
  baseY: number;
  height: number;
  phase: number;
  speed: number;
  width: number;
}

export interface KnifeState {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  dragging: boolean;
  flashTimer: number;
  cutting: boolean;
  cutStart: Vec2 | null;
  cutEnd: Vec2 | null;
}

export interface PotState {
  x: number;
  y: number;
  radius: number;
  cooking: boolean;
  stirAngle: number;
  stirDirection: number;
}

export const COLORS = {
  paperYellow: '#EDE4D4',
  brickGray: '#8B8B83',
  woodBrown: '#5D3A1A',
  boardYellow: '#F5DEB3',
  knifeSilver: '#C0C0C0',
  handleRed: '#8B2500',
  potDark: '#2F2F2F',
  flameOrange: '#FF8C00',
  flameRed: '#FF0000',
  tomatoRed: '#FF6347',
  wallCream: '#FFF8DC',
  inkBlack: '#2F2F2F'
} as const;

export const INGREDIENT_PRESETS: Record<IngredientType, Omit<Ingredient, 'id' | 'x' | 'y' | 'cutPieces' | 'cookingProgress' | 'inPot' | 'dragging'>> = {
  radish: {
    type: 'radish',
    name: '白萝卜',
    width: 80,
    height: 80,
    baseColor: '#FAFAFA',
    cookedColor: '#F5F5DC',
    originalShape: 'round'
  },
  cabbage: {
    type: 'cabbage',
    name: '白菜',
    width: 90,
    height: 85,
    baseColor: '#90EE90',
    cookedColor: '#8FBC8F',
    originalShape: 'leaf'
  },
  pork: {
    type: 'pork',
    name: '猪肉',
    width: 85,
    height: 60,
    baseColor: '#F08080',
    cookedColor: '#8B4513',
    originalShape: 'oval'
  },
  fish: {
    type: 'fish',
    name: '鲤鱼',
    width: 110,
    height: 55,
    baseColor: '#E8E8E8',
    cookedColor: '#DAA520',
    originalShape: 'oval'
  }
};

export const SPICE_PRESETS: Record<SpiceType, { name: string; color: string; auraColor: string; shape: Particle['shape'] }> = {
  starAnise: { name: '八角', color: '#8B4513', auraColor: 'rgba(139, 69, 19, 0.35)', shape: 'star' },
  cinnamon: { name: '桂皮', color: '#A0522D', auraColor: 'rgba(160, 82, 45, 0.3)', shape: 'curl' },
  pepper: { name: '花椒', color: '#556B2F', auraColor: 'rgba(85, 107, 47, 0.3)', shape: 'circle' },
  ginger: { name: '生姜', color: '#DEB887', auraColor: 'rgba(222, 184, 135, 0.35)', shape: 'strip' },
  scallion: { name: '葱花', color: '#228B22', auraColor: 'rgba(34, 139, 34, 0.3)', shape: 'strip' }
};
