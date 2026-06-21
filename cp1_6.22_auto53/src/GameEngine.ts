export type TerrainType = 'asphalt' | 'sand' | 'snow' | 'mud';

export interface TerrainPhysics {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  friction: number;
  grip: number;
  color: string;
  name: string;
}

export interface CarState {
  x: number;
  y: number;
  angle: number;
  speed: number;
  angularVelocity: number;
  width: number;
  height: number;
}

export type ParticleType = 'skid' | 'dust' | 'mud' | 'spark';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
}

export interface LapRecord {
  id: string;
  time: number;
  averageSpeed: number;
  terrainTimes: Record<TerrainType, number>;
  date: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface TerrainManager {
  getTerrainAt(x: number, y: number): { type: TerrainType; physics: TerrainPhysics; isOnTrack: boolean };
  isInsideTrack(x: number, y: number): boolean;
  getTrackCenter(): { x: number; y: number };
  getTrackSemiMajor(): number;
  getTrackSemiMinor(): number;
  getTrackWidth(): number;
  getStartLineAngle(): number;
  getNormalAtPoint(x: number, y: number): { nx: number; ny: number };
  getTrackRadiusAtAngle(angle: number): number;
}

export interface GameState {
  car: CarState;
  particles: Particle[];
  lap: number;
  lapTime: number;
  bestLapTime: number | null;
  currentTerrain: TerrainType;
  currentPhysics: TerrainPhysics;
  trail: TrailPoint[];
  terrainLapTimes: Record<TerrainType, number>;
  isRunning: boolean;
  lastLapRecord: LapRecord | null;
}

const FIXED_TIME_STEP = 16;
const TRAIL_INTERVAL = 50;
const MAX_TRAIL_POINTS = 200;
const TURN_RATE = 2.5;
const COLLISION_SPEED_FACTOR = 0.4;
const SKID_SPEED_THRESHOLD = 50;

export class GameEngine {
  private car: CarState;
  private input: InputState;
  private currentTerrain: TerrainType;
  private currentPhysics: TerrainPhysics;
  private particles: Particle[];
  private lap: number;
  private lapTime: number;
  private bestLapTime: number | null;
  private isRunning: boolean;
  private trail: TrailPoint[];
  private terrainLapTimes: Record<TerrainType, number>;
  private hasCrossedStartLine: boolean;
  private startLineAngle: number;
  private terrainManager: TerrainManager;
  private previousAngle: number;
  private trailTimer: number;
  private lapDistance: number;
  private lastLapRecord: LapRecord | null;

  constructor(terrainManager: TerrainManager) {
    this.terrainManager = terrainManager;
    this.startLineAngle = terrainManager.getStartLineAngle();
    this.input = { up: false, down: false, left: false, right: false };
    this.particles = [];
    this.trail = [];
    this.lap = 0;
    this.lapTime = 0;
    this.bestLapTime = null;
    this.isRunning = false;
    this.trailTimer = 0;
    this.previousAngle = 0;
    this.hasCrossedStartLine = false;
    this.lapDistance = 0;
    this.lastLapRecord = null;

    this.terrainLapTimes = {
      asphalt: 0,
      sand: 0,
      snow: 0,
      mud: 0,
    };

    this.currentTerrain = 'asphalt';
    this.currentPhysics = {
      maxSpeed: 300,
      acceleration: 200,
      deceleration: 300,
      friction: 0.95,
      grip: 1.0,
      color: '#333333',
      name: '沥青',
    };

    this.car = {
      x: 0,
      y: 0,
      angle: 0,
      speed: 0,
      angularVelocity: 0,
      width: 24,
      height: 40,
    };

    this.reset();
  }

  public update(deltaTime: number): void {
    let remainingTime = deltaTime;

    while (remainingTime > 0) {
      const stepTime = Math.min(remainingTime, FIXED_TIME_STEP);
      this.fixedUpdate(stepTime);
      remainingTime -= stepTime;
    }
  }

