import type { GameConfig } from './types';

export const GAME_CONFIG: GameConfig = {
  gridWidth: 40,
  gridHeight: 40,
  roomSize: 64,
  roomBorder: 2,
  moveCooldown: 300,
  maxHp: 100,
  startPosition: { x: 20, y: 20 },
  eventProbabilities: {
    spike: 0.20,
    treasure: 0.15,
    swamp: 0.10,
    portal: 0.05
  }
};

export const COLORS = {
  background: '#1a1a2e',
  gridLine: '#2d2d5e',
  roomUnexplored: '#2a2a4e',
  roomExplored: '#3d3d6a',
  roomCurrent: '#fff8a8',
  roomFlash: '#ff4444',
  swamp: '#44aa44',
  character: '#ffffff',
  characterSword: '#cccccc'
};

export const VISIBLE_ROOMS_X = 9;
export const VISIBLE_ROOMS_Y = 7;
