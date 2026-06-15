export interface Player {
  id: string;
  name: string;
  socketId?: string;
  score: number;
  arrowsLeft: number;
  throwsHistory: Array<{ x: number; y: number; score: number; round: number }>;
  rank: number;
  consecutiveLast: number;
}

export interface Arrow {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  active: boolean;
  trail: Particle[];
}

export interface Room {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerIndex: number;
  round: number;
  throwsInRound: number;
  hostId: string;
  maxPlayers: number;
}

export type ThrowResult = 'center' | 'rim' | 'miss';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export const POT_X = 400;
export const POT_Y = 250;
export const POT_HEIGHT = 120;
export const POT_MOUTH_RADIUS = 30;
export const POT_CENTER_RADIUS = 15;
export const GRAVITY = 0.35;
export const ARROW_LENGTH = 50;
export const MAX_ROUNDS = 1;
export const THROWS_PER_PLAYER = 5;
export const TURN_TIME_LIMIT = 30;

export function calculateThrowResult(endX: number, endY: number): ThrowResult {
  const mouthX = POT_X;
  const mouthY = POT_Y - POT_HEIGHT / 2;
  const dx = endX - mouthX;
  const dy = endY - mouthY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= POT_CENTER_RADIUS) {
    return 'center';
  } else if (distance <= POT_MOUTH_RADIUS) {
    return 'rim';
  }
  return 'miss';
}

export function getScore(result: ThrowResult): number {
  switch (result) {
    case 'center':
      return 10;
    case 'rim':
      return 5;
    case 'miss':
      return 0;
    default:
      return 0;
  }
}

export function createArrow(startX: number, startY: number, angle: number, power: number): Arrow {
  const vx = Math.cos(angle) * power;
  const vy = Math.sin(angle) * power;
  return {
    id: `arrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    x: startX,
    y: startY,
    vx,
    vy,
    rotation: angle,
    active: true,
    trail: [],
  };
}

export function updateArrow(arrow: Arrow): boolean {
  if (!arrow.active) return false;

  arrow.vy += GRAVITY;
  arrow.x += arrow.vx;
  arrow.y += arrow.vy;
  arrow.rotation = Math.atan2(arrow.vy, arrow.vx);

  const canvasWidth = 800;
  const canvasHeight = 600;
  const groundY = POT_Y + POT_HEIGHT / 2 + 50;

  if (arrow.x < -100 || arrow.x > canvasWidth + 100 || arrow.y > groundY) {
    arrow.active = false;
    return false;
  }

  if (arrow.y < -200) {
    arrow.active = false;
    return false;
  }

  return true;
}

export function createHitParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      color: '#FFD700',
      size: 3 + Math.random() * 4,
    });
  }
  return particles;
}

export function createTrailParticle(arrow: Arrow): Particle {
  return {
    x: arrow.x - Math.cos(arrow.rotation) * ARROW_LENGTH * 0.5,
    y: arrow.y - Math.sin(arrow.rotation) * ARROW_LENGTH * 0.5,
    vx: -arrow.vx * 0.1 + (Math.random() - 0.5) * 0.5,
    vy: -arrow.vy * 0.1 + (Math.random() - 0.5) * 0.5,
    life: 0.6,
    color: 'rgba(255, 200, 100, 0.6)',
    size: 2 + Math.random() * 2,
  };
}

export function calculateRankings(players: Player[]): Player[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return sorted.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

export function checkConsecutiveLast(
  players: Player[],
  playerId: string,
  prevRank: number
): number {
  const player = players.find((p) => p.id === playerId);
  if (!player) return 0;

  const maxRank = players.length;
  const currentRank = player.rank;

  if (currentRank === maxRank && prevRank === maxRank) {
    return player.consecutiveLast + 1;
  }

  if (currentRank === maxRank) {
    return 1;
  }

  return 0;
}

export function isGameFinished(room: Room): boolean {
  if (room.round < MAX_ROUNDS) return false;
  if (room.throwsInRound < THROWS_PER_PLAYER * room.players.length) return false;
  return true;
}

export function getNextPlayer(room: Room): number {
  if (room.players.length === 0) return 0;
  return (room.currentPlayerIndex + 1) % room.players.length;
}

export type AnimationState =
  | 'idle'
  | 'aiming'
  | 'throwing'
  | 'arrow_flying'
  | 'hit_animating'
  | 'player_bowing'
  | 'turn_transition'
  | 'game_over';

export interface GameState {
  currentArrow: Arrow | null;
  particles: Particle[];
  animationState: AnimationState;
  bowingPlayerId: string | null;
  transitionTimer: number;
}

export function transitionState(
  current: AnimationState,
  event: string,
  data?: any
): AnimationState {
  switch (current) {
    case 'idle':
      if (event === 'start_aim') return 'aiming';
      if (event === 'game_end') return 'game_over';
      break;
    case 'aiming':
      if (event === 'release') return 'throwing';
      if (event === 'cancel') return 'idle';
      break;
    case 'throwing':
      if (event === 'arrow_launched') return 'arrow_flying';
      break;
    case 'arrow_flying':
      if (event === 'arrow_hit') return 'hit_animating';
      if (event === 'arrow_missed') return 'turn_transition';
      break;
    case 'hit_animating':
      if (event === 'hit_done') return 'player_bowing';
      break;
    case 'player_bowing':
      if (event === 'bow_done') return 'turn_transition';
      break;
    case 'turn_transition':
      if (event === 'next_turn') return 'idle';
      if (event === 'game_end') return 'game_over';
      break;
    case 'game_over':
      return 'game_over';
  }
  return current;
}
