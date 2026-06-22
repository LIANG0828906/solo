import { eventBus, SegmentData, ObstacleData, EnergyBlockData, PlayerState } from './eventBus';
import { audioManager, AudioManager } from './audioManager';

export class RailGenerator {
  private segments: SegmentData[] = [];
  private currentSegmentIndex: number = 0;
  private playerState: PlayerState;
  private laneCount: number = 3;
  private laneSpacing: number = 2;
  private segmentLength: number = 12;
  private segmentWidth: number = 6;
  private gapSize: number = 0.5;
  private maxBendAngle: number = 45;
  private bendIncreaseInterval: number = 50;
  private baseSpeed: number = 10;
  private maxSpeed: number = 20;
  private speedIncrement: number = 1;
  private energyPerSpeedUp: number = 10;
  private isMobile: boolean;
  private totalDistance: number = 0;
  private lastBendUpdateDistance: number = 0;
  private currentBendAngle: number = 0;
  private jumpHeight: number = 3;
  private jumpDuration: number = 0.6;
  private jumpCooldown: number = 1;
  private gravity: number = -9.8;
  private initialJumpVelocity: number = 0;
  private targetLaneX: number = 0;
  private laneChangeSpeed: number = 15;
  private audioManager: AudioManager;

  constructor(isMobile: boolean = false) {
    this.isMobile = isMobile;
    this.applyMobileSettings();
    this.calculateJumpVelocity();
    this.playerState = this.createInitialState();
    this.targetLaneX = this.getLaneX(1);
    this.audioManager = audioManager;
  }

  private safePlayObstacle(): void {
    try {
      if (this.audioManager && this.audioManager.getIsInitialized()) {
        this.audioManager.playObstacle();
      }
    } catch (e) {
      console.warn('Failed to play obstacle sound:', e);
    }
  }

  private safePlayEnergy(): void {
    try {
      if (this.audioManager && this.audioManager.getIsInitialized()) {
        this.audioManager.playEnergy();
      }
    } catch (e) {
      console.warn('Failed to play energy sound:', e);
    }
  }

  private safePlayJump(): void {
    try {
      if (this.audioManager && this.audioManager.getIsInitialized()) {
        this.audioManager.playJump();
      }
    } catch (e) {
      console.warn('Failed to play jump sound:', e);
    }
  }

  private safePlayGameOver(): void {
    try {
      if (this.audioManager && this.audioManager.getIsInitialized()) {
        this.audioManager.playGameOver();
      }
    } catch (e) {
      console.warn('Failed to play game over sound:', e);
    }
  }

  private applyMobileSettings(): void {
    if (this.isMobile) {
      this.segmentLength = 8;
      this.laneSpacing = 1.5;
    }
  }

  private calculateJumpVelocity(): void {
    const halfDuration = this.jumpDuration / 2;
    this.gravity = (-2 * this.jumpHeight) / (halfDuration * halfDuration);
    this.initialJumpVelocity = -this.gravity * halfDuration;
  }

  private createInitialState(): PlayerState {
    return {
      x: 0,
      y: 0.5,
      z: 0,
      lane: 1,
      speed: this.baseSpeed,
      isJumping: false,
      jumpTime: 0,
      jumpCooldown: 0,
      lives: 3,
      score: 0,
      combo: 0,
      energyCollected: 0,
      distance: 0,
      isPaused: false,
      isGameOver: false,
      lastLifeLossTime: 0,
    };
  }

  getPlayerState(): PlayerState {
    return this.playerState;
  }

  getSegments(): SegmentData[] {
    return this.segments;
  }

  getSegmentLength(): number {
    return this.segmentLength;
  }

  getSegmentWidth(): number {
    return this.segmentWidth;
  }

  getGapSize(): number {
    return this.gapSize;
  }

  getLaneCount(): number {
    return this.laneCount;
  }

  getLaneSpacing(): number {
    return this.laneSpacing;
  }

  getLaneX(lane: number): number {
    return (lane - 1) * this.laneSpacing;
  }

  generateSegment(index: number): SegmentData {
    const startZ = index * (this.segmentLength + this.gapSize);
    const endZ = startZ + this.segmentLength;

    const distance = endZ;
    if (distance - this.lastBendUpdateDistance >= this.bendIncreaseInterval) {
      this.currentBendAngle = Math.min(
        this.currentBendAngle + 5,
        this.maxBendAngle
      );
      this.lastBendUpdateDistance = Math.floor(distance / this.bendIncreaseInterval) * this.bendIncreaseInterval;
    }

    const bendAngle = this.currentBendAngle * (Math.random() * 2 - 1);
    const tiltAngle = (this.currentBendAngle / this.maxBendAngle) * 10 * (Math.random() * 2 - 1);

    const obstacles = this.generateObstacles(startZ, endZ);
    const energyBlocks = this.generateEnergyBlocks(startZ, endZ);

    const segment: SegmentData = {
      index,
      length: this.segmentLength,
      width: this.segmentWidth,
      bendAngle,
      tiltAngle,
      startZ,
      endZ,
      obstacles,
      energyBlocks,
    };

    this.segments.push(segment);

    eventBus.emit({
      type: 'segmentGenerated',
      segmentIndex: index,
      segmentData: segment,
    });

    return segment;
  }

