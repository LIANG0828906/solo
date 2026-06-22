import { Ship, Laser } from './ship';
import { Particle } from './particle';

export interface GameState {
  playerShip: Ship;
  enemyShip: Ship;
  lasers: Laser[];
  particles: Particle[];
  stars: Star[];
  isPlaying: boolean;
  isGameOver: boolean;
  playerWon: boolean;
  battleTime: number;
  screenShake: number;
  screenShakeDuration: number;
  fadeAlpha: number;
  fadeDuration: number;
  isFading: boolean;
  isFadingIn: boolean;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  baseAlpha: number;
}

export function createInitialState(
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): GameState {
  const shipSize = 25 * scale;

  const playerShip = new Ship({
    x: canvasWidth * 0.2,
    y: canvasHeight / 2,
    color: '#45A29E',
    cockpitColor: '#66FCF1',
    size: shipSize,
    isPlayer: true,
  });

  const enemyShip = new Ship({
    x: canvasWidth * 0.8,
    y: canvasHeight / 2,
    color: '#C3073F',
    cockpitColor: '#FF6B6B',
    size: shipSize,
    isPlayer: false,
  });
  enemyShip.laserColor = '#FF6B6B';
  enemyShip.laserDamage = 15;
  enemyShip.fireRate = 0.5;

  const stars: Star[] = [];
  const starCount = Math.floor((canvasWidth * canvasHeight) / 8000);
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: Math.random() * 2 + 1,
      twinkleSpeed: 0.5 + Math.random() * 1.0,
      twinkleOffset: Math.random() * Math.PI * 2,
      baseAlpha: 0.3 + Math.random() * 0.5,
    });
  }

  return {
    playerShip,
    enemyShip,
    lasers: [],
    particles: [],
    stars,
    isPlaying: true,
    isGameOver: false,
    playerWon: false,
    battleTime: 0,
    screenShake: 0,
    screenShakeDuration: 0,
    fadeAlpha: 0,
    fadeDuration: 0.3,
    isFading: false,
    isFadingIn: false,
  };
}
