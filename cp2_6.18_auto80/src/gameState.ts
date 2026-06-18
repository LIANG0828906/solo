export type GamePhase = 'menu' | 'countdown' | 'tutorial' | 'playing' | 'paused' | 'gameover';

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  brightness: number;
  fragmentsCollected: number;
  survivalTime: number;
}

export type EventType =
  | 'collected'
  | 'collided'
  | 'enemyHit'
  | 'restart'
  | 'pause'
  | 'resume'
  | 'phaseChange'
  | 'statsUpdate'
  | 'returnToMenu';

export type EventCallback = (data?: unknown) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: EventType, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: EventType, data?: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

export const eventBus = new EventBus();

class GameState {
  private phase: GamePhase = 'menu';
  private stats: GameStats = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    brightness: 100,
    fragmentsCollected: 0,
    survivalTime: 0,
  };
  private countdown: number = 3;
  private tutorialTimer: number = 10;
  private comboTimer: number = 0;
  private readonly COMBO_TIMEOUT = 3;
  private readonly MAX_COMBO = 20;

  getPhase(): GamePhase {
    return this.phase;
  }

  getStats(): Readonly<GameStats> {
    return { ...this.stats };
  }

  getCountdown(): number {
    return Math.ceil(this.countdown);
  }

  getTutorialTimer(): number {
    return Math.ceil(this.tutorialTimer);
  }

  getBrightnessMultiplier(): number {
    return 0.5 + (this.stats.brightness / 100) * 2;
  }

  isInvincible(): boolean {
    return this.phase === 'tutorial';
  }

  setPhase(phase: GamePhase): void {
    if (this.phase !== phase) {
      this.phase = phase;
      eventBus.emit('phaseChange', phase);
    }
  }

  startCountdown(): void {
    this.countdown = 3;
    this.setPhase('countdown');
  }

  startTutorial(): void {
    this.tutorialTimer = 10;
    this.setPhase('tutorial');
  }

  startPlaying(): void {
    this.setPhase('playing');
  }

  togglePause(): void {
    if (this.phase === 'playing' || this.phase === 'tutorial') {
      this.setPhase('paused');
      eventBus.emit('pause');
    } else if (this.phase === 'paused') {
      const prevBrightness = this.stats.brightness;
      const prevPhase = prevBrightness === 100 && this.stats.survivalTime < 0.1 ? 'tutorial' : 'playing';
      this.setPhase(prevPhase);
      eventBus.emit('resume');
    }
  }

  gameOver(): void {
    this.setPhase('gameover');
  }

  reset(): void {
    this.stats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      brightness: 100,
      fragmentsCollected: 0,
      survivalTime: 0,
    };
    this.countdown = 3;
    this.tutorialTimer = 10;
    this.comboTimer = 0;
    this.setPhase('menu');
    eventBus.emit('restart');
  }

  collectFragment(): void {
    if (this.phase !== 'playing' && this.phase !== 'tutorial') return;

    this.stats.fragmentsCollected++;
    this.stats.combo = Math.min(this.stats.combo + 1, this.MAX_COMBO);
    this.comboTimer = this.COMBO_TIMEOUT;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);

    const comboBonus = 1 + (this.stats.combo - 1) * 0.05;
    const multiplier = this.getBrightnessMultiplier();
    this.stats.score += Math.floor(100 * multiplier * comboBonus);

    this.stats.brightness = Math.min(100, this.stats.brightness + 3);

    eventBus.emit('collected', {
      score: this.stats.score,
      combo: this.stats.combo,
      brightness: this.stats.brightness,
    });
    this.emitStatsUpdate();
  }

  enemyHit(): void {
    if (this.phase !== 'playing' && this.phase !== 'tutorial') return;
    if (this.isInvincible()) return;

    this.stats.brightness = Math.max(0, this.stats.brightness - 25);
    this.stats.combo = 0;
    this.comboTimer = 0;

    eventBus.emit('enemyHit', { brightness: this.stats.brightness });
    this.emitStatsUpdate();

    if (this.stats.brightness <= 0) {
      this.gameOver();
    }
  }

  update(dt: number): void {
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.startTutorial();
      }
      return;
    }

    if (this.phase === 'tutorial') {
      this.tutorialTimer -= dt;
      this.stats.survivalTime += dt;
      this.decayBrightness(dt);
      this.updateComboTimer(dt);
      if (this.tutorialTimer <= 0) {
        this.startPlaying();
      }
      return;
    }

    if (this.phase === 'playing') {
      this.stats.survivalTime += dt;
      this.decayBrightness(dt);
      this.updateComboTimer(dt);

      if (this.stats.brightness <= 0) {
        this.gameOver();
      }
    }
  }

  private decayBrightness(dt: number): void {
    const decayRate = 0.05;
    this.stats.brightness = Math.max(0, this.stats.brightness * (1 - decayRate * dt));
    this.emitStatsUpdate();
  }

  private updateComboTimer(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.stats.combo = 0;
        this.emitStatsUpdate();
      }
    }
  }

  private emitStatsUpdate(): void {
    eventBus.emit('statsUpdate', { ...this.stats });
  }
}

export const gameState = new GameState();
