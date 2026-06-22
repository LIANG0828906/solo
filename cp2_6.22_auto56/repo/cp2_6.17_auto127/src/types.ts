export type ColorKey = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'cyan';
export type IconKey = 'star' | 'circle' | 'square' | 'triangle';
export type TileState = 'idle' | 'correct' | 'wrong' | 'matched';
export type GamePhase = 'idle' | 'playing' | 'round_end' | 'game_over';
export type MatchType = 'color' | 'icon' | 'both';

export const COLOR_HEX: Record<ColorKey, string> = {
  red: '#FF3355',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#FACC15',
  purple: '#A855F7',
  cyan: '#06B6D4',
};

export const COLOR_LABEL: Record<ColorKey, string> = {
  red: '红色',
  blue: '蓝色',
  green: '绿色',
  yellow: '黄色',
  purple: '紫色',
  cyan: '青色',
};

export const ICON_LABEL: Record<IconKey, string> = {
  star: '星形',
  circle: '圆形',
  square: '方形',
  triangle: '三角形',
};

export const ALL_COLORS: ColorKey[] = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
export const ALL_ICONS: IconKey[] = ['star', 'circle', 'square', 'triangle'];

export interface Tile {
  id: string;
  color: ColorKey;
  icon: IconKey;
  row: number;
  col: number;
  state: TileState;
}

export interface MatchTarget {
  type: MatchType;
  color?: ColorKey;
  icon?: IconKey;
  description: string;
}

export interface LevelConfig {
  roundDuration: number;
  colorCount: number;
  iconCount: number;
  allowBothMatch: boolean;
}

export function getLevelConfig(level: number): LevelConfig {
  const baseDuration = 5000;
  const durationReduce = Math.min((level - 1) * 500, 3000);
  const colorCount = Math.min(2 + Math.floor((level - 1) / 2), 6);
  const iconCount = Math.min(2 + Math.floor((level - 1) / 2), 4);
  const allowBothMatch = level >= 3;
  return {
    roundDuration: Math.max(baseDuration - durationReduce, 2000),
    colorCount,
    iconCount,
    allowBothMatch,
  };
}
