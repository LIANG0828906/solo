import { Player, Ball, Tactics } from './store/useGameStore';

export const PITCH_WIDTH = 20;
export const PITCH_DEPTH = 10;
export const PLAYER_RADIUS = 0.5;
export const BALL_RADIUS = 0.3;
export const GOAL_WIDTH = 4;
export const GOAL_HEIGHT = 2;
export const GOAL_DEPTH = 0.5;

export const TACTICS_X_OFFSETS: Record<Tactics, number> = {
  defense: -8,
  midfield: -2,
  offense: 4,
};

export const COLORS = {
  playerVest: '#f4c542',
  aiVest: '#c03a2b',
  goalkeeper: '#808080',
  pitch: '#664b3f',
  line: '#ffffff',
  ball: '#8b5e3c',
  goalNet: '#3b7a3b',
  goalFrame: '#ffffff',
  background: '#f5e6c8',
  copper: '#b87333',
  copperHover: '#d4a76a',
  energyBar: '#22c55e',
  energyLow: '#ef4444',
};

export const checkCollision = (
  pos1: { x: number; z: number },
  pos2: { x: number; z: number },
  radius1: number,
  radius2: number
): boolean => {
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dz * dz) < radius1 + radius2;
};

export const calculatePassTrajectory = (
  from: { x: number; z: number },
  to: { x: number; z: number },
  power: number
): { velocity: { x: number; y: number; z: number }; time: number } => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  
  const speed = Math.min(power * 0.8, 25);
  const time = dist / speed;
  const vy = 9.8 * time * 0.5;
  
  return {
    velocity: {
      x: (dx / dist) * speed,
      y: vy,
      z: (dz / dist) * speed,
    },
    time,
  };
};

export const calculateShotPower = (
  from: { x: number; z: number },
  to: { x: number; z: number }
): number => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  return Math.min(dist * 1.5, 25);
};

export const checkGoal = (
  ballPos: { x: number; y: number; z: number },
  ballVel: { x: number; y: number; z: number }
): { scored: boolean; team: 'player' | 'ai' | null } => {
  const ballSpeed = Math.sqrt(ballVel.x ** 2 + ballVel.z ** 2);
  
  if (ballPos.x > PITCH_WIDTH / 2 - 0.5 && ballVel.x > 0) {
    if (
      Math.abs(ballPos.z) < GOAL_WIDTH / 2 &&
      ballPos.y < GOAL_HEIGHT &&
      ballPos.y > 0
    ) {
      return { scored: ballSpeed > 15, team: 'player' };
    }
  }
  
  if (ballPos.x < -PITCH_WIDTH / 2 + 0.5 && ballVel.x < 0) {
    if (
      Math.abs(ballPos.z) < GOAL_WIDTH / 2 &&
      ballPos.y < GOAL_HEIGHT &&
      ballPos.y > 0
    ) {
      return { scored: ballSpeed > 15, team: 'ai' };
    }
  }
  
  return { scored: false, team: null };
};

export const calculateAIDecision = (
  aiPlayer: Player,
  allPlayers: Player[],
  ball: Ball,
  dt: number
): { targetPosition: { x: number; z: number }; shouldSlide: boolean } => {
  const playerWithBall = allPlayers.find(
    (p) => p.hasBall && p.team === 'player'
  );
  
  const ballDist = Math.sqrt(
    Math.pow(ball.position.x - aiPlayer.position.x, 2) +
    Math.pow(ball.position.z - aiPlayer.position.z, 2)
  );
  
  let targetX = aiPlayer.defaultFormationX;
  let targetZ = aiPlayer.defaultFormationZ;
  let shouldSlide = false;
  
  if (playerWithBall && ballDist < 3) {
    targetX = ball.position.x;
    targetZ = ball.position.z;
    
    if (ballDist < 2 && !aiPlayer.isSliding) {
      const relativeSpeed = Math.sqrt(
        Math.pow(aiPlayer.velocity.x - playerWithBall.velocity.x, 2) +
        Math.pow(aiPlayer.velocity.z - playerWithBall.velocity.z, 2)
      );
      const successRate = Math.min(relativeSpeed / 10, 0.8);
      shouldSlide = Math.random() < successRate * dt * 10;
    }
  }
  
  return {
    targetPosition: { x: targetX, z: targetZ },
    shouldSlide,
  };
};

