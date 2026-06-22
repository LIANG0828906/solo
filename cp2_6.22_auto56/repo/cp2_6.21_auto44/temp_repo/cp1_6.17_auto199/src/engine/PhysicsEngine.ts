import { mazeGenerator, EnergyBall, MazeData } from './MazeGenerator';
import { emitEvent, onEvent } from './EventBus';

export interface PlayerState {
  x: number;
  z: number;
  baseRadius: number;
  isPowered: boolean;
  isSlowed: boolean;
  poweredTimer: number;
  slowedTimer: number;
  lastEnergyColor: string | null;
  collectedCount: number;
  interferenceCooldown: number;
}

export interface TrailParticle {
  x: number;
  z: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface InterferenceParticle {
  x: number;
  z: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

export interface Shockwave {
  x: number;
  z: number;
  color: string;
  life: number;
  maxLife: number;
  maxRadius: number;
}

export class PhysicsEngine {
  private player: PlayerState;
  private keys: Set<string> = new Set();
  private mazeSize: number = 10;
  private level: number = 1;
  private trailParticles: TrailParticle[] = [];
  private interferenceParticles: InterferenceParticle[] = [];
  private shockwaves: Shockwave[] = [];
  private running: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;
  private onUpdateCallback: (() => void) | null = null;
  private spawnTimer: number = 0;

  constructor() {
    this.player = this.createDefaultPlayer();
    this.setupInputListeners();
    onEvent('levelStart', this.handleLevelStart.bind(this));
  }

  private createDefaultPlayer(): PlayerState {
    return {
      x: -(this.mazeSize - 1) / 2,
      z: -(this.mazeSize - 1) / 2,
      baseRadius: 0.3,
      isPowered: false,
      isSlowed: false,
      poweredTimer: 0,
      slowedTimer: 0,
      lastEnergyColor: null,
      collectedCount: 0,
      interferenceCooldown: 0,
    };
  }

  private setupInputListeners(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        this.keys.add(key);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private handleLevelStart(data: { level: number; mazeSize: number }): void {
    this.level = data.level;
    this.mazeSize = data.mazeSize;
    this.player = this.createDefaultPlayer();
    this.trailParticles = [];
    this.interferenceParticles = [];
    this.shockwaves = [];
    this.spawnTimer = 0;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
  }

  setOnUpdate(callback: () => void): void {
    this.onUpdateCallback = callback;
  }

  private loop(): void {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;
    this.update(dt / 16.67);
    this.onUpdateCallback?.();
    this.frameId = requestAnimationFrame(() => this.loop());
  }

  update(dt: number): void {
    if (this.player.interferenceCooldown > 0) {
      this.player.interferenceCooldown -= dt;
    }

    if (this.player.poweredTimer > 0) {
      this.player.poweredTimer -= dt / 60;
      if (this.player.poweredTimer <= 0) {
        this.player.isPowered = false;
      }
    }
    if (this.player.slowedTimer > 0) {
      this.player.slowedTimer -= dt / 60;
      if (this.player.slowedTimer <= 0) {
        this.player.isSlowed = false;
      }
    }
    emitEvent('playerState', {
      radius: this.player.baseRadius,
      isPowered: this.player.isPowered,
      isSlowed: this.player.isSlowed,
    });

    const wasMoving = this.movePlayer(dt);

    if (wasMoving) {
      this.spawnTrail();
    }

    this.updateTrailParticles(dt);
    this.updateShockwaves(dt);
    this.updateInterferenceParticles(dt);

    this.spawnTimer += dt;
    if (this.spawnTimer >= 1) {
      this.spawnTimer = 0;
      this.spawnInterference();
    }

    this.checkEnergyBallCollection();
    this.checkInterferenceCollision();
    this.checkLevelExit();

    emitEvent('playerMove', { x: this.player.x, z: this.player.z });
  }

  private movePlayer(dt: number): boolean {
    const baseSpeed = this.player.isPowered
      ? 1.2
      : this.player.isSlowed
      ? 0.3
      : 0.8;

    let dx = 0;
    let dz = 0;

    if (this.keys.has('w')) dz -= 1;
    if (this.keys.has('s')) dz += 1;
    if (this.keys.has('a')) dx -= 1;
    if (this.keys.has('d')) dx += 1;

    if (dx === 0 && dz === 0) return false;

    const len = Math.sqrt(dx * dx + dz * dz);
    dx = (dx / len) * baseSpeed * dt;
    dz = (dz / len) * baseSpeed * dt;

    const newX = this.player.x + dx;
    const newZ = this.player.z + dz;

    const radius = this.getEffectiveRadius();
    const collisionX = mazeGenerator.checkWallCollision(
      newX,
      this.player.z,
      radius,
      this.mazeSize
    );
    const collisionZ = mazeGenerator.checkWallCollision(
      this.player.x,
      newZ,
      radius,
      this.mazeSize
    );
    const collisionBoth = mazeGenerator.checkWallCollision(
      newX,
      newZ,
      radius,
      this.mazeSize
    );

    let moved = false;
    let hitWall = false;

    if (!collisionBoth) {
      this.player.x = newX;
      this.player.z = newZ;
      moved = true;
    } else if (!collisionX) {
      this.player.x = newX;
      moved = true;
      hitWall = true;
    } else if (!collisionZ) {
      this.player.z = newZ;
      moved = true;
      hitWall = true;
    } else {
      hitWall = true;
    }

    if (hitWall || moved) {
      if (
        hitWall ||
        mazeGenerator.checkWallCollision(
          this.player.x,
          this.player.z,
          radius * 0.98,
          this.mazeSize
        )
      ) {
        emitEvent('playerCollision', { x: this.player.x, z: this.player.z });
        emitEvent('shake', { duration: 15, amplitude: 2 });
      }
    }

    const bound = (this.mazeSize - 1) / 2 + 0.3;
    this.player.x = Math.max(-bound, Math.min(bound, this.player.x));
    this.player.z = Math.max(-bound, Math.min(bound, this.player.z));

    return moved;
  }

  private spawnTrail(): void {
    for (let i = 0; i < 2; i++) {
      if (this.trailParticles.length >= 40) {
        this.trailParticles.shift();
      }
      this.trailParticles.push({
        x: this.player.x + (Math.random() - 0.5) * 0.1,
        z: this.player.z + (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        life: 1.5,
        maxLife: 1.5,
      });
    }
  }

  private updateTrailParticles(dt: number): void {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      this.trailParticles[i].life -= dt / 60;
      if (this.trailParticles[i].life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
  }

  private updateShockwaves(dt: number): void {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].life -= dt / 60;
      if (this.shockwaves[i].life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private updateInterferenceParticles(dt: number): void {
    for (let i = this.interferenceParticles.length - 1; i >= 0; i--) {
      const p = this.interferenceParticles[i];
      p.life -= dt / 60;
      const t = p.life / p.maxLife;
      p.opacity = Math.sin(t * Math.PI) * 0.6;
      p.size = 0.3 + Math.sin(performance.now() * 0.01 + i) * 0.1;
      if (p.life <= 0) {
        this.interferenceParticles.splice(i, 1);
      }
    }
  }

  private spawnInterference(): void {
    const maze = mazeGenerator.getMaze();
    if (!maze) return;

    if (this.interferenceParticles.length >= 5 + (this.level - 1) * 3) return;
    if (Math.random() > 0.15 * 60 / 60) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 2;
    const spawnX = this.player.x + Math.cos(angle) * dist;
    const spawnZ = this.player.z + Math.sin(angle) * dist;

    const radius = this.getEffectiveRadius() + 0.1;
    if (mazeGenerator.checkWallCollision(spawnX, spawnZ, radius, this.mazeSize)) {
      return;
    }

    this.interferenceParticles.push({
      x: spawnX,
      z: spawnZ,
      life: 0.5,
      maxLife: 0.5,
      size: 0.35,
      opacity: 0.3,
    });
  }

  private checkEnergyBallCollection(): void {
    const maze = mazeGenerator.getMaze();
    if (!maze) return;

    const playerRadius = this.getEffectiveRadius();

    for (const ball of maze.energyBalls) {
      if (ball.collected) continue;

      const dx = ball.x - this.player.x;
      const dz = ball.z - this.player.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < (0.6) * (0.6)) {
        ball.collected = true;
        this.player.collectedCount++;

        const sameColor = ball.color === this.player.lastEnergyColor;
        this.player.lastEnergyColor = ball.color;

        this.player.baseRadius = Math.min(
          0.6,
          this.player.baseRadius + 0.05
        );

        this.shockwaves.push({
          x: ball.x,
          z: ball.z,
          color: ball.color,
          life: 0.3,
          maxLife: 0.3,
          maxRadius: 1.5,
        });

        emitEvent('energyCollect', {
          color: ball.color,
          x: ball.x,
          z: ball.z,
          sameColor,
        });

        if (this.player.collectedCount % 5 === 0) {
          this.player.isPowered = true;
          this.player.poweredTimer = 3;
        }

        emitEvent('energyUpdate', {
          energy: this.player.collectedCount % 5,
          maxEnergy: 5,
        });
      }
    }
  }

  private checkInterferenceCollision(): void {
    if (this.player.isPowered) return;
    if (this.player.interferenceCooldown > 0) return;

    const playerRadius = this.getEffectiveRadius();

    for (const p of this.interferenceParticles) {
      const dx = p.x - this.player.x;
      const dz = p.z - this.player.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < (playerRadius + 0.5) * (playerRadius + 0.5)) {
        this.player.isSlowed = true;
        this.player.slowedTimer = 1;
        this.player.interferenceCooldown = 1;

        emitEvent('interferenceHit', {
          x: this.player.x,
          z: this.player.z,
        });
        emitEvent('flashRed', { duration: 0.5 });
        break;
      }
    }
  }

  private checkLevelExit(): void {
    const exitX = (this.mazeSize - 1) / 2;
    const exitZ = (this.mazeSize - 1) / 2;
    const dx = exitX - this.player.x;
    const dz = exitZ - this.player.z;
    if (dx * dx + dz * dz < 0.4 * 0.4) {
      emitEvent('levelComplete', { level: this.level, score: 0 });
    }
  }

  getEffectiveRadius(): number {
    return this.player.baseRadius;
  }

  getPlayer(): PlayerState {
    return this.player;
  }

  getTrailParticles(): TrailParticle[] {
    return this.trailParticles;
  }

  getInterferenceParticles(): InterferenceParticle[] {
    return this.interferenceParticles;
  }

  getShockwaves(): Shockwave[] {
    return this.shockwaves;
  }

  getMazeSize(): number {
    return this.mazeSize;
  }

  getLevel(): number {
    return this.level;
  }
}

export const physicsEngine = new PhysicsEngine();
