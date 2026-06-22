export const COLOR_PALETTE = [
  '#4A90D9',
  '#50C878',
  '#FF6B6B',
  '#FFD93D',
  '#C084FC',
  '#FF8C42',
  '#6BCB77',
  '#A0D2DB',
  '#F4A261',
  '#E76F51',
  '#264653',
  '#2A9D8F',
];

export const DEFAULT_BUBBLE_DIAMETER = 100;
export const MIN_BUBBLE_DIAMETER = 60;
export const MAX_BUBBLE_DIAMETER = 160;

export const OPACITY_MIN = 0.2;
export const OPACITY_MAX = 0.8;
export const DEFAULT_OPACITY = 0.6;

export const GRID_SIZE = 40;
export const GRID_COLOR = '#DADDE1';
export const CANVAS_BG = '#F0F2F5';

export const PRIMARY_COLOR = '#1A365D';
export const HOVER_PRIMARY = '#2B6CB0';
export const ACCENT_GREEN = '#2F855A';

export const CONNECTION_COLOR = '#6C757D';
export const CONNECTION_WIDTH = 1.5;

export const SELECT_BORDER = '#333333';
export const SELECT_WIDTH = 2;

export const MAX_NAME_LENGTH = 8;

export const COLOR_EMOTION_MAP: Record<string, { category: string; tag: string }> = {
  '#4A90D9': { category: 'order', tag: '秩序/理性' },
  '#50C878': { category: 'nature', tag: '生态/自然' },
  '#FF6B6B': { category: 'warning', tag: '警示/活力' },
  '#FFD93D': { category: 'warm', tag: '温暖/活力' },
  '#C084FC': { category: 'culture', tag: '文化/创意' },
  '#FF8C42': { category: 'commerce', tag: '商业/活跃' },
  '#6BCB77': { category: 'nature', tag: '生态/自然' },
  '#A0D2DB': { category: 'public', tag: '公共/开放' },
  '#F4A261': { category: 'warm', tag: '温暖/活力' },
  '#E76F51': { category: 'warning', tag: '警示/活力' },
  '#264653': { category: 'order', tag: '秩序/理性' },
  '#2A9D8F': { category: 'public', tag: '公共/开放' },
};

export const LABEL_PRESETS = ['强相关', '弱链接', '冲突', '一般'];
