import { Tower, TowerType, TOWER_CONFIGS, Projectile } from './tower';
import { Enemy, Particle, WaveManager, PathPoint, ENEMY_CONFIGS } from './enemy';
import { UIRenderer, UIState } from './ui';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private bpm: number = 120;
  private beatInterval: number = 60 / this.bpm;
  private currentBeat: number = 0;
  private beatTimer: number = 0;
  private onBeatCallback: ((beat: number) => void) | null = null;
  private oscillators: OscillatorNode[] = [];
  private started: boolean = false;

  constructor() {}

  setOnBeatCallback(callback: (beat: number) => void): void {
    this.onBeatCallback = callback;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.startBackgroundMusic(gainNode);
  }

  private startBackgroundMusic(masterGain: GainNode): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;

    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49];
    const leadNotes = [220, 277.18, 329.63, 277.18, 246.94, 293.66, 329.63, 246.94];

    const scheduleNote = (freq: number, startTime: number, duration: number, gain: GainNode, type: OscillatorType, volume: number) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const scheduleLoop = () => {
      if (!this.audioContext || this.audioContext.state === 'closed') return;
      const now = ctx.currentTime;
      const beatDur = this.beatInterval;

      for (let i = 0; i < 8; i++) {
        const t = now + i * beatDur;
        scheduleNote(bassNotes[i], t, beatDur * 0.9, masterGain, 'sine', 0.15);
        scheduleNote(leadNotes[i], t + beatDur * 0.25, beatDur * 0.6, masterGain, 'triangle', 0.08);
        scheduleNote(leadNotes[i] * 2, t + beatDur * 0.5, beatDur * 0.4, masterGain, 'sine', 0.04);

        if (i % 2 === 0) {
          scheduleNote(440, t, 0.05, masterGain, 'square', 0.03);
        }
      }

      setTimeout(scheduleLoop, this.beatInterval * 8 * 1000 - 100);
    };

    scheduleLoop();
  }

  playFireSound(type: TowerType): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (type === 'arrow') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (type === 'cannon') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playGameOverSound(): void {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const notes = [440, 349.23, 293.66, 220];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.2;
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  update(dt: number): void {
    this.beatTimer += dt;
    while (this.beatTimer >= this.beatInterval) {
      this.beatTimer -= this.beatInterval;
      this.currentBeat++;
      if (this.onBeatCallback) {
        this.onBeatCallback(this.currentBeat);
      }
    }
  }

  getAudioData(): Uint8Array {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return new Uint8Array(128);
  }

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  getBeatProgress(): number {
    return this.beatTimer / this.beatInterval;
  }
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: AudioEngine;
  private ui: UIRenderer;

  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private path: PathPoint[] = [];

  private waveManager: WaveManager;

  private score: number = 0;
  private lives: number = 20;
  private gold: number = 200;
  private selectedTowerType: TowerType | null = null;
  private selectedTower: Tower | null = null;
  private gameOver: boolean = false;

  private time: number = 0;
  private lastFrameTime: number = 0;
  private running: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    this.audio = new AudioEngine();
    this.ui = new UIRenderer();
    this.waveManager = new WaveManager();

    this.resize();
    this.generatePath();
    this.setupEventListeners();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.generatePath();
  }

  private generatePath(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.path = [
      { x: 0, y: h * 0.35 },
      { x: w * 0.15, y: h * 0.35 },
      { x: w * 0.15, y: h * 0.7 },
      { x: w * 0.4, y: h * 0.7 },
      { x: w * 0.4, y: h * 0.25 },
      { x: w * 0.65, y: h * 0.25 },
      { x: w * 0.65, y: h * 0.65 },
      { x: w * 0.85, y: h * 0.65 },
      { x: w * 0.85, y: h * 0.4 },
      { x: w, y: h * 0.4 }
    ];
  }

  private isOnPath(x: number, y: number, margin: number = 35): boolean {
    for (let i = 0; i < this.path.length - 1; i++) {
      const p1 = this.path[i];
      const p2 = this.path[i + 1];
      const dist = this.pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist < margin) return true;
    }
    return false;
  }

  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx: number, yy: number;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private canPlaceTower(x: number, y: number): boolean {
    if (this.isOnPath(x, y)) return false;
    if (x < 140) return false;
    if (y < 70) return false;
    for (const tower of this.towers) {
      const dx = tower.x - x;
      const dy = tower.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) return false;
    }
    return true;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.ui.setMousePosition(x, y);

      let hovered: Tower | null = null;
      for (const tower of this.towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < 28) {
          hovered = tower;
          break;
        }
      }
      this.ui.setHoveredTower(hovered);
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.gameOver) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const slotType = this.ui.isPointInSlot(x, y);
      if (slotType) {
        if (this.selectedTowerType === slotType) {
          this.selectedTowerType = null;
        } else {
          this.selectedTowerType = slotType;
        }
        if (this.selectedTower) {
          this.selectedTower.selected = false;
          this.selectedTower = null;
        }
        return;
      }

      for (const tower of this.towers) {
        const dx = tower.x - x;
        const dy = tower.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < 28) {
          if (this.selectedTower) this.selectedTower.selected = false;
          tower.selected = true;
          this.selectedTower = tower;
          this.selectedTowerType = null;
          return;
        }
      }

      if (this.selectedTowerType) {
        const config = TOWER_CONFIGS[this.selectedTowerType];
        if (this.gold >= config.cost && this.canPlaceTower(x, y)) {
          const tower = new Tower(x, y, this.selectedTowerType);
          this.towers.push(tower);
          this.gold -= config.cost;
        }
      } else if (this.selectedTower) {
        this.selectedTower.selected = false;
        this.selectedTower = null;
      }
    });

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        const overlay = document.getElementById('startOverlay');
        if (overlay) overlay.style.display = 'none';
        await this.audio.start();
        this.start();
      });
    }
  }

  private handleBeat(beat: number): void {
    if (this.gameOver) return;

    for (const tower of this.towers) {
      if (!tower.canFire(beat)) continue;

      let target: Enemy | null = null;
      let bestProgress = -1;

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dist = enemy.distanceTo(tower.x, tower.y);
        if (dist <= tower.config.range) {
          const progress = enemy.pathIndex + enemy.progress;
          if (progress > bestProgress) {
            bestProgress = progress;
            target = enemy;
          }
        }
      }

      if (target) {
        const projectile = tower.fire(beat, target.id);
        if (projectile) {
          this.projectiles.push(projectile);
          this.audio.playFireSound(tower.type);
        }
      }
    }
  }

  public start(): void {
    this.running = true;
    this.audio.setOnBeatCallback((beat) => this.handleBeat(beat));
    this.lastFrameTime = performance.now();
    this.waveManager.waveDelay = 3;
    this.loop();
  }

  private loop(): void {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    dt = Math.min(dt, 0.05);

    if (!this.gameOver) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  private update(dt: number): void {
    this.time += dt * 1000;
    this.audio.update(dt);

    const waveStarted = this.waveManager.update(dt, this.path, this.enemies);
    if (waveStarted) {}

    for (const enemy of this.enemies) {
      enemy.update(dt);
      if (enemy.reachedEnd && enemy.alive === false) {
        this.lives--;
        if (this.lives <= 0) {
          this.lives = 0;
          this.gameOver = true;
          this.audio.playGameOverSound();
        }
      }
    }

    const enemyMap = new Map<number, Enemy>();
    for (const e of this.enemies) {
      if (e.alive) enemyMap.set(e.id, e);
    }

    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      const target = enemyMap.get(proj.targetId);
      if (!target) {
        proj.alive = false;
        continue;
      }

      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < target.config.radius + 6) {
        const newParticles = target.takeDamage(proj.damage, proj.damageType);
        this.particles.push(...newParticles);
        proj.alive = false;
        if (!target.alive) {
          this.score += Math.floor(target.config.reward * (1 + this.waveManager.currentWave * 0.1));
          this.gold += target.config.reward;
        }
      } else {
        const moveX = (dx / dist) * proj.speed * dt;
        const moveY = (dy / dist) * proj.speed * dt;
        proj.x += moveX;
        proj.y += moveY;
      }
    }

    const particleDowngrade = this.enemies.length > 100 ? 0.3 : 1;
    let particleCounter = 0;
    this.particles = this.particles.filter(p => {
      if (particleDowngrade < 1) {
        particleCounter++;
        if (particleCounter % Math.ceil(1 / particleDowngrade) !== 0) {
          return false;
        }
      }
      return p.update(dt);
    });

    this.enemies = this.enemies.filter(e => e.alive || (!e.alive && e.reachedEnd === false && this.particles.length < 500));
    this.enemies = this.enemies.filter(e => e.alive);
    this.projectiles = this.projectiles.filter(p => p.alive);
  }

  private render(): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    for (const tower of this.towers) {
      if (tower.selected) {
        tower.drawRange(ctx, this.time);
      }
    }

    const uiState: UIState = {
      score: this.score,
      lives: this.lives,
      wave: this.waveManager.currentWave,
      gold: this.gold,
      selectedTowerType: this.selectedTowerType,
      gameOver: this.gameOver,
      audioData: this.audio.getAudioData(),
      time: this.time,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height
    };

    this.ui.draw(ctx, uiState, this.towers, this.path);

    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    for (const tower of this.towers) {
      tower.draw(ctx, this.time);
    }

    for (const proj of this.projectiles) {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const particle of this.particles) {
      particle.draw(ctx);
    }

    if (this.waveManager.betweenWaves && !this.gameOver) {
      ctx.save();
      ctx.font = 'bold 28px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7b2ff7';
      ctx.shadowColor = 'rgba(123, 47, 247, 0.8)';
      ctx.shadowBlur = 15;
      const nextWaveIn = Math.ceil(this.waveManager.waveDelay);
      ctx.fillText(`Next Wave in ${nextWaveIn}s`, this.canvas.width / 2, 100);
      ctx.restore();
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const gridSize = 50;
    ctx.save();
    ctx.strokeStyle = 'rgba(123, 47, 247, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const game = new Game();
(window as any).game = game;
