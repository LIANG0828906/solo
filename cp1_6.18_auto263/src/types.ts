export type ClaspType = 'silver' | 'gold' | 'copper';
export type EngravingFont = 'KaiTi' | 'SimSun' | 'SimHei';

export interface BillItem {
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
}

export interface DesignState {
  leatherColor: string;
  claspType: ClaspType;
  beltLength: number;
  beltWidth: number;
  engravingText: string;
  engravingFont: EngravingFont;
  engravingX: number;
  engravingY: number;
  fontSize: number;
  bill: BillItem[];
  totalPrice: number;
}

export interface DesignActions {
  setColor: (color: string) => void;
  setClasp: (clasp: ClaspType) => void;
  setBeltLength: (length: number) => void;
  setText: (text: string) => void;
  setFont: (font: EngravingFont) => void;
  setTextPosition: (x: number, y: number) => void;
  setFontSize: (size: number) => void;
  calculateBill: () => void;
  loadDesign: (design: Partial<DesignState>) => void;
}

export type DesignStore = DesignState & DesignActions;

export interface SaveDesignResponse {
  id: string;
  thumbnail: string;
  bill: BillItem[];
  totalPrice: number;
}

export interface GetDesignResponse extends DesignState {
  id: string;
  createdAt: number;
}

export const LEATHER_COLORS: { name: string; value: string }[] = [
  { name: '深棕', value: '#5D4037' },
  { name: '酒红', value: '#800020' },
  { name: '墨绿', value: '#2E7D32' },
  { name: '海军蓝', value: '#1A237E' },
  { name: ' saddle棕', value: '#8B4513' },
  { name: '黑色', value: '#212121' },
  { name: '驼色', value: '#C19A6B' },
  { name: '勃艮第红', value: '#722F37' },
  { name: '森林绿', value: '#1B4332' },
  { name: '靛蓝', value: '#1E3A5F' },
  { name: '焦糖色', value: '#C65D3B' },
  { name: '巧克力棕', value: '#3E2723' },
  { name: '橄榄绿', value: '#556B2F' },
  { name: '石板灰', value: '#4A5568' },
  { name: '勃艮第', value: '#800020' }
];

export const CLASP_INFO: { type: ClaspType; name: string; color: string; price: number }[] = [
  { type: 'silver', name: '银扣', color: '#C0C0C0', price: 15 },
  { type: 'gold', name: '金扣', color: '#FFD700', price: 30 },
  { type: 'copper', name: '铜扣', color: '#B87333', price: 20 }
];

export const FONT_OPTIONS: { value: EngravingFont; name: string }[] = [
  { value: 'KaiTi', name: '楷体' },
  { value: 'SimSun', name: '宋体' },
  { value: 'SimHei', name: '黑体' }
];

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const BELT_Y = CANVAS_HEIGHT / 2;
export const MIN_BELT_LENGTH_CM = 80;
export const MAX_BELT_LENGTH_CM = 120;
export const CM_TO_PX_RATIO = 2;
