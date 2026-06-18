import {
  detectObstaclesAhead,
  checkShipReefCollision,
  checkShipWaveCollision,
  Reef,
  WaveZone
} from './obstacle';

export interface ShipState {
  x: number;
  y: number;
  heading: number;
  baseSpeed: number;
  currentSpeed: number;
  health: number;
  isHit: boolean;
  hitTimer: number;
  tiltAngle: number;
  tiltTimer: number;
  slowTimer: number;
  turning: boolean;
  turnDirection: number;
  turnAngleRemaining: number;
  turnDuration: number;
  turnElapsed: number;
  collisionCount: number;
  isSinking: boolean;
  sinkTimer: number;
  sinkOpacity: number;
  sinkY: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const DEFAULT_SPEED = 80;
const DETECTION_RANGE = 120;
const TURN_RETURN_RATE = 0.8;

export function createShip(): ShipState {
  return {
    x: 60,
    y: CANVAS_HEIGHT / 2,
    heading: 0,
    baseSpeed: DEFAULT_SPEED,
    currentSpeed: DEFAULT_SPEED,
    health: 100,
    isHit: false,
    hitTimer: 0,
    tiltAngle: 0,
    tiltTimer: 0,
    slowTimer: 0,
    turning: false,
    turnDirection: 0,
    turnAngleRemaining: 0,
    turnDuration: 0,
    turnElapsed: 0,
    collisionCount: 0,
    isSinking: false,
    sinkTimer: 0,
    sinkOpacity: 1,
    sinkY: 0
  };
}

export function updateShip(
  ship: ShipState,
  reefs: Reef[],
  waves: WaveZone[],
  dt: number
): { ship: ShipState; distanceDelta: number } {
  let newShip = { ...ship };
  let distanceDelta = 0;

  if (newShip.isSinking) {
    newShip.sinkTimer += dt;
    const t = Math.min(1, newShip.sinkTimer / 1.5);
    newShip.sinkOpacity = 1 - t;
    newShip.sinkY = t * 60;
    return { ship: newShip, distanceDelta: 0 };
  }

  if (newShip.health <= 0) {
    newShip.isSinking = true;
    return { ship: newShip, distanceDelta: 0 };
  }

  if (newShip.hitTimer > 0) {
    newShip.hitTimer -= dt;
    if (newShip.hitTimer <= 0) {
      newShip.isHit = false;
    }
  }

  if (newShip.slowTimer > 0) {
    newShip.slowTimer -= dt;
    if (newShip.slowTimer <= 0) {
      newShip.currentSpeed = newShip.baseSpeed;
    }
  }

  if (newShip.tiltTimer > 0) {
    newShip.tiltTimer -= dt;
    if (newShip.tiltTimer <= 0) {
      newShip.tiltAngle = 0;
    } else {
      const period = 0.5;
      const phase = (0.5 - (newShip.tiltTimer % period) / period) * Math.PI * 2;
      const maxTilt = (8 * Math.PI) / 180;
      newShip.tiltAngle = Math.sin(phase) * maxTilt;
    }
  }

  if (newShip.turning) {
    newShip.turnElapsed += dt;
    if (newShip.turnElapsed >= newShip.turnDuration) {
      newShip.turning = false;
      newShip.turnAngleRemaining = 0;
    } else {
      const angleStep = newShip.turnDirection * newShip.turnAngleRemaining * (dt / newShip.turnDuration);
      newShip.heading += angleStep;
      newShip.turnAngleRemaining -= Math.abs(angleStep);
    }
  } else {
    const obstacles = detectObstaclesAhead(
      newShip.x,
      newShip.y,
      newShip.heading,
      reefs,
      waves,
      DETECTION_RANGE
    );

    if (obstacles.length > 0) {
      const nearest = obstacles[0];
      let turnDir: number;
      if (nearest.type === 'reef') {
        turnDir = nearest.obstacleAngle >= 0 ? -1 : 1;
      } else {
        turnDir = nearest.obstacleAngle >= 0 ? -1 : 1;
      }

      const turnAngle = (Math.random() * 10 + 5) * (Math.PI / 180);
      const turnDuration = Math.random() * 0.5 + 0.3;

      newShip.turning = true;
      newShip.turnDirection = turnDir;
      newShip.turnAngleRemaining = turnAngle;
      newShip.turnDuration = turnDuration;
      newShip.turnElapsed = 0;
    } else {
      if (Math.abs(newShip.heading) > 0.01) {
        const returnAmount = Math.sign(newShip.heading) * TURN_RETURN_RATE * dt;
        if (Math.abs(returnAmount) >= Math.abs(newShip.heading)) {
          newShip.heading = 0;
        } else {
          newShip.heading -= returnAmount;
        }
      }
    }
  }

  const reefCollision = checkShipReefCollision(newShip.x, newShip.y, reefs);
  if (reefCollision && !newShip.isHit) {
    newShip.health = Math.max(0, newShip.health - 10);
    newShip.isHit = true;
    newShip.hitTimer = 0.5;
    newShip.collisionCount++;
    const reboundAngle = newShip.heading + Math.PI;
    newShip.x += Math.cos(reboundAngle) * 20;
    newShip.y += Math.sin(reboundAngle) * 20;
    newShip.currentSpeed = 0;
  }

  const waveCollision = checkShipWaveCollision(newShip.x, newShip.y, waves);
  if (waveCollision) {
    if (newShip.slowTimer <= 0) {
      newShip.currentSpeed = newShip.baseSpeed * 0.8;
    }
    newShip.slowTimer = 1;
    if (newShip.tiltTimer <= 0) {
      newShip.tiltTimer = 1;
    }
  }

  if (!newShip.isHit || newShip.currentSpeed > 0) {
    if (newShip.currentSpeed < newShip.baseSpeed * 0.8 && newShip.hitTimer <= 0) {
      const targetSpeed = newShip.slowTimer > 0 ? newShip.baseSpeed * 0.8 : newShip.baseSpeed;
      newShip.currentSpeed += (targetSpeed - newShip.currentSpeed) * Math.min(1, dt * 3);
    }
  }

  const moveDistance = newShip.currentSpeed * dt;
  newShip.x += Math.cos(newShip.heading) * moveDistance;
  newShip.y += Math.sin(newShip.heading) * moveDistance;

  newShip.x = Math.max(15, Math.min(CANVAS_WIDTH - 15, newShip.x));
  newShip.y = Math.max(15, Math.min(CANVAS_HEIGHT - 15, newShip.y));

  distanceDelta = moveDistance * 0.1;

  return { ship: newShip, distanceDelta };
}
