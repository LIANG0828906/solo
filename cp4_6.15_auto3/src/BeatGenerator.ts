import type { Beat, DifficultyConfig, DifficultyLevel } from './types';

const PERFECT_WINDOW = 50;
const GOOD_WINDOW = 100;
const PERFECT_SCORE = 100;
const GOOD_SCORE = 50;
const COMBO_MULTIPLIER = 0.1;

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    timeSignature: [4, 4],
    bpm: 80,
    tracks: 1,
    pattern: 'single',
    duration: 30000,
  },
  normal: {
    timeSignature: [4, 4],
    bpm: 120,
    tracks: 2,
    pattern: 'alternate',
    duration: 45000,
  },
  hard: {
    timeSignature: [7, 8],
    bpm: 150,
    tracks: 4,
    pattern: 'random',
    duration: 60000,
  },
};

export function judgeHit(actualTime: number, expectedTime: number): { type: 'perfect' | 'good' | 'miss'; deviation: number } {
  const deviation = actualTime - expectedTime;
  const absDeviation = Math.abs(deviation);
  if (absDeviation <= PERFECT_WINDOW) return { type: 'perfect', deviation };
  if (absDeviation <= GOOD_WINDOW) return { type: 'good', deviation };
  return { type: 'miss', deviation };
}

export function calculateScore(judgment: 'perfect' | 'good' | 'miss', combo: number): number {
  const base = judgment === 'perfect' ? PERFECT_SCORE : judgment === 'good' ? GOOD_SCORE : 0;
  return Math.floor(base * (1 + combo * COMBO_MULTIPLIER));
}

export class BeatGenerator {
  private config: DifficultyConfig;
  private usedPatterns: Set<string> = new Set();

  constructor(difficulty: DifficultyLevel) {
    this.config = DIFFICULTY_CONFIGS[difficulty];
  }

  public generateBeats(): Beat[] {
    const beats: Beat[] = [];
    const beatInterval = 60000 / this.config.bpm;
    const beatsPerMeasure = this.config.timeSignature[0];
    
    let currentTime = 2000;
    let patternKey = '';

    while (currentTime < this.config.duration) {
      const measureBeats: Beat[] = [];
      
      for (let i = 0; i < beatsPerMeasure; i++) {
        let track: number;
        
        switch (this.config.pattern) {
          case 'single':
            track = 0;
            break;
          case 'alternate':
            track = i % this.config.tracks;
            break;
          case 'random':
            track = Math.floor(Math.random() * this.config.tracks);
            break;
        }
        
        const beat: Beat = {
          id: `beat-${beats.length}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          track,
          time: currentTime,
          hit: false,
        };
        
        measureBeats.push(beat);
        patternKey += track;
        currentTime += beatInterval;
      }
      
      if (this.config.pattern === 'random' && this.usedPatterns.has(patternKey)) {
        currentTime -= measureBeats.length * beatInterval;
        beats.splice(beats.length - measureBeats.length, measureBeats.length);
        patternKey = '';
        continue;
      }
      
      this.usedPatterns.add(patternKey);
      beats.push(...measureBeats);
      patternKey = '';
    }
    
    return beats;
  }

  public getConfig(): DifficultyConfig {
    return this.config;
  }

  public regenerate(): Beat[] {
    this.usedPatterns.clear();
    return this.generateBeats();
  }
}

export function getDifficultyLabel(level: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
  };
  return labels[level];
}

export function getModeLabel(mode: 'standard' | 'practice'): string {
  return mode === 'standard' ? '标准模式' : '自由练习';
}

export function getThemeLabel(theme: 'retro' | 'neon' | 'minimal'): string {
  const labels: Record<'retro' | 'neon' | 'minimal', string> = {
    retro: '复古像素',
    neon: '霓虹科幻',
    minimal: '极简黑白',
  };
  return labels[theme];
}