export const calculateGoalkeeperMovement = (
  keeper: Player,
  ball: Ball
): { x: number; z: number } => {
  const goalX = keeper.id === 10 ? -PITCH_WIDTH / 2 + 0.5 : PITCH_WIDTH / 2 - 0.5;
  const predictedZ = ball.position.z + ball.velocity.z * 0.3;
  const targetZ = Math.max(-1.5, Math.min(1.5, predictedZ));
  
  return { x: goalX, z: targetZ };
};

export const checkKeeperSave = (
  keeper: Player,
  ball: Ball,
  ballVel: { x: number; y: number; z: number }
): boolean => {
  const ballSpeed = Math.sqrt(ballVel.x ** 2 + ballVel.z ** 2);
  if (ballSpeed > 15) return false;
  
  const dist = Math.sqrt(
    Math.pow(ball.position.x - keeper.position.x, 2) +
    Math.pow(ball.position.z - keeper.position.z, 2)
  );
  
  return dist < 1.2;
};

export const updatePlayerEnergy = (
  player: Player,
  isMoving: boolean,
  isDribbling: boolean,
  dt: number
): number => {
  if (isMoving || isDribbling) {
    return Math.max(0, player.energy - 5 * dt);
  }
  return Math.min(100, player.energy + 2 * dt);
};

export const getPlayerSpeed = (player: Player): number => {
  const baseSpeed = player.team === 'goalkeeper' ? 4 : 3;
  return player.energy < 10 ? baseSpeed * 0.7 : baseSpeed;
};

export const gameTimeToChineseTime = (gameTime: number): string => {
  const totalMinutes = Math.floor(gameTime * 10);
  const hours = Math.floor(totalMinutes / 60) % 12;
  const minutes = totalMinutes % 60;
  
  const shichen = [
    '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
    '午时', '未时', '申时', '酉时', '戌时', '亥时',
  ][hours];
  
  const ke = Math.floor(minutes / 15);
  const keStr = ke > 0 ? `${ke}刻` : '';
  
  return `${shichen}${keStr}`;
};

export const interpolatePosition = (
  current: { x: number; z: number },
  target: { x: number; z: number },
  dt: number,
  maxSpeed: number
): { x: number; z: number; velocity: { x: number; z: number } } => {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  
  if (dist < 0.01) {
    return { x: current.x, z: current.z, velocity: { x: 0, z: 0 } };
  }
  
  const speed = Math.min(dist / 0.2, maxSpeed);
  const vx = (dx / dist) * speed;
  const vz = (dz / dist) * speed;
  
  return {
    x: current.x + vx * dt,
    z: current.z + vz * dt,
    velocity: { x: vx, z: vz },
  };
};

export const clampToPitch = (
  pos: { x: number; z: number },
  margin: number = PLAYER_RADIUS
): { x: number; z: number } => ({
  x: Math.max(-PITCH_WIDTH / 2 + margin, Math.min(PITCH_WIDTH / 2 - margin, pos.x)),
  z: Math.max(-PITCH_DEPTH / 2 + margin, Math.min(PITCH_DEPTH / 2 - margin, pos.z)),
});

export const getTacticsFormationPosition = (
  player: Player,
  tactics: Tactics,
  transitionProgress: number
): { x: number; z: number } => {
  if (player.team !== 'player') {
    return { x: player.defaultFormationX, z: player.defaultFormationZ };
  }
  
  const targetX = TACTICS_X_OFFSETS[tactics] + (player.defaultFormationX + 5);
  const currentX = player.defaultFormationX;
  
  const lerpX = currentX + (targetX - currentX) * transitionProgress;
  
  return { x: lerpX, z: player.defaultFormationZ };
};

export interface DustParticle {
  id: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
}

export const createDustParticle = (
  position: { x: number; z: number },
  direction: { x: number; z: number }
): DustParticle => ({
  id: Math.random(),
  position: { x: position.x, y: 0.1, z: position.z },
  velocity: {
    x: direction.x * 0.5 + (Math.random() - 0.5) * 0.3,
    y: Math.random() * 0.5,
    z: direction.z * 0.5 + (Math.random() - 0.5) * 0.3,
  },
  life: 1,
  maxLife: 0.5 + Math.random() * 0.5,
});

export const updateDustParticles = (
  particles: DustParticle[],
  dt: number
): DustParticle[] => {
  return particles
    .map((p) => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * dt,
        y: p.position.y + p.velocity.y * dt - 2 * dt,
        z: p.position.z + p.velocity.z * dt,
      },
      velocity: {
        x: p.velocity.x * 0.98,
        y: p.velocity.y * 0.98,
        z: p.velocity.z * 0.98,
      },
      life: p.life - dt / p.maxLife,
    }))
    .filter((p) => p.life > 0 && p.position.y > 0);
};
