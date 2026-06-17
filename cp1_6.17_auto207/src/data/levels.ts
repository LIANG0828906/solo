import type { LevelData } from '../types';

function generateBeatTimestamps(bpm: number, duration: number): number[] {
  const beatInterval = 60000 / bpm;
  const timestamps: number[] = [];
  for (let t = beatInterval; t <= duration; t += beatInterval) {
    timestamps.push(Math.round(t));
  }
  return timestamps;
}

function generateObstaclePattern(beatCount: number): ('spike' | 'pendulum' | 'block')[] {
  const types: ('spike' | 'pendulum' | 'block')[] = ['spike', 'pendulum', 'block'];
  const pattern: ('spike' | 'pendulum' | 'block')[] = [];
  for (let i = 0; i < beatCount; i++) {
    if (i % 2 === 0) {
      pattern.push(types[Math.floor(Math.random() * types.length)]);
    } else {
      pattern.push('spike');
    }
  }
  return pattern;
}

const LEVEL1_BPM = 128;
const LEVEL2_BPM = 132;
const LEVEL3_BPM = 140;
const DURATION = 64000;

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: '霓虹起源',
    description: '入门关卡，熟悉节奏操作',
    bpm: LEVEL1_BPM,
    beatTimestamps: generateBeatTimestamps(LEVEL1_BPM, DURATION),
    obstaclePattern: generateObstaclePattern(Math.floor(DURATION / (60000 / LEVEL1_BPM)))
  },
  {
    id: 2,
    name: '赛博脉冲',
    description: '中级关卡，节奏变化加快',
    bpm: LEVEL2_BPM,
    beatTimestamps: generateBeatTimestamps(LEVEL2_BPM, DURATION),
    obstaclePattern: generateObstaclePattern(Math.floor(DURATION / (60000 / LEVEL2_BPM)))
  },
  {
    id: 3,
    name: '量子跃迁',
    description: '高级关卡，极限节奏挑战',
    bpm: LEVEL3_BPM,
    beatTimestamps: generateBeatTimestamps(LEVEL3_BPM, DURATION),
    obstaclePattern: generateObstaclePattern(Math.floor(DURATION / (60000 / LEVEL3_BPM)))
  }
];