  private generateObstacles(startZ: number, endZ: number): ObstacleData[] {
    const count = Math.floor(Math.random() * 3);
    const obstacles: ObstacleData[] = [];
    const usedLanes = new Set<number>();

    for (let i = 0; i < count; i++) {
      let lane: number;
      do {
        lane = Math.floor(Math.random() * this.laneCount);
      } while (usedLanes.has(lane) && usedLanes.size < this.laneCount);
      
      if (usedLanes.size >= this.laneCount) break;
      usedLanes.add(lane);

      const z = startZ + Math.random() * (endZ - startZ - 2) + 1;
      const x = this.getLaneX(lane);

      obstacles.push({ x, z, lane, collected: false });
    }

    return obstacles;
  }

  private generateEnergyBlocks(startZ: number, endZ: number): EnergyBlockData[] {
    const blocks: EnergyBlockData[] = [];
    const zStep = (endZ - startZ) / 4;

    for (let i = 0; i < 3; i++) {
      const lane = Math.floor(Math.random() * this.laneCount);
      const z = startZ + zStep * (i + 1);
      const x = this.getLaneX(lane);

      blocks.push({ x, z, lane, collected: false, meshId: i });
    }

    return blocks;
  }

  update(deltaTime: number): void {
    if (this.playerState.isPaused || this.playerState.isGameOver) return;

    const moveDistance = this.playerState.speed * deltaTime;
    this.playerState.z += moveDistance;
    this.playerState.distance += moveDistance;
    this.totalDistance += moveDistance;

    this.currentSegmentIndex = Math.floor(
      this.playerState.z / (this.segmentLength + this.gapSize)
    );

    const currentSeg = this.segments.find(s => s.index === this.currentSegmentIndex);
    if (currentSeg) {
      const progress = (this.playerState.z - currentSeg.startZ) / currentSeg.length;
      const bendFactor = Math.sin(progress * Math.PI * 0.5);
      const trackOffset = bendFactor * Math.tan((currentSeg.bendAngle * Math.PI) / 180) * currentSeg.length * 0.3;
      
      this.targetLaneX = this.getLaneX(this.playerState.lane) + trackOffset;
    } else {
      this.targetLaneX = this.getLaneX(this.playerState.lane);
    }

    const xDiff = this.targetLaneX - this.playerState.x;
    const xMove = xDiff * this.laneChangeSpeed * deltaTime;
    this.playerState.x += xMove;

    if (this.playerState.isJumping) {
      this.playerState.jumpTime += deltaTime;
      this.playerState.y = 0.5 + this.initialJumpVelocity * this.playerState.jumpTime + 0.5 * this.gravity * this.playerState.jumpTime * this.playerState.jumpTime;
      
      if (this.playerState.y <= 0.5) {
        this.playerState.y = 0.5;
        this.playerState.isJumping = false;
        this.playerState.jumpTime = 0;
      }
    }

    if (this.playerState.jumpCooldown > 0) {
      this.playerState.jumpCooldown -= deltaTime;
    }

    this.checkCollisions();
    this.ensureSegmentsAhead();
    this.cleanupOldSegments();

    if (this.playerState.lives < 3) {
      const timeSinceLastLoss = performance.now() - this.playerState.lastLifeLossTime;
      if (timeSinceLastLoss > 5000 && this.playerState.lastLifeLossTime > 0) {
        this.playerState.lives = Math.min(3, this.playerState.lives + 1);
        this.playerState.lastLifeLossTime = performance.now();
        eventBus.emit({ type: 'lifeRestored', lives: this.playerState.lives });
      }
    }

    eventBus.emit({
      type: 'playerMoved',
      position: { x: this.playerState.x, y: this.playerState.y, z: this.playerState.z },
      lane: this.playerState.lane,
    });
  }

  private checkCollisions(): void {
    const playerRadius = 0.5;
    const groundY = 0.5;
    const isOnGround = this.playerState.y <= groundY + 0.1;

    for (const segment of this.segments) {
      if (this.playerState.z < segment.startZ - 1 || this.playerState.z > segment.endZ + 1) {
        continue;
      }

      for (const obstacle of segment.obstacles) {
        if (obstacle.collected) continue;

        const dx = Math.abs(this.playerState.x - obstacle.x);
        const dz = Math.abs(this.playerState.z - obstacle.z);

        if (dx < playerRadius + 0.5 && dz < playerRadius + 0.5) {
          if (isOnGround || this.playerState.y < 1.5) {
            obstacle.collected = true;
            this.handleObstacleCollision(obstacle);
          }
        }
      }

      for (const energy of segment.energyBlocks) {
        if (energy.collected) continue;

        const dx = Math.abs(this.playerState.x - energy.x);
        const dz = Math.abs(this.playerState.z - energy.z);
        const dy = Math.abs(this.playerState.y - 0.8);

        if (dx < playerRadius + 0.2 && dz < playerRadius + 0.2 && dy < 1) {
          energy.collected = true;
          this.handleEnergyCollection(energy);
        }
      }
    }
  }

