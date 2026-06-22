import type { Obstacle, BeatFragment, Particle, HitResult, PlayerAction, GradeType } from '../types';
import { BeatAnalyzer } from '../audio/BeatAnalyzer';
import { MusicPlayer } from '../audio/MusicPlayer';
import { useGameStore } from '../store/gameStore';

type GameEvent =
  | { type: 'beat'; beatIndex: number; timeMs: number }
  | { type: 'hit'; result: HitResult; action: PlayerAction }
  | { type: 'sectionEnd'; grade: GradeType; syncRate: number }
  | { type: 'gameEnd' }
  | { type: 'progress'; progress: number };

export class GameCore {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private beatAnalyzer: BeatAnalyzer;
  private musicPlayer: MusicPlayer;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private canvasWidth: number = 480;
  private canvasHeight: number = 640;
  private playerX: number = 80;
  private playerY: number = 0;
  private playerGroundY: number = 0;
  private playerState: 'run' | 'jump' | 'slide' = 'run';
  private playerStateTime: number = 0;
  private playerLean: number = 0;
  private playerLeanTime: number = 0;
  private runFrame: number = 0;
  private runFrameTime: number = 0;
  private obstacles: Obstacle[] = [];
  private fragments: BeatFragment[] = [];
  private particles: Particle[] = [];
  private beatTimestamps: number[] = [];
  private currentBeatIndex: number = -1;
  private nextObstacleId: number = 0;
  private nextFragmentId: number = 0;
  private nextParticleId: number = 0;
  private hitGlow: number = 0;
  private screenFlash: number = 0;
  private lastActionTime: number = -1000;
  private lastActionResult: HitResult = null;
  private sectionBeats: number = 32;
  private sectionPerfect: number = 0;
  private sectionGood: number = 0;
  private sectionMiss: number = 0;
  private sectionStartBeat: number = 0;
  private totalPerfect: number = 0;
  private totalGood: number = 0;
  private totalMiss: number = 0;
  private scrollSpeed: number = 300;
  private listeners: Map<string, Array<(event: GameEvent) => void>> = new Map();
  private beatProcessed: Set<number> = new Set();
  private sectionSyncHistory: number[] = [];
  private bgOffset: number = 0;
  private neonOffset: number = 0;

  constructor() {
    this.beatAnalyzer = new BeatAnalyzer();
    this.musicPlayer = new MusicPlayer(this.beatAnalyzer);
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    this.beatAnalyzer.init();
    this.musicPlayer.init();
    this.musicPlayer.onBeat((beatIndex, timeMs) => this.handleBeat(beatIndex, timeMs));
    this.musicPlayer.onProgress((progress) => useGameStore.getState().setMusicProgress(progress));
    this.musicPlayer.onEnd(() => this.handleGameEnd());
    this.playerGroundY = this.canvasHeight * 0.7;
    this.playerY = this.playerGroundY;
  }

  resize(): void {
    if (!this.canvas) return;
    const maxWidth = Math.min(window.innerWidth, 480);
    const minWidth = 320;
    this.canvasWidth = Math.max(minWidth, maxWidth);
    this.canvasHeight = Math.floor(window.innerHeight * 0.8);
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.canvas.style.width = this.canvasWidth + 'px';
    this.canvas.style.height = this.canvasHeight + 'px';
    this.playerGroundY = this.canvasHeight * 0.7;
    if (this.playerState === 'run') {
      this.playerY = this.playerGroundY;
    }
  }

