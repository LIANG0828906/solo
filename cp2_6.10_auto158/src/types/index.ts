export interface Star {
  id: string;
  name: string;
  constellation: string;
  westernConstellation: string;
  magnitude: number;
  ra: number;
  dec: number;
  fenye: string;
  isMain: boolean;
}

export interface Constellation {
  name: string;
  stars: string[];
  lines: [number, number][];
}

export interface AppState {
  timeMonth: number;
  showConstellationLines: boolean;
  selectedStarId: string | null;
  searchQuery: string;
  setTimeMonth: (month: number) => void;
  toggleConstellationLines: () => void;
  setSelectedStarId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
];

export const SOLAR_TERMS = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
];
