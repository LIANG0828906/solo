import { LevelData } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -8;
export const MOVE_SPEED = 5;
export const PLAYER_SIZE = 30;
export const PLATFORM_HEIGHT = 15;
export const COIN_RADIUS = 10;
export const SPIKE_SIZE = 20;
export const GOAL_WIDTH = 40;
export const GOAL_HEIGHT = 60;
export const INITIAL_LIVES = 3;
export const COIN_SCORE = 10;

export const levels: LevelData[] = [
  {
    playerStart: { x: 50, y: 300 },
    platforms: [
      { x: 0, y: 370, width: 200, height: PLATFORM_HEIGHT },
      { x: 250, y: 320, width: 60, height: PLATFORM_HEIGHT },
      { x: 360, y: 270, width: 60, height: PLATFORM_HEIGHT },
      { x: 470, y: 220, width: 60, height: PLATFORM_HEIGHT },
      { x: 580, y: 270, width: 60, height: PLATFORM_HEIGHT },
      { x: 680, y: 320, width: 120, height: PLATFORM_HEIGHT },
    ],
    coins: [
      { x: 280, y: 290, radius: COIN_RADIUS, collected: false, floatOffset: 0, collectAnimation: 0 },
      { x: 390, y: 240, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 3, collectAnimation: 0 },
      { x: 500, y: 190, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 2, collectAnimation: 0 },
    ],
    spikes: [
      { x: 320, y: 350, width: SPIKE_SIZE, height: SPIKE_SIZE },
    ],
    goal: { x: 740, y: 260, width: GOAL_WIDTH, height: GOAL_HEIGHT },
  },
  {
    playerStart: { x: 30, y: 300 },
    platforms: [
      { x: 0, y: 370, width: 120, height: PLATFORM_HEIGHT },
      { x: 180, y: 340, width: 60, height: PLATFORM_HEIGHT },
      { x: 300, y: 290, width: 60, height: PLATFORM_HEIGHT },
      { x: 420, y: 240, width: 60, height: PLATFORM_HEIGHT },
      { x: 540, y: 190, width: 60, height: PLATFORM_HEIGHT },
      { x: 420, y: 140, width: 60, height: PLATFORM_HEIGHT },
      { x: 300, y: 100, width: 60, height: PLATFORM_HEIGHT },
      { x: 500, y: 70, width: 100, height: PLATFORM_HEIGHT },
      { x: 680, y: 120, width: 120, height: PLATFORM_HEIGHT },
    ],
    coins: [
      { x: 210, y: 310, radius: COIN_RADIUS, collected: false, floatOffset: 0, collectAnimation: 0 },
      { x: 330, y: 260, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 4, collectAnimation: 0 },
      { x: 450, y: 210, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 2, collectAnimation: 0 },
      { x: 330, y: 70, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI, collectAnimation: 0 },
      { x: 550, y: 40, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 6, collectAnimation: 0 },
    ],
    spikes: [
      { x: 240, y: 350, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 360, y: 270, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 480, y: 220, width: SPIKE_SIZE, height: SPIKE_SIZE },
    ],
    goal: { x: 740, y: 60, width: GOAL_WIDTH, height: GOAL_HEIGHT },
  },
  {
    playerStart: { x: 30, y: 320 },
    platforms: [
      { x: 0, y: 370, width: 80, height: PLATFORM_HEIGHT },
      { x: 130, y: 340, width: 50, height: PLATFORM_HEIGHT },
      { x: 230, y: 300, width: 50, height: PLATFORM_HEIGHT },
      { x: 330, y: 260, width: 50, height: PLATFORM_HEIGHT },
      { x: 230, y: 220, width: 50, height: PLATFORM_HEIGHT },
      { x: 130, y: 180, width: 50, height: PLATFORM_HEIGHT },
      { x: 230, y: 140, width: 50, height: PLATFORM_HEIGHT },
      { x: 350, y: 160, width: 50, height: PLATFORM_HEIGHT },
      { x: 470, y: 180, width: 50, height: PLATFORM_HEIGHT },
      { x: 590, y: 200, width: 50, height: PLATFORM_HEIGHT },
      { x: 710, y: 220, width: 90, height: PLATFORM_HEIGHT },
      { x: 590, y: 280, width: 50, height: PLATFORM_HEIGHT },
      { x: 470, y: 320, width: 50, height: PLATFORM_HEIGHT },
    ],
    coins: [
      { x: 155, y: 310, radius: COIN_RADIUS, collected: false, floatOffset: 0, collectAnimation: 0 },
      { x: 255, y: 270, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 5, collectAnimation: 0 },
      { x: 355, y: 230, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 3, collectAnimation: 0 },
      { x: 155, y: 150, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 2, collectAnimation: 0 },
      { x: 375, y: 130, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI, collectAnimation: 0 },
      { x: 615, y: 170, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 4, collectAnimation: 0 },
      { x: 495, y: 290, radius: COIN_RADIUS, collected: false, floatOffset: Math.PI / 6, collectAnimation: 0 },
    ],
    spikes: [
      { x: 180, y: 350, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 280, y: 280, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 180, y: 200, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 280, y: 120, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 520, y: 260, width: SPIKE_SIZE, height: SPIKE_SIZE },
      { x: 640, y: 300, width: SPIKE_SIZE, height: SPIKE_SIZE },
    ],
    goal: { x: 740, y: 160, width: GOAL_WIDTH, height: GOAL_HEIGHT },
  },
];