  private fixedUpdate(deltaTime: number): void {
    const dtSeconds = deltaTime / 1000;

    const terrainInfo = this.terrainManager.getTerrainAt(this.car.x, this.car.y);
    this.currentTerrain = terrainInfo.type;
    this.currentPhysics = terrainInfo.physics;

    this.terrainLapTimes[this.currentTerrain] += deltaTime;

    this.applyAcceleration(dtSeconds);
    this.applyFriction(dtSeconds);
    this.applySteering(dtSeconds);
    this.updatePosition(dtSeconds);

    const wasInside = this.terrainManager.isInsideTrack(this.car.x, this.car.y);
    if (!wasInside) {
      this.handleCollision();
    }

    this.generateParticles();

    this.updateLapTime(deltaTime);

    this.trailTimer += deltaTime;
    if (this.trailTimer >= TRAIL_INTERVAL) {
      this.addTrailPoint();
      this.trailTimer = 0;
    }

    this.updateParticles(dtSeconds);

    this.previousAngle = this.getCarAngle();
  }

  private applyAcceleration(dtSeconds: number): void {
    const { acceleration, deceleration, maxSpeed } = this.currentPhysics;

    if (this.input.up) {
      this.car.speed += acceleration * dtSeconds;
    }
    if (this.input.down) {
      if (this.car.speed > 0) {
        this.car.speed -= deceleration * dtSeconds;
        if (this.car.speed < 0) {
          this.car.speed = 0;
        }
      } else {
        this.car.speed -= acceleration * 0.5 * dtSeconds;
      }
    }

    if (this.car.speed > maxSpeed) {
      this.car.speed = maxSpeed;
    }
    if (this.car.speed < -maxSpeed * 0.3) {
      this.car.speed = -maxSpeed * 0.3;
    }
  }

  private applyFriction(dtSeconds: number): void {
    const { friction } = this.currentPhysics;

    if (!this.input.up && !this.input.down) {
      const frictionFactor = Math.pow(1 - friction, dtSeconds * 60);
      this.car.speed *= frictionFactor;

      if (Math.abs(this.car.speed) < 1) {
        this.car.speed = 0;
      }
    }

    if (!this.input.left && !this.input.right) {
      const angularFriction = Math.pow(0.9, dtSeconds * 60);
      this.car.angularVelocity *= angularFriction;
    }
  }

  private applySteering(dtSeconds: number): void {
    const { grip, maxSpeed } = this.currentPhysics;
    const speedFactor = Math.min(Math.abs(this.car.speed) / maxSpeed, 1);

    let turnDirection = 0;
    if (this.input.left) turnDirection += 1;
    if (this.input.right) turnDirection -= 1;

    if (this.car.speed < 0) {
      turnDirection *= -1;
    }

    const targetAngularVelocity = turnDirection * TURN_RATE * grip * speedFactor;
    const smoothFactor = 1 - Math.pow(0.7, dtSeconds * 60);
    this.car.angularVelocity += (targetAngularVelocity - this.car.angularVelocity) * smoothFactor;
  }

  private updatePosition(dtSeconds: number): void {
    this.car.angle += this.car.angularVelocity * dtSeconds;

    const vx = this.car.speed * Math.cos(this.car.angle);
    const vy = this.car.speed * Math.sin(this.car.angle);

    this.car.x += vx * dtSeconds;
    this.car.y += vy * dtSeconds;
  }