  on(event: string, callback: (event: GameEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (event: GameEvent) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx >= 0) callbacks.splice(idx, 1);
    }
  }

  private emit(event: string, data: GameEvent): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  async startLevel(beatTimestamps: number[], bpm: number): Promise<void> {
    this.beatTimestamps = beatTimestamps;
    this.currentBeatIndex = -1;
    this.obstacles = [];
    this.fragments = [];
    this.particles = [];
    this.beatProcessed.clear();
    this.sectionPerfect = 0;
    this.sectionGood = 0;
    this.sectionMiss = 0;
    this.sectionStartBeat = 0;
    this.totalPerfect = 0;
    this.totalGood = 0;
    this.totalMiss = 0;
    this.sectionSyncHistory = [];
    this.playerState = 'run';
    this.playerY = this.playerGroundY;
    this.scrollSpeed = (bpm / 128) * 300;
    await this.musicPlayer.loadLevel(bpm, beatTimestamps[beatTimestamps.length - 1] + 2000);
    await this.musicPlayer.play();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  pause(): void {
    this.musicPlayer.pause();
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    this.musicPlayer.play();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.musicPlayer.stop();
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  handleInput(action: PlayerAction): void {
    if (!this.isRunning || !action) return;
    const currentTime = this.musicPlayer.getCurrentTime();
    this.lastActionTime = currentTime;
    const { index, offset } = this.beatAnalyzer.findNearestBeat(currentTime, this.beatTimestamps);
    let result: HitResult = 'miss';
    if (index >= 0 && Math.abs(offset) <= 150 && !this.beatProcessed.has(index)) {
      result = this.beatAnalyzer.evaluateHit(offset);
      this.beatProcessed.add(index);
      this.handleHitResult(result, action);
    } else {
      result = 'miss';
      this.handleHitResult('miss', action);
    }
    this.lastActionResult = result;
    if (action === 'jump' && this.playerState === 'run') {
      this.playerState = 'jump';
      this.playerStateTime = 0;
    } else if (action === 'slide' && this.playerState === 'run') {
      this.playerState = 'slide';
      this.playerStateTime = 0;
      for (let i = 0; i < 8; i++) {
        this.spawnParticle(this.playerX - 10, this.playerY - 8, '#00D4FF', -Math.random() * 3 - 1, (Math.random() - 0.5) * 2, 300);
      }
    }
    this.emit('hit', { type: 'hit', result, action });
  }

  private handleBeat(beatIndex: number, timeMs: number): void {
    if (beatIndex <= this.currentBeatIndex) return;
    this.currentBeatIndex = beatIndex;
    useGameStore.getState().setCurrentBeatIndex(beatIndex);
    useGameStore.getState().setBeatHighlight(true);
    setTimeout(() => useGameStore.getState().setBeatHighlight(false), 200);
    this.spawnObstacle(beatIndex);
    this.spawnFragment(beatIndex);
    this.emit('beat', { type: 'beat', beatIndex, timeMs });
  }

  private handleHitResult(result: HitResult, action: PlayerAction): void {
    const store = useGameStore.getState();
    if (result === 'perfect') {
      store.addScore(10);
      store.incrementCombo();
      store.recordHit('perfect');
      store.setPlayerActionResult('perfect');
      this.sectionPerfect++;
      this.totalPerfect++;
      this.hitGlow = 200;
      this.screenFlash = 100;
    } else if (result === 'good') {
      store.addScore(5);
      store.incrementCombo();
      store.recordHit('good');
      store.setPlayerActionResult('good');
      this.sectionGood++;
      this.totalGood++;
      this.hitGlow = 200;
    } else {
      store.addScore(-5);
      store.resetCombo();
      store.recordHit('miss');
      store.setPlayerActionResult('miss');
      this.sectionMiss++;
      this.totalMiss++;
      this.playerLean = 8;
      this.playerLeanTime = 150;
    }
    store.setLastHitResult(result);
    this.updateSyncRate();
    this.checkSectionEnd();
  }

  private updateSyncRate(): void {
    const total = this.totalPerfect + this.totalGood + this.totalMiss;
    if (total === 0) {
      useGameStore.getState().setSyncRate(100);
      return;
    }
    const rate = ((this.totalPerfect * 100 + this.totalGood * 70) / (total * 100)) * 100;
    useGameStore.getState().setSyncRate(Math.round(rate));
  }

  private checkSectionEnd(): void {
    const sectionBeats = this.currentBeatIndex - this.sectionStartBeat + 1;
    if (sectionBeats >= this.sectionBeats) {
      const sectionTotal = this.sectionPerfect + this.sectionGood + this.sectionMiss;
      let sectionRate = 100;
      if (sectionTotal > 0) {
        sectionRate = ((this.sectionPerfect * 100 + this.sectionGood * 70) / (sectionTotal * 100)) * 100;
      }
      const grade = this.calculateGrade(sectionRate);
      this.sectionSyncHistory.push(sectionRate);
      useGameStore.getState().addSyncRateHistory(sectionRate);
      useGameStore.getState().setShowGrade(true, grade);
      this.emit('sectionEnd', { type: 'sectionEnd', grade, syncRate: sectionRate });
      setTimeout(() => useGameStore.getState().setShowGrade(false), 800);
      this.sectionPerfect = 0;
      this.sectionGood = 0;
      this.sectionMiss = 0;
      this.sectionStartBeat = this.currentBeatIndex + 1;
    }
  }

  private calculateGrade(rate: number): GradeType {
    if (rate >= 95) return 'S';
    if (rate >= 80) return 'A';
    if (rate >= 60) return 'B';
    return 'C';
  }

  private handleGameEnd(): void {
    this.isRunning = false;
    const total = this.totalPerfect + this.totalGood + this.totalMiss;
    const avgRate = total > 0
      ? ((this.totalPerfect * 100 + this.totalGood * 70) / (total * 100)) * 100
      : 100;
    const grade = this.calculateGrade(avgRate);
    useGameStore.getState().setGameStats({
      totalScore: useGameStore.getState().score,
      perfectCount: this.totalPerfect,
      goodCount: this.totalGood,
      missCount: this.totalMiss,
      syncRateHistory: this.sectionSyncHistory,
      finalGrade: grade,
      averageSyncRate: Math.round(avgRate)
    });
    useGameStore.getState().setGameState('result');
    this.emit('gameEnd', { type: 'gameEnd' });
  }

  private spawnObstacle(beatIndex: number): void {
    const obstacleX = this.canvasWidth + 50;
    const types: ('spike' | 'pendulum' | 'block')[] = ['spike', 'pendulum', 'block'];
    const type = types[beatIndex % 3];
    let y = this.playerGroundY;
    let width = 24;
    let height = 32;
    if (type === 'spike') {
      height = 28;
      y = this.playerGroundY - height + 16;
    } else if (type === 'pendulum') {
      height = 40;
      y = this.playerGroundY - 80;
    } else if (type === 'block') {
      height = 48;
      width = 32;
      y = this.playerGroundY - height + 16;
    }
    const scale = this.canvasWidth / 480;
    this.obstacles.push({
      id: this.nextObstacleId++,
      x: obstacleX,
      y,
      type,
      width: width * scale,
      height: height * scale,
      passed: false
    });
  }

  private spawnFragment(beatIndex: number): void {
    const fragmentX = this.canvasWidth + 50;
    const y = this.playerGroundY - 40 - (beatIndex % 3) * 20;
    this.fragments.push({
      id: this.nextFragmentId++,
      x: fragmentX,
      y,
      collected: false,
      beatIndex
    });
  }

  private spawnParticle(x: number, y: number, color: string, vx: number, vy: number, life: number): void {
    this.particles.push({
      id: this.nextParticleId++,
      x, y, vx, vy,
      life,
      maxLife: life,
      color,
      size: 3 + Math.random() * 3
    });
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;
    const deltaTime = Math.min(50, currentTime - this.lastTime);
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(dt: number): void {
    this.bgOffset = (this.bgOffset + dt * 0.05) % 40;
    this.neonOffset = (this.neonOffset + dt * 0.3) % 40;
    this.runFrameTime += dt;
    if (this.runFrameTime >= 100) {
      this.runFrame = (this.runFrame + 1) % 4;
      this.runFrameTime = 0;
    }
    if (this.playerState === 'jump') {
      this.playerStateTime += dt;
      const jumpDuration = 400;
      const progress = this.playerStateTime / jumpDuration;
      if (progress >= 1) {
        this.playerState = 'run';
        this.playerY = this.playerGroundY;
      } else {
        const jumpHeight = 80;
        const ease = Math.sin(progress * Math.PI);
        this.playerY = this.playerGroundY - jumpHeight * ease;
      }
    } else if (this.playerState === 'slide') {
      this.playerStateTime += dt;
      if (this.playerStateTime >= 300) {
        this.playerState = 'run';
      }
    }
    if (this.playerLeanTime > 0) {
      this.playerLeanTime -= dt;
      if (this.playerLeanTime <= 0) {
        this.playerLean = 0;
      }
    }
    if (this.hitGlow > 0) this.hitGlow -= dt;
    if (this.screenFlash > 0) this.screenFlash -= dt;
    const scrollDt = dt / 1000;
    for (const obs of this.obstacles) {
      obs.x -= this.scrollSpeed * scrollDt;
    }
    for (const frag of this.fragments) {
      frag.x -= this.scrollSpeed * scrollDt;
    }
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
    }
    this.obstacles = this.obstacles.filter(o => o.x > -100);
    this.fragments = this.fragments.filter(f => f.x > -50 && !f.collected);
    this.particles = this.particles.filter(p => p.life > 0);
    this.checkCollisions();
  }

  private checkCollisions(): void {
    const playerW = 32;
    let playerH = 32;
    let playerTop = this.playerY - playerH;
    if (this.playerState === 'slide') {
      playerH = 16;
      playerTop = this.playerY - playerH;
    } else if (this.playerState === 'jump') {
      playerH = 24;
      playerTop = this.playerY - playerH;
    }
    const playerLeft = this.playerX - playerW / 2 + this.playerLean;
    const playerRight = this.playerX + playerW / 2 + this.playerLean;
    const playerBottom = this.playerY;
    for (const obs of this.obstacles) {
      if (obs.passed) continue;
      const obsLeft = obs.x - obs.width / 2;
      const obsRight = obs.x + obs.width / 2;
      const obsTop = obs.y - obs.height;
      const obsBottom = obs.y;
      const overlapX = playerRight > obsLeft && playerLeft < obsRight;
      const overlapY = playerBottom > obsTop && playerTop < obsBottom;
      if (overlapX && overlapY) {
        obs.passed = true;
        for (let i = 0; i < 6; i++) {
          this.spawnParticle(obs.x, obs.y - obs.height / 2, '#FF4757', (Math.random() - 0.5) * 4, -Math.random() * 3, 400);
        }
      }
    }
    for (const frag of this.fragments) {
      if (frag.collected) continue;
      const fragLeft = frag.x - 10;
      const fragRight = frag.x + 10;
      const fragTop = frag.y - 10;
      const fragBottom = frag.y + 10;
      if (playerRight > fragLeft && playerLeft < fragRight &&
          playerBottom > fragTop && playerTop < fragBottom) {
        frag.collected = true;
        useGameStore.getState().addScore(2);
        for (let i = 0; i < 8; i++) {
          this.spawnParticle(frag.x, frag.y, '#FFD93D', (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 500);
        }
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    ctx.fillStyle = '#0A0A16';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.renderBackground(ctx);
    this.renderGround(ctx);
    this.renderFragments(ctx);
    this.renderObstacles(ctx);
    this.renderParticles(ctx);
    this.renderPlayer(ctx);
    this.renderHitGlow(ctx);
    this.renderNeonStrip(ctx);
    this.renderScreenFlash(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 1;
    for (let x = -this.bgOffset; x < this.canvasWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
      ctx.stroke();
    }
    const horizonY = this.playerGroundY - 100;
    const gradient = ctx.createLinearGradient(0, horizonY, 0, this.canvasHeight);
    gradient.addColorStop(0, 'rgba(83, 82, 237, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 71, 87, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, horizonY, this.canvasWidth, this.canvasHeight - horizonY);
  }

  private renderGround(ctx: CanvasRenderingContext2D): void {
    const groundY = this.playerGroundY + 16;
    ctx.fillStyle = '#16213E';
    ctx.fillRect(0, groundY, this.canvasWidth, this.canvasHeight - groundY);
    ctx.strokeStyle = '#5352ED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.canvasWidth, groundY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(83, 82, 237, 0.3)';
    ctx.lineWidth = 1;
    for (let x = -this.bgOffset * 2; x < this.canvasWidth + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 80, this.canvasHeight);
      ctx.stroke();
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D): void {
    for (const obs of this.obstacles) {
      ctx.save();
      if (obs.type === 'spike') {
        this.renderSpike(ctx, obs);
      } else if (obs.type === 'pendulum') {
        this.renderPendulum(ctx, obs);
      } else {
        this.renderBlock(ctx, obs);
      }
      ctx.restore();
    }
  }

  private renderSpike(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    ctx.fillStyle = '#FF4757';
    ctx.strokeStyle = '#5352ED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(obs.x - obs.width / 2, obs.y);
    ctx.lineTo(obs.x, obs.y - obs.height);
    ctx.lineTo(obs.x + obs.width / 2, obs.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(obs.x - obs.width / 4, obs.y - obs.height / 2);
    ctx.lineTo(obs.x, obs.y - obs.height);
    ctx.lineTo(obs.x, obs.y - obs.height / 2);
    ctx.closePath();
    ctx.fill();
  }

  private renderPendulum(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    const time = Date.now() / 500;
    const swing = Math.sin(time) * 30;
    const pivotX = obs.x + swing;
    const pivotY = obs.y - obs.height;
    ctx.strokeStyle = '#5352ED';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y - obs.height - 20);
    ctx.lineTo(pivotX, pivotY);
    ctx.stroke();
    ctx.fillStyle = '#FF4757';
    ctx.strokeStyle = '#5352ED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, obs.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time;
      const sx = pivotX + Math.cos(angle) * (obs.width / 2);
      const sy = pivotY + Math.sin(angle) * (obs.width / 2);
      const ex = pivotX + Math.cos(angle) * (obs.width / 2 + 8);
      const ey = pivotY + Math.sin(angle) * (obs.width / 2 + 8);
      ctx.strokeStyle = '#FF4757';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  private renderBlock(ctx: CanvasRenderingContext2D, obs: Obstacle): void {
    ctx.fillStyle = '#5352ED';
    ctx.strokeStyle = '#FF4757';
    ctx.lineWidth = 2;
    ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height, obs.width, obs.height);
    ctx.strokeRect(obs.x - obs.width / 2, obs.y - obs.height, obs.width, obs.height);
    ctx.fillStyle = 'rgba(255, 71, 87, 0.3)';
    ctx.fillRect(obs.x - obs.width / 2 + 4, obs.y - obs.height + 4, obs.width - 8, 4);
  }

  private renderFragments(ctx: CanvasRenderingContext2D): void {
    const time = Date.now() / 200;
    for (const frag of this.fragments) {
      if (frag.collected) continue;
      const pulse = Math.sin(time + frag.beatIndex) * 2;
      ctx.save();
      ctx.translate(frag.x, frag.y + pulse);
      ctx.rotate(time * 0.5);
      ctx.fillStyle = '#FFD93D';
      ctx.strokeStyle = '#6BCB77';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    const baseX = this.playerX + this.playerLean;
    let baseY = this.playerY;
    let width = 32;
    let height = 32;
    if (this.playerState === 'slide') {
      height = 16;
    } else if (this.playerState === 'jump') {
      height = 24;
    }
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.fillStyle = '#FF6B6B';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    if (this.playerState === 'slide') {
      ctx.fillRect(-width / 2, -height, width, height);
      ctx.strokeRect(-width / 2, -height, width, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(4, -height + 4, 6, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(6, -height + 5, 3, 2);
    } else if (this.playerState === 'jump') {
      ctx.fillRect(-width / 2 + 4, -height, width - 8, height);
      ctx.strokeRect(-width / 2 + 4, -height, width - 8, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -height + 6, 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, -height + 8, 3, 3);
    } else {
      const legOffset = this.runFrame % 2 === 0 ? 0 : 4;
      ctx.fillRect(-width / 2, -height + 8, width, height - 8);
      ctx.strokeRect(-width / 2, -height + 8, width, height - 8);
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(-8, -height, 16, 12);
      ctx.strokeRect(-8, -height, 16, 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -height + 4, 6, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, -height + 5, 2, 2);
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(-10, -height + 12 + legOffset, 8, 10 - legOffset);
      ctx.fillRect(2, -height + 12 + (4 - legOffset), 8, 10 - (4 - legOffset));
    }
    ctx.restore();
  }

  private renderHitGlow(ctx: CanvasRenderingContext2D): void {
    if (this.hitGlow <= 0) return;
    const progress = 1 - this.hitGlow / 200;
    const radius = progress * 60;
    const alpha = (1 - progress) * 0.8;
    ctx.save();
    ctx.globalAlpha = alpha;
    const gradient = ctx.createRadialGradient(this.playerX, this.playerY - 16, 0, this.playerX, this.playerY - 16, radius);
    gradient.addColorStop(0, '#6BCB77');
    gradient.addColorStop(1, 'rgba(107, 203, 119, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY - 16, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderNeonStrip(ctx: CanvasRenderingContext2D): void {
    const y = this.canvasHeight - 4;
    const gradient = ctx.createLinearGradient(0, y, this.canvasWidth, y);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
    gradient.addColorStop(0.5, '#00D4FF');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, this.canvasWidth, 4);
    ctx.fillStyle = '#00D4FF';
    for (let x = -this.neonOffset; x < this.canvasWidth; x += 40) {
      ctx.fillRect(x, y, 10, 4);
    }
  }

  private renderScreenFlash(ctx: CanvasRenderingContext2D): void {
    if (this.screenFlash <= 0) return;
    const alpha = this.screenFlash / 100;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.canvasWidth - 4, this.canvasHeight - 4);
    ctx.restore();
  }

  getCanvasWidth(): number { return this.canvasWidth; }
  getCanvasHeight(): number { return this.canvasHeight; }
  getSyncRateHistory(): number[] { return this.sectionSyncHistory; }
  getTotalPerfect(): number { return this.totalPerfect; }
  getTotalGood(): number { return this.totalGood; }
  getTotalMiss(): number { return this.totalMiss; }

  destroy(): void {
    this.stop();
    this.musicPlayer.destroy();
    this.beatAnalyzer.destroy();
  }
}
