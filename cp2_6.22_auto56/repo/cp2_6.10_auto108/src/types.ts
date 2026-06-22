export interface Ring {
  name: string;
  color: string;
  radius: number;
  tiltAngle: number;
  tiltAxis: 'x' | 'y' | 'z';
  description: string;
  ringWidth: number;
}

export interface Star {
  id: number;
  ra: number;
  dec: number;
  magnitude: 1 | 2 | 3;
  constellation: string;
  name: string;
  isHighlighted: boolean;
  x?: number;
  y?: number;
  z?: number;
}

export interface StarTrail {
  starId: number;
  points: Array<{ x: number; y: number; z: number }>;
  createdAt: number;
}

export interface AppState {
  selectedRing: string | null;
  highlightedStarId: number | null;
  timeAcceleration: number;
  starTrails: StarTrail[];
  setSelectedRing: (ring: string | null) => void;
  setHighlightedStar: (starId: number | null) => void;
  setTimeAcceleration: (factor: number) => void;
  addStarTrail: (trail: StarTrail) => void;
  removeStarTrail: (starId: number) => void;
  clearExpiredTrails: () => void;
}

export const RING_CONFIGS: Ring[] = [
  {
    name: '地平环',
    color: '#4a7c59',
    radius: 3,
    tiltAngle: 0,
    tiltAxis: 'y',
    description: '测定天体方位角与地平高度',
    ringWidth: 0.15
  },
  {
    name: '子午环',
    color: '#8b5e3c',
    radius: 2.75,
    tiltAngle: 0,
    tiltAxis: 'x',
    description: '测定天体南北赤纬',
    ringWidth: 0.15
  },
  {
    name: '赤道环',
    color: '#b87333',
    radius: 2.5,
    tiltAngle: 23.5,
    tiltAxis: 'x',
    description: '测定天体赤经与赤纬坐标',
    ringWidth: 0.15
  },
  {
    name: '黄道环',
    color: '#daa520',
    radius: 2.5,
    tiltAngle: 0,
    tiltAxis: 'x',
    description: '标示太阳周年视运动轨迹',
    ringWidth: 0.15
  }
];

export const STAR_CATALOG: Omit<Star, 'isHighlighted'>[] = [
  { id: 1, ra: 2.53, dec: 89.26, magnitude: 2, constellation: '小熊座', name: '北极星' },
  { id: 2, ra: 11.06, dec: 61.75, magnitude: 2, constellation: '大熊座', name: '天枢' },
  { id: 3, ra: 11.03, dec: 56.38, magnitude: 2, constellation: '大熊座', name: '天璇' },
  { id: 4, ra: 11.90, dec: 53.69, magnitude: 2, constellation: '大熊座', name: '天玑' },
  { id: 5, ra: 12.26, dec: 57.03, magnitude: 2, constellation: '大熊座', name: '天权' },
  { id: 6, ra: 12.90, dec: 55.96, magnitude: 1, constellation: '大熊座', name: '玉衡' },
  { id: 7, ra: 13.40, dec: 54.92, magnitude: 2, constellation: '大熊座', name: '开阳' },
  { id: 8, ra: 13.79, dec: 49.31, magnitude: 1, constellation: '大熊座', name: '摇光' },
  { id: 9, ra: 5.92, dec: 7.41, magnitude: 1, constellation: '猎户座', name: '参宿四' },
  { id: 10, ra: 5.68, dec: -1.20, magnitude: 1, constellation: '猎户座', name: '参宿七' },
  { id: 11, ra: 5.60, dec: -0.30, magnitude: 2, constellation: '猎户座', name: '参宿一' },
  { id: 12, ra: 5.62, dec: -1.94, magnitude: 2, constellation: '猎户座', name: '参宿二' },
  { id: 13, ra: 5.68, dec: -1.94, magnitude: 2, constellation: '猎户座', name: '参宿三' },
  { id: 14, ra: 14.26, dec: -60.83, magnitude: 1, constellation: '半人马座', name: '南门二' },
  { id: 15, ra: 14.50, dec: -62.68, magnitude: 1, constellation: '半人马座', name: '马腹一' },
  { id: 16, ra: 6.75, dec: -16.72, magnitude: 1, constellation: '大犬座', name: '天狼星' },
  { id: 17, ra: 7.66, dec: -5.23, magnitude: 1, constellation: '小犬座', name: '南河三' },
  { id: 18, ra: 16.50, dec: 36.47, magnitude: 1, constellation: '武仙座', name: '帝座' },
  { id: 19, ra: 17.50, dec: 37.28, magnitude: 2, constellation: '天琴座', name: '织女星' },
  { id: 20, ra: 20.69, dec: 8.87, magnitude: 1, constellation: '天鹰座', name: '牛郎星' },
  { id: 21, ra: 2.25, dec: 42.31, magnitude: 2, constellation: '仙女座', name: '壁宿二' },
  { id: 22, ra: 0.69, dec: 59.15, magnitude: 2, constellation: '仙后座', name: '王良四' },
  { id: 23, ra: 3.59, dec: -1.44, magnitude: 2, constellation: '鲸鱼座', name: '土司空' },
  { id: 24, ra: 10.14, dec: 11.97, magnitude: 2, constellation: '狮子座', name: '轩辕十四' },
  { id: 25, ra: 13.52, dec: -11.16, magnitude: 1, constellation: '室女座', name: '角宿一' },
  { id: 26, ra: 16.81, dec: -26.43, magnitude: 1, constellation: '天蝎座', name: '心宿二' },
  { id: 27, ra: 19.85, dec: 8.40, magnitude: 2, constellation: '天箭座', name: '左旗一' },
  { id: 28, ra: 21.07, dec: -18.87, magnitude: 2, constellation: '摩羯座', name: '垒壁阵四' },
  { id: 29, ra: 23.44, dec: 15.93, magnitude: 2, constellation: '飞马座', name: '室宿一' },
  { id: 30, ra: 0.14, dec: 29.09, magnitude: 2, constellation: '白羊座', name: '娄宿三' }
];

export const generateRandomStars = (count: number): Omit<Star, 'isHighlighted'>[] => {
  const stars: Omit<Star, 'isHighlighted'>[] = [];
  let id = 100;
  
  for (let i = 0; i < count; i++) {
    const ra = Math.random() * 24;
    const dec = (Math.random() - 0.5) * 180;
    const magnitude = (Math.random() < 0.2 ? 1 : Math.random() < 0.5 ? 2 : 3) as 1 | 2 | 3;
    
    stars.push({
      id: id++,
      ra,
      dec,
      magnitude,
      constellation: '未知',
      name: `星${id}`
    });
  }
  
  return stars;
};
