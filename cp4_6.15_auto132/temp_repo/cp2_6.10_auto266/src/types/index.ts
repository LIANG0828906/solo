export interface StarEvent {
  id: string;
  type: 'meteor' | 'comet' | 'eclipse' | 'nova' | 'conjunction';
  description: string;
  hint: string;
  correctStar: string;
  correctInscription: string;
  timeLimit: number;
  availableStars: string[];
  availableInscriptions: string[];
}

export interface RandomEvent {
  id: string;
  type: 'meteor_fall' | 'duel' | 'chart_destroyed';
  description: string;
  timeLimit: number;
  reward: number;
}

export interface StarRecord {
  eventId: string;
  success: boolean;
  timestamp: number;
  star: string;
  inscription: string;
}

export interface StarWenRecord {
  xun: number;
  startDay: number;
  endDay: number;
  totalEvents: number;
  successCount: number;
  accuracy: number;
  finalCultivation: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  comment: string;
}

export interface StarEventsResponse {
  day: number;
  xun: number;
  events: StarEvent[];
  randomEvent: RandomEvent | null;
  cultivation: number;
}

export interface SubmitRequest {
  eventId: string;
  selectedStar: string;
  selectedInscription: string;
  timeRemaining: number;
}

export interface SubmitResponse {
  success: boolean;
  cultivationChange: number;
  newCultivation: number;
  message: string;
  nextEvent: StarEvent | null;
  isXunEnd: boolean;
  starRecord: StarRecord | null;
}

export interface RandomEventSubmitRequest {
  eventId: string;
  action: string;
  success: boolean;
}

export interface RandomEventSubmitResponse {
  success: boolean;
  cultivationChange: number;
  newCultivation: number;
  message: string;
}

export interface RecordsResponse {
  records: StarWenRecord[];
}

export interface Star {
  id: string;
  name: string;
  meaning: string;
  x: number;
  y: number;
  constellation: string;
}

export interface Inscription {
  id: string;
  name: string;
  symbol: string;
  element: string;
}

export interface StarPosition {
  name: string;
  x: number;
  y: number;
  radius: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  day: number;
  xun: number;
  cultivation: number;
  events: StarEvent[];
  currentEventIndex: number;
  currentEvent: StarEvent | null;
  selectedStar: string | null;
  selectedInscription: string | null;
  timeRemaining: number;
  randomEvent: RandomEvent | null;
  loading: boolean;
  resultMessage: string | null;
  resultChange: number | null;
  records: StarWenRecord[];
  eventHistory: StarRecord[];
  isXunEnd: boolean;
}

export const STARS: Star[] = [
  { id: 'qinglong', name: '青龙', meaning: '东方之神，主生机', x: 0, y: 0, constellation: '东方' },
  { id: 'baihu', name: '白虎', meaning: '西方之神，主肃杀', x: 0, y: 0, constellation: '西方' },
  { id: 'zhuque', name: '朱雀', meaning: '南方之神，主炎上', x: 0, y: 0, constellation: '南方' },
  { id: 'xuanwu', name: '玄武', meaning: '北方之神，主润下', x: 0, y: 0, constellation: '北方' },
  { id: 'ziwei', name: '紫微', meaning: '中天帝星，主尊贵', x: 0, y: 0, constellation: '中央' },
  { id: 'taiwei', name: '太微', meaning: '天庭之府，主官禄', x: 0, y: 0, constellation: '中央' },
  { id: 'tianshi', name: '天市', meaning: '天帝之市，主财帛', x: 0, y: 0, constellation: '中央' },
  { id: 'wenchang', name: '文昌', meaning: '文曲之星，主智慧', x: 0, y: 0, constellation: '中央' },
];

export const INSCRIPTIONS: Inscription[] = [
  { id: 'qian', name: '乾', symbol: '☰', element: '金' },
  { id: 'kun', name: '坤', symbol: '☷', element: '土' },
  { id: 'zhen', name: '震', symbol: '☳', element: '木' },
  { id: 'xun', name: '巽', symbol: '☴', element: '木' },
  { id: 'kan', name: '坎', symbol: '☵', element: '水' },
  { id: 'li', name: '离', symbol: '☲', element: '火' },
  { id: 'gen', name: '艮', symbol: '☶', element: '土' },
  { id: 'dui', name: '兑', symbol: '☱', element: '金' },
];

export const STAR_MATCHING: Record<string, { star: string; inscription: string }> = {
  'spring': { star: 'qinglong', inscription: 'zhen' },
  'summer': { star: 'zhuque', inscription: 'li' },
  'autumn': { star: 'baihu', inscription: 'dui' },
  'winter': { star: 'xuanwu', inscription: 'kan' },
  'royal': { star: 'ziwei', inscription: 'qian' },
  'earth': { star: 'taiwei', inscription: 'kun' },
  'market': { star: 'tianshi', inscription: 'xun' },
  'wisdom': { star: 'wenchang', inscription: 'gen' },
  'wood': { star: 'qinglong', inscription: 'zhen' },
  'fire': { star: 'zhuque', inscription: 'li' },
  'metal': { star: 'baihu', inscription: 'qian' },
  'water': { star: 'xuanwu', inscription: 'kan' },
  'earth_element': { star: 'taiwei', inscription: 'kun' },
  'wind': { star: 'wenchang', inscription: 'xun' },
  'mountain': { star: 'tianshi', inscription: 'gen' },
  'marsh': { star: 'baihu', inscription: 'dui' },
};