  private handleCollision(): void {
    const center = this.terrainManager.getTrackCenter();
    const trackWidth = this.terrainManager.getTrackWidth();

    const dx = this.car.x - center.x;
    const dy = this.car.y - center.y;

    const angle = Math.atan2(dy, dx);
    const radiusAtAngle = this.terrainManager.getTrackRadiusAtAngle(angle);
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    const outerRadius = radiusAtAngle + trackWidth / 2;
    const innerRadius = radiusAtAngle - trackWidth / 2;

    let isOutside = false;
    let isInside = false;

    if (distanceFromCenter > outerRadius) {
      isOutside = true;
    } else if (distanceFromCenter < innerRadius) {
      isInside = true;
    } else {
      return;
    }

    const normal = this.terrainManager.getNormalAtPoint(this.car.x, this.car.y);
    let normalX = normal.nx;
    let normalY = normal.ny;

    if (isInside) {
      normalX = -normalX;
      normalY = -normalY;
    }

    let overlap: number;
    if (isOutside) {
      overlap = distanceFromCenter - outerRadius;
    } else {
      overlap = innerRadius - distanceFromCenter;
    }

    this.car.x -= normalX * overlap;
    this.car.y -= normalY * overlap;

    const vx = this.car.speed * Math.cos(this.car.angle);
    const vy = this.car.speed * Math.sin(this.car.angle);

    const dotProduct = vx * normalX + vy * normalY;
    const reflectedVx = vx - 2 * dotProduct * normalX;
    const reflectedVy = vy - 2 * dotProduct * normalY;

    this.car.speed = Math.sqrt(reflectedVx * reflectedVx + reflectedVy * reflectedVy) * COLLISION_SPEED_FACTOR;
    if (this.car.speed > 1) {
      this.car.angle = Math.atan2(reflectedVy, reflectedVx);
    }

    this.car.angularVelocity *= -0.5;

    this.spawnSparkParticles(normalX, normalY);
  }

