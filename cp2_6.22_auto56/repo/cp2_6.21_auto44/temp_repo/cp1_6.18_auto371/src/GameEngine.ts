import { v4 as uuidv4 } from 'uuid';
import {
  BeatAnalysisResult,
  BeatData,
  BeatPoint,
  GameState,
  GlowEffect,
  LANES,
  LaneIndex,
  Obstacle,
  ObstacleType,
  Particle,
  PlayerState,
  TRACK_SPACING,
  OBSTACLE_SPAWN_X,
  PLAYER_X,
  PLAYER_BASE_Y,
  JUMP_HEIGHT,
  JUMP_DURATION,
  LANE_TRANSITION_DURATION,
  SLIDE_DURATION,
  BASE_SPEED,
  CANVAS_HEIGHT,
} from './types';

export class GameEngine {
  private beatAnalysis: BeatAnalysisResult | null = null;
  private gameState: GameState;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private onStateChange: ((state: GameState) => void) | null = null;
  private lastBeatProcessed: number = -1;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.gameState = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      status: 'idle',
      score: 0,
      combo: 0,
      maxCombo: 0,
      beatPointsCollected: 0,
      obstacles: [],
      beatPoints: [],
      particles: [],
      glowEffects: [],
      player: this.createInitialPlayer(),
      currentTime: 0,
      speedMultiplier: 1.0,
      lastBeatIndex: -1,
      comboEffect: 0,
      gameTime: 0,
    };
  }

  private createInitialPlayer(): PlayerState {
    return {
      lane: 1,
      targetLane: 1,
      x: PLAYER_X,
      y: PLAYER_BASE_Y,
      baseY: PLAYER_BASE_Y,
      isJumping: false,
      jumpTime: 0,
      jumpDuration: JUMP_DURATION,
      jumpHeight: JUMP_HEIGHT,
      isSliding: false,
      slideTime: 0,
      slideDuration: SLIDE_DURATION,
      laneTransitionTime: 0,
      laneTransitionDuration: LANE_TRANSITION_DURATION,
      radius: 12,
      opacity: 1,
      scale: 1,
    };
  }

  setBeatAnalysis(analysis: BeatAnalysisResult): void {
    this.beatAnalysis = analysis;
  }

  setStateChangeListener(listener: (state: GameState) => void): void {
    this.onStateChange = listener;
  }

  getState(): GameState {
    return { ...this.gameState };
  }

  start(): void {
    if (this.gameState.status === 'playing') return;

    this.gameState = this.createInitialState();
    this.gameState.status = 'playing';
    this.lastFrameTime = performance.now();
    this.lastBeatProcessed = -1;
    this.setupInputHandlers();
    this.gameLoop();
    this.notifyStateChange();
  }

  pause(): void {
    if (this.gameState.status !== 'playing') return;
    this.gameState.status = 'paused';
    this.notifyStateChange();
  }

  resume(): void {
    if (this.gameState.status !== 'paused') return;
    this.gameState.status = 'playing';
    this.lastFrameTime = performance.now();
    this.gameLoop();
    this.notifyStateChange();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.removeInputHandlers();
    this.gameState.status = 'idle';
  }

  private gameOver(): void {
    this.gameState.status = 'gameover';
    this.stop();
    this.notifyStateChange();
  }

  private setupInputHandlers(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (this.gameState.status !== 'playing') return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.jump();
          break;
        case 'KeyA':
        case 'ArrowLeft':
          e.preventDefault();
          this.switchLane(-1);
          break;
        case 'KeyD':
        case 'ArrowRight':
          e.preventDefault();
          this.switchLane(1);
          break;
        case 'KeyS':
        case 'ArrowDown':
          e.preventDefault();
          this.slide();
          break;
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private removeInputHandlers(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  private jump(): void {
    if (this.gameState.player.isJumping || this.gameState.player.isSliding) return;
    this.gameState.player.isJumping = true;
    this.gameState.player.jumpTime = 0;
  }

  private switchLane(direction: -1 | 1): void {
    const player = this.gameState.player;
    if (player.laneTransitionTime < player.laneTransitionDuration) return;

    const newLane = Math.max(0, Math.min(2, player.targetLane + direction)) as LaneIndex;
    if (newLane === player.targetLane) return;

    player.targetLane = newLane;
    player.laneTransitionTime = 0;
  }

  private slide(): void {
    if (this.gameState.player.isJumping || this.gameState.player.isSliding) return;
    this.gameState.player.isSliding = true;
    this.gameState.player.slideTime = 0;
  }

  private gameLoop = (): void => {
    if (this.gameState.status !== 'playing') return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.update(deltaTime);
    this.notifyStateChange();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    this.gameState.gameTime += deltaTime;
    this.gameState.currentTime = this.gameState.gameTime / 1000;

    this.updateSpeedMultiplier();
    this.processBeats();
    this.updatePlayer(deltaTime);
    this.updateObstacles(deltaTime);
    this.updateBeatPoints(deltaTime);
    this.updateParticles(deltaTime);
    this.updateGlowEffects(deltaTime);
    this.checkCollisions();
    this.updateComboEffect(deltaTime);
  }

  private updateSpeedMultiplier(): void {
    const speedIncrements = Math.floor(this.gameState.gameTime / 30000);
    this.gameState.speedMultiplier = 1 + speedIncrements * 0.1;
  }

  private processBeats(): void {
    if (!this.beatAnalysis || this.beatAnalysis.beats.length === 0) return;

    const currentTime = this.gameState.currentTime;

    for (let i = this.lastBeatProcessed + 1; i < this.beatAnalysis.beats.length; i++) {
      const beat = this.beatAnalysis.beats[i];
      const timeDiff = beat.timestamp - currentTime;

      if (timeDiff < -0.1) {
        this.lastBeatProcessed = i;
        continue;
      }

      if (timeDiff <= 0) {
        this.handleBeat(beat);
        this.lastBeatProcessed = i;
        this.gameState.lastBeatIndex = i;
      }
      break;
    }
  }

  private handleBeat(beat: BeatData): void {
    if (beat.isStrong) {
      this.spawnObstacleByBeat(beat, true);
      this.spawnBeatPoints(beat);
      this.addFullscreenBeatGlow();
    } else if (Math.random() < 0.3) {
      this.spawnObstacleByBeat(beat, false);
    }
  }

  private spawnObstacleByBeat(_beat: BeatData, isStrong: boolean): void {
    const types: ObstacleType[] = isStrong
      ? ['spike', 'bar', 'missile']
      : ['spike', 'bar'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = LANES[Math.floor(Math.random() * 3)];

    this.spawnObstacle(type, lane);
  }

  private spawnObstacle(type: ObstacleType, lane: LaneIndex): void {
    const speed = BASE_SPEED * this.gameState.speedMultiplier;
    const laneY = this.getLaneY(lane);

    let obstacle: Obstacle;

    switch (type) {
      case 'spike':
        obstacle = {
          id: uuidv4(),
          type,
          lane,
          x: OBSTACLE_SPAWN_X,
          y: laneY,
          width: 30,
          height: 30,
          speed,
          passed: false,
        };
        break;
      case 'bar':
        obstacle = {
          id: uuidv4(),
          type,
          lane,
          x: OBSTACLE_SPAWN_X,
          y: laneY - 60,
          width: 60,
          height: 20,
          speed,
          passed: false,
        };
        break;
      case 'missile':
        obstacle = {
          id: uuidv4(),
          type,
          lane,
          x: OBSTACLE_SPAWN_X,
          y: laneY - 20,
          width: 24,
          height: 24,
          speed: speed * 1.5,
          passed: false,
        };
        break;
    }

    this.gameState.obstacles.push(obstacle);
  }

  private spawnBeatPoints(_beat: BeatData): void {
    LANES.forEach((lane) => {
      const beatPoint: BeatPoint = {
        id: uuidv4(),
        lane,
        x: OBSTACLE_SPAWN_X,
        collected: false,
      };
      this.gameState.beatPoints.push(beatPoint);
    });
  }

  private addFullscreenBeatGlow(): void {
    const glow: GlowEffect = {
      id: uuidv4(),
      x: 450,
      y: 300,
      radius: 0,
      maxRadius: 500,
      opacity: 0,
      maxOpacity: 0.3,
      life: 0,
      maxLife: 800,
      color: '#00E5FF',
    };
    this.gameState.glowEffects.push(glow);
  }

  private getLaneY(lane: LaneIndex): number {
    return PLAYER_BASE_Y + (lane - 1) * TRACK_SPACING;
  }

  private getLaneX(lane: LaneIndex): number {
    return PLAYER_X + (lane - 1) * TRACK_SPACING;
  }

  private updatePlayer(deltaTime: number): void {
    const player = this.gameState.player;

    if (player.laneTransitionTime < player.laneTransitionDuration) {
      player.laneTransitionTime += deltaTime;
      const t = Math.min(1, player.laneTransitionTime / player.laneTransitionDuration);
      const easeT = 1 - Math.pow(1 - t, 3);
      const currentLaneX = this.getLaneX(player.lane);
      const targetLaneX = this.getLaneX(player.targetLane);
      player.x = currentLaneX + (targetLaneX - currentLaneX) * easeT;

      if (t >= 1) {
        player.lane = player.targetLane;
      }

      this.addLaneTrailParticles();
    } else {
      player.x = this.getLaneX(player.lane);
    }

    if (player.isJumping) {
      player.jumpTime += deltaTime;
      const t = player.jumpTime / player.jumpDuration;

      if (t >= 1) {
        player.isJumping = false;
        player.y = player.baseY;
        player.opacity = 1;
        player.scale = 1;
      } else {
        const jumpProgress = Math.sin(t * Math.PI);
        player.y = player.baseY - jumpProgress * player.jumpHeight;
        player.opacity = 0.5 + 0.5 * (1 - jumpProgress);
        player.scale = 0.8 + 0.2 * (1 - jumpProgress);
      }

      this.addJumpParticles();
    } else if (player.isSliding) {
      player.slideTime += deltaTime;
      const t = player.slideTime / player.slideDuration;

      if (t >= 1) {
        player.isSliding = false;
        player.scale = 1;
      } else {
        player.scale = 0.6;
        player.y = player.baseY + 15;
      }
    } else {
      player.y = player.baseY;
      player.opacity = 1;
      player.scale = 1;
    }
  }

  private addJumpParticles(): void {
    const player = this.gameState.player;
    for (let i = 0; i < 3; i++) {
      const particle: Particle = {
        id: uuidv4(),
        x: player.x + (Math.random() - 0.5) * 10,
        y: player.y + player.radius + Math.random() * 5,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1 + 0.5,
        life: 0,
        maxLife: 400,
        color: '#00E5FF',
        size: 3,
      };
      this.gameState.particles.push(particle);
    }
  }

  private addLaneTrailParticles(): void {
    const player = this.gameState.player;
    const particle: Particle = {
      id: uuidv4(),
      x: player.x,
      y: player.y,
      vx: -2 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 1,
      life: 0,
      maxLife: 300,
      color: '#00E5FF',
      size: 4,
    };
    this.gameState.particles.push(particle);
  }

  private addCollectGlow(x: number, y: number): void {
    const glow: GlowEffect = {
      id: uuidv4(),
      x,
      y,
      radius: 0,
      maxRadius: 60,
      opacity: 0,
      maxOpacity: 0.6,
      life: 0,
      maxLife: 500,
      color: '#00BFFF',
    };
    this.gameState.glowEffects.push(glow);
  }

  private updateObstacles(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    this.gameState.obstacles = this.gameState.obstacles.filter((obs) => {
      obs.x -= obs.speed * dt;
      return obs.x > -100;
    });
  }

  private updateBeatPoints(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    const speed = BASE_SPEED * this.gameState.speedMultiplier;
    this.gameState.beatPoints = this.gameState.beatPoints.filter((bp) => {
      bp.x -= speed * dt;
      return bp.x > -50 && !bp.collected;
    });
  }

  private updateParticles(deltaTime: number): void {
    this.gameState.particles = this.gameState.particles.filter((p) => {
      p.life += deltaTime;
      p.x += p.vx;
      p.y += p.vy;
      return p.life < p.maxLife;
    });
  }

  private updateGlowEffects(deltaTime: number): void {
    this.gameState.glowEffects = this.gameState.glowEffects.filter((g) => {
      g.life += deltaTime;
      const t = g.life / g.maxLife;
      g.radius = g.maxRadius * t;
      g.opacity = g.maxOpacity * (1 - t);
      return g.life < g.maxLife;
    });
  }

  private checkCollisions(): void {
    const player = this.gameState.player;
    const playerLeft = player.x - player.radius * player.scale;
    const playerRight = player.x + player.radius * player.scale;
    const playerTop = player.y - player.radius * player.scale;
    const playerBottom = player.y + player.radius * player.scale;

    for (const obs of this.gameState.obstacles) {
      if (obs.passed) continue;

      const obsLaneY = this.getLaneY(obs.lane);
      let actualObsY = obs.y;
      let actualObsHeight = obs.height;

      if (obs.type === 'spike') {
        actualObsY = obsLaneY - obs.height;
      }

      const obsLeft = obs.x - obs.width / 2;
      const obsRight = obs.x + obs.width / 2;
      const obsTop = actualObsY;
      const obsBottom = actualObsY + actualObsHeight;

      const xOverlap = playerRight > obsLeft && playerLeft < obsRight;
      if (!xOverlap) continue;

      let collides = false;

      if (obs.type === 'spike') {
        if (!player.isJumping || player.y > obsLaneY - obs.height + 20) {
          if (player.lane === obs.lane || Math.abs(player.x - obs.x) < 30) {
            collides = true;
          }
        }
      } else if (obs.type === 'bar') {
        if (player.isSliding) {
          collides = false;
        } else if (!player.isJumping || player.jumpTime < player.jumpDuration * 0.2 || player.jumpTime > player.jumpDuration * 0.8) {
          if (player.lane === obs.lane) {
            collides = true;
          }
        }
      } else if (obs.type === 'missile') {
        const dx = player.x - obs.x;
        const dy = player.y - (actualObsY + actualObsHeight / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + obs.width / 2) {
          collides = true;
        }
      }

      void playerTop;
      void playerBottom;
      void obsTop;
      void obsBottom;

      if (collides) {
        this.gameOver();
        return;
      }
    }

    for (const bp of this.gameState.beatPoints) {
      if (bp.collected) continue;

      const bpY = this.getLaneY(bp.lane);
      const dx = player.x - bp.x;
      const dy = player.y - bpY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < player.radius + 20) {
        bp.collected = true;
        this.collectBeatPoint(bp.x, bpY);
      }
    }

    if (player.y > CANVAS_HEIGHT + 100) {
      this.gameOver();
    }
  }

  private collectBeatPoint(x: number, y: number): void {
    this.gameState.score += 100;
    this.gameState.beatPointsCollected++;
    this.gameState.combo++;
    this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);

    this.addCollectGlow(x, y);

    if (this.gameState.combo === 5) {
      this.triggerComboEffect(1);
    } else if (this.gameState.combo === 10) {
      this.triggerComboEffect(2);
    } else if (this.gameState.combo === 15) {
      this.triggerComboEffect(3);
    }
  }

  private triggerComboEffect(level: number): void {
    this.gameState.comboEffect = level;
  }

  private updateComboEffect(deltaTime: number): void {
    if (this.gameState.comboEffect > 0) {
      const duration = this.gameState.comboEffect === 2 ? 300 : 1000;
      (this.gameState as GameState & { comboEffectTime?: number }).comboEffectTime =
        ((this.gameState as GameState & { comboEffectTime?: number }).comboEffectTime || 0) + deltaTime;

      if ((this.gameState as GameState & { comboEffectTime?: number }).comboEffectTime! >= duration) {
        this.gameState.comboEffect = 0;
        (this.gameState as GameState & { comboEffectTime?: number }).comboEffectTime = 0;
      }
    }
  }

  resetCombo(): void {
    this.gameState.combo = 0;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.gameState });
    }
  }

  dispose(): void {
    this.stop();
    this.beatAnalysis = null;
    this.onStateChange = null;
  }
}
