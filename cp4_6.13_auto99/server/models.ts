export interface RoastPoint {
  time: number;
  temperature: number;
}

export interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  aftertaste: number;
}

export interface Batch {
  id: string;
  origin: string;
  variety: string;
  processingMethod: string;
  roastProfile: RoastPoint[];
  greenScore: number;
  flavorNotes: string[];
  roastDate: string;
  createdAt: string;
  flavorProfile: FlavorProfile;
  roastLevel: 'light' | 'medium' | 'dark';
  userId: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

export const ORIGINS = ['埃塞俄比亚', '哥伦比亚', '巴西', '肯尼亚', '哥斯达黎加'];
export const VARIETIES = ['瑰夏', '波旁', '卡杜拉', 'SL28', '铁皮卡'];
export const PROCESSING_METHODS = ['水洗', '日晒', '蜜处理', '厌氧'];

export const ROAST_LEVELS = {
  light: { label: '浅烘', color: '#F5DEB3', textColor: '#8B6914' },
  medium: { label: '中烘', color: '#D2691E', textColor: '#FFFFFF' },
  dark: { label: '深烘', color: '#5C3A21', textColor: '#FFFFFF' },
};

export function determineRoastLevel(roastProfile: RoastPoint[]): 'light' | 'medium' | 'dark' {
  if (roastProfile.length === 0) return 'medium';
  const maxTemp = Math.max(...roastProfile.map(p => p.temperature));
  if (maxTemp < 200) return 'light';
  if (maxTemp < 220) return 'medium';
  return 'dark';
}
