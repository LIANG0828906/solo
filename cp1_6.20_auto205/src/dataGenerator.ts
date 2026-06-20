import type { BlockData, LightSourceType } from './types';

const BLOCK_NAMES = [
  '中心商务区', '科技园区', '住宅区A',
  '工业区', '老城区', '大学城',
  '生态公园', '商业综合体', '交通枢纽'
];

const LIGHT_SOURCE_TYPES: LightSourceType[] = ['LED', '钠灯', '荧光灯'];

function generateRandomPollution(): number {
  return Math.floor(Math.random() * 80) + 10;
}

function generateLightIntensity(pollutionIndex: number): number {
  return Math.floor(pollutionIndex * (8 + Math.random() * 4));
}

function generateHistoryData(baseValue: number): number[] {
  const history: number[] = [];
  for (let i = 0; i < 12; i++) {
    const variation = (Math.random() - 0.5) * 20;
    history.push(Math.max(0, Math.min(100, baseValue + variation)));
  }
  return history;
}

export function getInitialData(): BlockData[] {
  const blocks: BlockData[] = [];
  
  for (let i = 0; i < 9; i++) {
    const positionX = i % 3;
    const positionZ = Math.floor(i / 3);
    const pollutionIndex = generateRandomPollution();
    
    blocks.push({
      id: i,
      name: BLOCK_NAMES[i],
      pollutionIndex,
      lightIntensity: generateLightIntensity(pollutionIndex),
      lightSourceType: LIGHT_SOURCE_TYPES[Math.floor(Math.random() * LIGHT_SOURCE_TYPES.length)],
      historyData: generateHistoryData(pollutionIndex),
      positionX,
      positionZ
    });
  }
  
  return blocks;
}

export function updateData(blocks: BlockData[]): BlockData[] {
  return blocks.map(block => {
    const change = (Math.random() - 0.5) * 10;
    const newPollution = Math.max(0, Math.min(100, block.pollutionIndex + change));
    const roundedPollution = Math.round(newPollution);
    
    const newHistory = [...block.historyData.slice(1), roundedPollution];
    
    return {
      ...block,
      pollutionIndex: roundedPollution,
      lightIntensity: generateLightIntensity(roundedPollution),
      historyData: newHistory
    };
  });
}
