export type CoinPattern = 'chongning' | 'zhenghe' | 'xuanhe';

export interface PatternInfo {
  id: CoinPattern;
  name: string;
  characters: string;
}

export interface CoinData {
  id: string;
  pattern: CoinPattern;
  wearLevel: number;
  patinaLevel: number;
  rotation: number;
}

export interface CastingRecord {
  pattern: CoinPattern;
  patternName: string;
  polishDuration: number;
  coinCount: number;
  timestamp: number;
}

export interface StepConfig {
  id: number;
  name: string;
  title: string;
}

export const PATTERNS: PatternInfo[] = [
  { id: 'chongning', name: '崇宁通宝', characters: '崇宁\n通宝' },
  { id: 'zhenghe', name: '政和通宝', characters: '政和\n通宝' },
  { id: 'xuanhe', name: '宣和通宝', characters: '宣和\n通宝' }
];

export const STEPS: StepConfig[] = [
  { id: 0, name: '制范', title: '第一步 · 制范' },
  { id: 1, name: '浇铸', title: '第二步 · 浇铸' },
  { id: 2, name: '取钱', title: '第三步 · 取钱' },
  { id: 3, name: '打磨', title: '第四步 · 打磨' },
  { id: 4, name: '穿绳', title: '第五步 · 穿绳' }
];