  private spawnSparkParticles(nx: number, ny: number): void {
    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x: this.car.x,
        y: this.car.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300 + Math.random() * 200,
        maxLife: 500,
        color: '#ffdd00',
        size: 2 + Math.random() * 3,
        type: 'spark',
      });
    }
  }

  private generateParticles(): void {
    const speed = Math.abs(this.car.speed);
    if (speed < SKID_SPEED_THRESHOLD) return;

    const isTurning = this.input.left || this.input.right;
    if (!isTurning && this.currentTerrain === 'asphalt') return;

    const wheelPositions = this.getRearWheelPositions();

    for (const wheel of wheelPositions) {
      let particleType: ParticleType = 'skid';
      let color = '#1a1a1a';
      let size = 4;
      let life = 2000;

      switch (this.currentTerrain) {
        case 'sand':
          particleType = 'dust';
          color = '#d4a574';
          size = 3 + Math.random() * 3;
          life = 800 + Math.random() * 400;
          break;
        case 'mud':
          particleType = 'mud';
          color = '#5c4033';
          size = 3 + Math.random() * 4;
          life = 1500 + Math.random() * 1000;
          break;
        case 'snow':
          particleType = 'dust';
          color = '#ffffff';
          size = 2 + Math.random() * 2;
          life = 600 + Math.random() * 400;
          break;
        case 'asphalt':
        default:
          particleType = 'skid';
          color = '#1a1a1a';
          size = 3;
          life = 3000;
          break;
      }

      const spreadAngle = this.car.angle + Math.PI + (Math.random() - 0.5) * 0.5;
      const spreadSpeed = 5 + Math.random() * 15;

      this.particles.push({
        x: wheel.x,
        y: wheel.y,
        vx: Math.cos(spreadAngle) * spreadSpeed,
        vy: Math.sin(spreadAngle) * spreadSpeed,
        life,
        maxLife: life,
        color,
        size,
        type: particleType,
      });
    }
  }

  private getRearWheelPositions(): Array<{ x: number; y: number }> {
    const halfWidth = this.car.width / 2;
    const rearOffset = this.car.height / 2;

    const cosAngle = Math.cos(this.car.angle);
    const sinAngle = Math.sin(this.car.angle);
    const perpX = -sinAngle;
    const perpY = cosAngle;

    const rearCenterX = this.car.x - cosAngle * rearOffset;
    const rearCenterY = this.car.y - sinAngle * rearOffset;

    return [
      { x: rearCenterX + perpX * halfWidth, y: rearCenterY + perpY * halfWidth },
      { x: rearCenterX - perpX * halfWidth, y: rearCenterY - perpY * halfWidth },
    ];
  }

  private updateParticles(dtSeconds: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtSeconds;
      p.y += p.vy * dtSeconds;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dtSeconds * 1000;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private getCarAngle(): number {
    const center = this.terrainManager.getTrackCenter();
    return Math.atan2(this.car.y - center.y, this.car.x - center.x);
  }

  private updateLapTime(deltaTime: number): void {
    if (!this.isRunning) return;

    this.lapTime += deltaTime;
    this.lapDistance += Math.abs(this.car.speed) * deltaTime / 1000;

    const currentAngle = this.getCarAngle();
    const angleDiff = currentAngle - this.previousAngle;

    if (Math.abs(angleDiff) > Math.PI) {
      return;
    }

    if (this.previousAngle < this.startLineAngle && currentAngle >= this.startLineAngle) {
      if (this.hasCrossedStartLine) {
        this.completeLap();
      }
    }

    if (Math.abs(currentAngle - this.startLineAngle) > 0.5) {
      this.hasCrossedStartLine = true;
    }
  }

  private completeLap(): void {
    const lapTime = this.lapTime;
    const lapTerrainTimes = { ...this.terrainLapTimes };

    this.lap++;

    if (this.bestLapTime === null || lapTime < this.bestLapTime) {
      this.bestLapTime = lapTime;
    }

    const totalTerrainTime = lapTerrainTimes.asphalt + lapTerrainTimes.sand + lapTerrainTimes.snow + lapTerrainTimes.mud;
    let averageSpeed = 0;
    if (totalTerrainTime > 0) {
      const types: TerrainType[] = ['asphalt', 'sand', 'snow', 'mud'];
      for (const type of types) {
        const terrainInfo = this.terrainManager.getTerrainAt(
          Math.cos(types.indexOf(type) * Math.PI / 2) * 600,
          Math.sin(types.indexOf(type) * Math.PI / 2) * 400
        );
        averageSpeed += terrainInfo.physics.maxSpeed * 0.6 * (lapTerrainTimes[type] / totalTerrainTime);
      }
    }

    this.lastLapRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      time: lapTime,
      averageSpeed,
      terrainTimes: lapTerrainTimes,
      date: Date.now(),
    };

    this.lapTime = 0;
    this.lapDistance = 0;
    this.hasCrossedStartLine = false;

    this.terrainLapTimes = {
      asphalt: 0,
      sand: 0,
      snow: 0,
      mud: 0,
    };
  }

  private addTrailPoint(): void {
    this.trail.push({
      x: this.car.x,
      y: this.car.y,
      timestamp: Date.now(),
    });

    if (this.trail.length > MAX_TRAIL_POINTS) {
      this.trail.shift();
    }
  }

  public getState(): GameState {
    return {
      car: { ...this.car },
      particles: this.particles.map((p) => ({ ...p })),
      lap: this.lap,
      lapTime: this.lapTime,
      bestLapTime: this.bestLapTime,
      currentTerrain: this.currentTerrain,
      currentPhysics: { ...this.currentPhysics },
      trail: this.trail.map((t) => ({ ...t })),
      terrainLapTimes: { ...this.terrainLapTimes },
      isRunning: this.isRunning,
      lastLapRecord: this.lastLapRecord ? { ...this.lastLapRecord } : null,
    };
  }

  public setInput(input: InputState): void {
    this.input = { ...input };
  }

  public reset(): void {
    const center = this.terrainManager.getTrackCenter();
    const startAngle = this.terrainManager.getStartLineAngle();
    const midRadius = this.terrainManager.getTrackRadiusAtAngle(startAngle);

    this.car.x = center.x + Math.cos(startAngle) * midRadius;
    this.car.y = center.y + Math.sin(startAngle) * midRadius;
    this.car.angle = startAngle + Math.PI / 2;
    this.car.speed = 0;
    this.car.angularVelocity = 0;

    const terrainInfo = this.terrainManager.getTerrainAt(this.car.x, this.car.y);
    this.currentTerrain = terrainInfo.type;
    this.currentPhysics = terrainInfo.physics;

    this.particles = [];
    this.trail = [];
    this.lap = 0;
    this.lapTime = 0;
    this.trailTimer = 0;
    this.lapDistance = 0;
    this.hasCrossedStartLine = false;
    this.isRunning = true;
    this.previousAngle = this.getCarAngle();
    this.lastLapRecord = null;

    this.terrainLapTimes = {
      asphalt: 0,
      sand: 0,
      snow: 0,
      mud: 0,
    };
  }

  public start(): void {
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
  }
}
