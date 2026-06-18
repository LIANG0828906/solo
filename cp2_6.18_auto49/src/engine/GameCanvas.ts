import { GameState, Obstacle, Coin, BeatEvent } from './types';
import { BeatParser } from './BeatParser';
import { PhysicsSystem, createInitialPlayer } from './Physics';
import { eventBus } from '../core/EventBus';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  LANE_LEFT_X,
  LANE_CENTER_X,
  LANE_RIGHT_X,
  SCROLL_SPEED_BASE,
  BEAT_TOLERANCE_MS,
  INITIAL_HEALTH,
  COIN_VALUE_NORMAL,
  COIN_VALUE_CHORUS,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
  COIN_RADIUS,
  COLORS,
  SECTIONS,
} from './constants';

export class GameCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private beatParser: BeatParser;
  private physics: PhysicsSystem;
  private state: GameState;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private lastBeatIndex: number = -1;
  private audioTime: number = 0;
  private lastFrameTime: number = 0;
  private comboFlashTimer: number = 0;
  private comboBreakTimer: number = 0;
  private milestoneFlashTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.beatParser = new BeatParser();
    this.physics = new PhysicsSystem();
    this.state = this.createInitialState();
    this.setupEventListeners();
  }

  private createInitialState(): GameState {
    return {
      player: createInitialPlayer(),
      obstacles: [],
      coins: [],
      score: 0,
      health: INITIAL_HEALTH,
      beatIndex: -1,
      section: 'intro',
      coinsCollected: 0,
      survivalTime: 0,
      isPaused: false,
      isGameOver: false,
      scrollSpeed: SCROLL_SPEED_BASE,
      bgFlash: false,
      combo: 0,
      comboBreak: false,
      comboFlash: false,
      milestoneFlash: false,
      milestoneLevel: 0,
    };
  }

  private setupEventListeners(): void {
    eventBus.on('pauseToggle', () => {
      this.state.isPaused = !this.state.isPaused;
    });
    eventBus.on('restart', () => {
      this.restart();
    });
  }

  start(): void {
    this.state = this.createInitialState();
    this.lastTime = performance.now();
    this.lastBeatIndex = -1;
    this.lastFrameTime = this.lastTime;
    this.loop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  restart(): void {
    this.stop();
    this.start();
  }

  setAudioTime(timeMs: number): void {
    this.audioTime = timeMs;
  }

  private loop = (): void => {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;

    if (!this.state.isPaused && !this.state.isGameOver) {
      this.update(deltaTime);
    }

    this.render();
    eventBus.emit('gameState', { ...this.state });
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    this.state.survivalTime += deltaTime;
    this.state.player = this.physics.updatePlayer(
      this.state.player,
      deltaTime,
      this.state.isPaused
    );

    const beatIndex = this.beatParser.getCurrentBeatIndex(this.audioTime);
    if (beatIndex !== this.lastBeatIndex && beatIndex >= 0) {
      this.lastBeatIndex = beatIndex;
      this.state.beatIndex = beatIndex;
      this.state.section = this.beatParser.getSection(this.audioTime);
      
      const beatEvent: BeatEvent = {
        index: beatIndex,
        section: this.state.section,
        time: this.audioTime,
      };
      eventBus.emit('beat', beatEvent);

      this.spawnObstaclesAndCoins(beatIndex);
      this.updateScrollSpeed();
    }

    if (this.beatParser.isOnBeat(this.audioTime, BEAT_TOLERANCE_MS)) {
      if (this.state.section === 'chorus') {
        this.state.bgFlash = !this.state.bgFlash;
      }
    }

    this.updateObstacles(deltaTime);
    this.updateCoins(deltaTime);
    this.checkCollisions();
    this.updateComboTimers(deltaTime);
    this.updateMilestoneFlash(deltaTime);
  }

  private updateComboTimers(deltaTime: number): void {
    if (this.comboFlashTimer > 0) {
      this.comboFlashTimer -= deltaTime;
      if (this.comboFlashTimer <= 0) {
        this.state.comboFlash = false;
      }
    }
    if (this.comboBreakTimer > 0) {
      this.comboBreakTimer -= deltaTime;
      if (this.comboBreakTimer <= 0) {
        this.state.comboBreak = false;
      }
    }
  }

  private spawnObstaclesAndCoins(beatIndex: number): void {
    const section = this.state.section;
    const spawnX = CANVAS_WIDTH + 50;
    
    const obstacleMultiplier = section === 'chorus' ? 2 : 1;
    
    for (let i = 0; i < obstacleMultiplier; i++) {
      const leftObstacle: Obstacle = {
        x: spawnX + i * 100,
        y: GROUND_Y - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        lane: 'left',
        color: COLORS.obstacle,
        hit: false,
        passed: false,
      };
      
      const rightObstacle: Obstacle = {
        x: spawnX + i * 100,
        y: GROUND_Y - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        lane: 'right',
        color: COLORS.obstacle,
        hit: false,
        passed: false,
      };
      
      this.state.obstacles.push(leftObstacle, rightObstacle);
    }

    const coinInterval = section === 'chorus' ? 1 : 2;
    if (beatIndex % coinInterval === 0) {
      const coin: Coin = {
        x: spawnX + (obstacleMultiplier > 1 ? 50 : 0),
        y: GROUND_Y - 100,
        radius: COIN_RADIUS,
        collected: false,
        value: section === 'chorus' ? COIN_VALUE_CHORUS : COIN_VALUE_NORMAL,
      };
      this.state.coins.push(coin);
    }
  }

  private updateScrollSpeed(): void {
    const section = this.state.section;
    const baseSpeed = SCROLL_SPEED_BASE;
    if (section === 'intro') {
      this.state.scrollSpeed = baseSpeed;
    } else if (section === 'verse') {
      this.state.scrollSpeed = baseSpeed * 1.2;
    } else {
      this.state.scrollSpeed = baseSpeed * 1.5;
    }
  }

  private updateObstacles(deltaTime: number): void {
    const speed = this.state.scrollSpeed * 60 * deltaTime;
    let passedCount = 0;

    for (const obs of this.state.obstacles) {
      obs.x -= speed;
      
      if (!obs.passed && !obs.hit && obs.x + obs.width < 0) {
        obs.passed = true;
        passedCount++;
      }
    }

    this.state.obstacles = this.state.obstacles.filter((obs) => {
      return obs.x + obs.width >= -50;
    });

    if (passedCount > 0) {
      this.incrementCombo(passedCount);
    }
  }

  private updateCoins(deltaTime: number): void {
    const speed = this.state.scrollSpeed * 60 * deltaTime;
    
    this.state.coins = this.state.coins.filter((coin) => {
      coin.x -= speed;
      if (coin.x + coin.radius < 0) {
        return false;
      }
      return !coin.collected;
    });
  }

  private checkCollisions(): void {
    const { player, obstacles, coins } = this.state;

    for (const obstacle of obstacles) {
      if (!obstacle.hit && this.physics.checkPlayerObstacleCollision(player, obstacle)) {
        obstacle.hit = true;
        this.state.health = Math.max(0, this.state.health - 1);
        eventBus.emit('collision', { type: 'obstacle', damage: 1 });
        
        this.resetCombo();
        
        if (this.state.health <= 0) {
          this.gameOver();
        }
      }
    }

    for (const coin of coins) {
      if (!coin.collected && this.physics.checkPlayerCoinCollision(player, coin)) {
        coin.collected = true;
        this.state.score += coin.value;
        this.state.coinsCollected += 1;
        eventBus.emit('collision', { type: 'coin', value: coin.value });
        
        this.incrementCombo(1);
      }
    }
  }

  private incrementCombo(amount: number): void {
    const previousCombo = this.state.combo;
    this.state.combo += amount;
    
    eventBus.emit('comboIncrement', { 
      combo: this.state.combo, 
      previousCombo 
    });

    const thresholds = [5, 10, 20];
    for (const threshold of thresholds) {
      if (previousCombo < threshold && this.state.combo >= threshold) {
        this.triggerComboMilestone(threshold);
        break;
      }
    }

    this.state.comboFlash = true;
    this.comboFlashTimer = 0.2;
  }

  private resetCombo(): void {
    if (this.state.combo > 0) {
      eventBus.emit('comboBreak', { 
        previousCombo: this.state.combo 
      });
      this.state.combo = 0;
      this.state.comboBreak = true;
      this.comboBreakTimer = 1.0;
    }
  }

  private triggerComboMilestone(threshold: number): void {
    this.state.milestoneFlash = true;
    this.state.milestoneLevel = threshold;
    this.milestoneFlashTimer = 0.5;
    
    eventBus.emit('comboMilestone', { 
      threshold, 
      combo: this.state.combo 
    });
  }

  private updateMilestoneFlash(deltaTime: number): void {
    if (this.milestoneFlashTimer > 0) {
      this.milestoneFlashTimer -= deltaTime;
      const progress = this.milestoneFlashTimer / 0.5;
      
      if (this.milestoneFlashTimer <= 0) {
        this.state.milestoneFlash = false;
        this.state.milestoneLevel = 0;
      }
    }
  }

  private gameOver(): void {
    this.state.isGameOver = true;
    eventBus.emit('gameOver', {
      score: this.state.score,
      coins: this.state.coinsCollected,
      time: this.state.survivalTime,
    });
    this.stop();
  }

  private render(): void {
    const { ctx, state } = this;
    
    let bgColor = state.section === 'chorus' && state.bgFlash
      ? COLORS.bgAlt
      : COLORS.bgPrimary;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (state.comboFlash) {
      const flashAlpha = 0.15 + (this.comboFlashTimer / 0.2) * 0.15;
      ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.strokeStyle = `rgba(255, 215, 0, ${flashAlpha})`;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
    }

    if (state.milestoneFlash && state.milestoneLevel > 0) {
      const progress = this.milestoneFlashTimer / 0.5;
      const pulseIntensity = Math.sin(progress * Math.PI);
      
      let flashColor: string;
      let alpha: number;
      
      if (state.milestoneLevel >= 20) {
        flashColor = '255, 215, 0';
        alpha = 0.4 * pulseIntensity;
      } else if (state.milestoneLevel >= 10) {
        flashColor = '192, 192, 192';
        alpha = 0.3 * pulseIntensity;
      } else {
        flashColor = '205, 127, 50';
        alpha = 0.25 * pulseIntensity;
      }
      
      ctx.fillStyle = `rgba(${flashColor}, ${alpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const borderWidth = 12 + pulseIntensity * 8;
      ctx.strokeStyle = `rgba(${flashColor}, ${alpha + 0.2})`;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, CANVAS_WIDTH - borderWidth, CANVAS_HEIGHT - borderWidth);
      
      if (state.milestoneLevel >= 10) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
          const radius = 100 + pulseIntensity * 200;
          const x = CANVAS_WIDTH / 2 + Math.cos(angle) * radius;
          const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * radius;
          
          ctx.beginPath();
          ctx.arc(x, y, 4 + pulseIntensity * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${flashColor}, ${alpha + 0.3})`;
          ctx.fill();
        }
      }
      
      if (state.milestoneLevel >= 20) {
        const scanY = (1 - progress) * CANVAS_HEIGHT;
        const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanY - 50, CANVAS_WIDTH, 100);
      }
    }

    this.renderTrack();
    this.renderObstacles();
    this.renderCoins();
    this.renderPlayer();
    this.renderGround();
  }

  private renderTrack(): void {
    const { ctx } = this;
    
    ctx.strokeStyle = COLORS.accentPrimary;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    ctx.beginPath();
    ctx.moveTo(LANE_LEFT_X, 0);
    ctx.lineTo(LANE_LEFT_X, CANVAS_HEIGHT);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(LANE_RIGHT_X, 0);
    ctx.lineTo(LANE_RIGHT_X, CANVAS_HEIGHT);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    const trackGradient = ctx.createLinearGradient(
      0, GROUND_Y,
      0, CANVAS_HEIGHT
    );
    trackGradient.addColorStop(0, '#1A1A2E');
    trackGradient.addColorStop(1, '#0B0B1A');
    ctx.fillStyle = trackGradient;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  }

  private renderGround(): void {
    const { ctx } = this;
    ctx.strokeStyle = COLORS.accentSecondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
  }

  private renderObstacles(): void {
    const { ctx, state } = this;
    for (const obs of state.obstacles) {
      const x = obs.x - obs.width / 2;
      
      const gradient = ctx.createLinearGradient(
        x, obs.y,
        x + obs.width, obs.y + obs.height
      );
      gradient.addColorStop(0, '#9B59B6');
      gradient.addColorStop(1, COLORS.obstacle);
      ctx.fillStyle = gradient;
      
      ctx.fillRect(x, obs.y, obs.width, obs.height);
      
      ctx.strokeStyle = '#BF80FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, obs.y, obs.width, obs.height);
      
      if (obs.hit) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
        ctx.fillRect(x, obs.y, obs.width, obs.height);
      }
    }
  }

  private renderCoins(): void {
    const { ctx, state } = this;
    for (const coin of state.coins) {
      if (coin.collected) continue;
      
      const gradient = ctx.createRadialGradient(
        coin.x, coin.y, 0,
        coin.x, coin.y, coin.radius
      );
      gradient.addColorStop(0, '#FFEB3B');
      gradient.addColorStop(1, COLORS.coin);
      ctx.fillStyle = gradient;
      
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private renderPlayer(): void {
    const { ctx, state } = this;
    const { player } = state;
    
    const x = player.x - player.width / 2;
    const y = player.y;
    
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, player.width, player.height);
    
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, player.width, player.height);
    
    ctx.fillStyle = '#FFF';
    const eyeY = y + 8;
    ctx.fillRect(x + 6, eyeY, 4, 4);
    ctx.fillRect(x + 14, eyeY, 4, 4);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 7, eyeY + 1, 2, 2);
    ctx.fillRect(x + 15, eyeY + 1, 2, 2);
  }

  getState(): GameState {
    return { ...this.state };
  }

  destroy(): void {
    this.stop();
    this.physics.cleanup();
    eventBus.clear();
  }
}
