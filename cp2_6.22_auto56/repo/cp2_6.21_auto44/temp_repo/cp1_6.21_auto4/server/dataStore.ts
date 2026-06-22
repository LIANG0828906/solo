import { v4 as uuidv4 } from 'uuid';

export interface TowerPosition {
  id: string;
  x: number;
  y: number;
  type: 'tower' | 'mirror';
}

export interface WaveConfig {
  waveNumber: number;
  monsters: {
    type: MonsterType;
    count: number;
    delay: number;
  }[];
  isBoss?: boolean;
}

export type MonsterType = 'normal' | 'fast' | 'tank' | 'shield' | 'boss';

export interface LevelData {
  id: string;
  name: string;
  pathPoints: { x: number; y: number }[];
  towerPositions: TowerPosition[];
  waves: WaveConfig[];
  startEnergy: number;
}

export interface PlayerState {
  energy: number;
  towers: {
    id: string;
    positionId: string;
    type: 'red' | 'blue' | 'yellow';
    level: number;
  }[];
  score: number;
  monstersKilled: number;
}

let levels: LevelData[] = [];
let playerState: PlayerState = {
  energy: 200,
  towers: [],
  score: 0,
  monstersKilled: 0,
};

const generatePathPoints = (): { x: number; y: number }[] => {
  return [
    { x: -12, y: 0 },
    { x: -8, y: 0 },
    { x: -8, y: 4 },
    { x: -4, y: 4 },
    { x: -4, y: -3 },
    { x: 2, y: -3 },
    { x: 2, y: 3 },
    { x: 6, y: 3 },
    { x: 6, y: -2 },
    { x: 10, y: -2 },
    { x: 10, y: 0 },
    { x: 12, y: 0 },
  ];
};

const generateTowerPositions = (): TowerPosition[] => {
  return [
    { id: uuidv4(), x: -6, y: 2, type: 'tower' },
    { id: uuidv4(), x: -2, y: -1, type: 'tower' },
    { id: uuidv4(), x: 0, y: 4, type: 'tower' },
    { id: uuidv4(), x: 4, y: 0, type: 'tower' },
    { id: uuidv4(), x: 8, y: 1, type: 'tower' },
    { id: uuidv4(), x: 8, y: -4, type: 'tower' },
    { id: uuidv4(), x: -5, y: -2, type: 'mirror' },
    { id: uuidv4(), x: -1, y: 2, type: 'mirror' },
    { id: uuidv4(), x: 3, y: -2, type: 'mirror' },
    { id: uuidv4(), x: 7, y: -4, type: 'mirror' },
  ];
};

const generateWaves = (): WaveConfig[] => {
  const waves: WaveConfig[] = [];
  
  for (let i = 1; i <= 20; i++) {
    const isBoss = i % 10 === 0;
    
    if (isBoss) {
      waves.push({
        waveNumber: i,
        isBoss: true,
        monsters: [
          { type: 'boss', count: 1, delay: 0 },
          { type: 'normal', count: 5, delay: 2000 },
        ],
      });
    } else {
      const monsters: WaveConfig['monsters'] = [];
      const baseCount = 3 + Math.floor(i * 1.5);
      
      monsters.push({ type: 'normal', count: baseCount, delay: 1500 - Math.min(i * 50, 800) });
      
      if (i >= 3) {
        monsters.push({ type: 'fast', count: Math.floor(i / 2), delay: 1000 });
      }
      
      if (i >= 5) {
        monsters.push({ type: 'tank', count: Math.floor(i / 3), delay: 2500 });
      }
      
      if (i >= 7) {
        monsters.push({ type: 'shield', count: Math.floor(i / 4), delay: 2000 });
      }
      
      waves.push({
        waveNumber: i,
        monsters,
      });
    }
  }
  
  return waves;
};

const initializeLevels = () => {
  if (levels.length === 0) {
    levels.push({
      id: 'level-1',
      name: '光域初章',
      pathPoints: generatePathPoints(),
      towerPositions: generateTowerPositions(),
      waves: generateWaves(),
      startEnergy: 200,
    });
  }
};

export const getLevel = (id: string): LevelData | undefined => {
  initializeLevels();
  return levels.find((l) => l.id === id);
};

export const getPlayerState = (): PlayerState => {
  return { ...playerState };
};

export const updatePlayerState = (updates: Partial<PlayerState>): PlayerState => {
  playerState = { ...playerState, ...updates };
  return { ...playerState };
};

export const addTower = (positionId: string, type: 'red' | 'blue' | 'yellow'): PlayerState => {
  const cost = type === 'red' ? 50 : type === 'blue' ? 60 : 70;
  if (playerState.energy < cost) {
    throw new Error('能量不足');
  }
  
  const existingTower = playerState.towers.find((t) => t.positionId === positionId);
  if (existingTower) {
    throw new Error('该位置已有塔');
  }
  
  playerState.energy -= cost;
  playerState.towers.push({
    id: uuidv4(),
    positionId,
    type,
    level: 1,
  });
  
  return { ...playerState };
};

export const upgradeTower = (towerId: string): PlayerState => {
  const tower = playerState.towers.find((t) => t.id === towerId);
  if (!tower) {
    throw new Error('塔不存在');
  }
  
  const upgradeCost = 50 * tower.level;
  if (playerState.energy < upgradeCost) {
    throw new Error('能量不足');
  }
  
  playerState.energy -= upgradeCost;
  tower.level += 1;
  
  return { ...playerState };
};

export const addEnergy = (amount: number): PlayerState => {
  playerState.energy += amount;
  return { ...playerState };
};

export const incrementKills = (): PlayerState => {
  playerState.monstersKilled += 1;
  playerState.score += 10;
  return { ...playerState };
};

export const resetPlayerState = (): PlayerState => {
  const level = getLevel('level-1');
  playerState = {
    energy: level?.startEnergy || 200,
    towers: [],
    score: 0,
    monstersKilled: 0,
  };
  return { ...playerState };
};