  private handleObstacleCollision(obstacle: ObstacleData): void {
    const now = performance.now();
    const timeSinceLastLoss = now - this.playerState.lastLifeLossTime;

    if (timeSinceLastLoss < 1000) return;

    this.playerState.lives--;
    this.playerState.lastLifeLossTime = now;
    this.playerState.combo = 0;

    this.safePlayObstacle();

    eventBus.emit({
      type: 'collision',
      collisionType: 'obstacle',
      position: { x: obstacle.x, y: 0.5, z: obstacle.z },
    });

    eventBus.emit({
      type: 'scoreChanged',
      score: this.playerState.score,
      combo: this.playerState.combo,
    });

    eventBus.emit({
      type: 'lifeLost',
      lives: this.playerState.lives,
    });

    if (this.playerState.lives <= 0) {
      this.playerState.isGameOver = true;
      this.safePlayGameOver();
      eventBus.emit({
        type: 'gameOver',
        finalScore: this.playerState.score,
      });
    }
  }

  private handleEnergyCollection(energy: EnergyBlockData): void {
    this.playerState.combo++;
    const comboMultiplier = Math.floor(this.playerState.combo / 5) + 1;
    const points = 10 * comboMultiplier;
    this.playerState.score += points;
    this.playerState.energyCollected++;

    this.safePlayEnergy();

    this.updatePlayerSpeed();

    eventBus.emit({
      type: 'collision',
      collisionType: 'energy',
      position: { x: energy.x, y: 0.8, z: energy.z },
    });

    eventBus.emit({
      type: 'scoreChanged',
      score: this.playerState.score,
      combo: this.playerState.combo,
    });
  }

  updatePlayerSpeed(): void {
    const speedUps = Math.floor(this.playerState.energyCollected / this.energyPerSpeedUp);
    const newSpeed = Math.min(
      this.baseSpeed + speedUps * this.speedIncrement,
      this.maxSpeed
    );

    if (newSpeed !== this.playerState.speed) {
      this.playerState.speed = newSpeed;
      eventBus.emit({
        type: 'speedChanged',
        speed: this.playerState.speed,
      });
    }
  }

  moveLeft(): void {
    if (this.playerState.isPaused || this.playerState.isGameOver) return;
    if (this.playerState.lane > 0) {
      this.playerState.lane--;
    }
  }

  moveRight(): void {
    if (this.playerState.isPaused || this.playerState.isGameOver) return;
    if (this.playerState.lane < this.laneCount - 1) {
      this.playerState.lane++;
    }
  }

  jump(): void {
    if (this.playerState.isPaused || this.playerState.isGameOver) return;
    if (!this.playerState.isJumping && this.playerState.jumpCooldown <= 0) {
      this.playerState.isJumping = true;
      this.playerState.jumpTime = 0;
      this.playerState.jumpCooldown = this.jumpCooldown;
      this.safePlayJump();
    }
  }

  pause(): void {
    if (this.playerState.isPaused) return;
    this.playerState.isPaused = true;
  }

  resume(): void {
    if (!this.playerState.isPaused) return;
    this.playerState.isPaused = false;
  }

  restart(): void {
    this.segments = [];
    this.currentSegmentIndex = 0;
    this.totalDistance = 0;
    this.lastBendUpdateDistance = 0;
    this.currentBendAngle = 0;
    this.playerState = this.createInitialState();
    this.targetLaneX = this.getLaneX(1);

    for (let i = 0; i < 10; i++) {
      this.generateSegment(i);
    }

    eventBus.emit({ type: 'restart' });
    eventBus.emit({
      type: 'scoreChanged',
      score: 0,
      combo: 0,
    });
    eventBus.emit({
      type: 'speedChanged',
      speed: this.baseSpeed,
    });
  }

  private ensureSegmentsAhead(): void {
    const playerSegIndex = Math.floor(
      this.playerState.z / (this.segmentLength + this.gapSize)
    );

    const maxExisting = Math.max(...this.segments.map(s => s.index), -1);
    const neededAhead = playerSegIndex + 10;

    for (let i = maxExisting + 1; i <= neededAhead; i++) {
      this.generateSegment(i);
    }
  }

  private cleanupOldSegments(): void {
    const playerSegIndex = Math.floor(
      this.playerState.z / (this.segmentLength + this.gapSize)
    );
    const keepFromIndex = playerSegIndex - 5;

    this.segments = this.segments.filter(s => s.index >= keepFromIndex);
  }

  getCurrentSegmentIndex(): number {
    return this.currentSegmentIndex;
  }

  setMobile(isMobile: boolean): void {
    if (this.isMobile !== isMobile) {
      this.isMobile = isMobile;
      this.applyMobileSettings();
    }
  }

  getJumpHeight(): number {
    return this.jumpHeight;
  }
}
