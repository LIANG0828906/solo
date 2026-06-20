export type GameState = 'setup' | 'countdown' | 'idle' | 'aiming' | 'flying' | 'result' | 'gameover';

export type HitType = 'mouth' | 'ear' | 'ground' | null;

export interface Player {
  id: number;
  name: string;
  color: string;
  score: number;
  throwsLeft: number;
  consecutiveHits: number;
}

export interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  active: boolean;
  trail: { x: number; y: number; alpha: number }[];
  swayPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GameConfig {
  gravity: number;
  throwPowerMultiplier: number;
  maxTrailLength: number;
  totalThrowsPerPlayer: number;
  countdownDuration: number;
}

export const PLAYER_COLORS = ['#FF4444', '#4488FF', '#44CC44', '#FF8844'];

export const DEFAULT_CONFIG: GameConfig = {
  gravity: 0.35,
  throwPowerMultiplier: 0.08,
  maxTrailLength: 30,
  totalThrowsPerPlayer: 10,
  countdownDuration: 3000
};

export class GameEngine {
  state: GameState = 'setup';
  players: Player[] = [];
  currentPlayerIndex = 0;
  arrow: Arrow | null = null;
  particles: Particle[] = [];
  selectedArrowSide: 'left' | 'right' | null = null;
  aimStartX = 0;
  aimStartY = 0;
  aimCurrentX = 0;
  aimCurrentY = 0;
  power = 0;
  hitResult: HitType = null;
  lastHitBonus = 0;
  screenShake = 0;
  flashAlpha = 0;
  potShake = 0;
  currentPlayerHintAlpha = 0;
  countdownProgress = 0;
  countdownStartTime = 0;
  roundStartTime = 0;
  resultDisplayTime = 0;
  gameOverSaved = false;
  historyRecords: any[] = [];
  showHistoryPanel = false;
  showPlayerSelect = true;
  selectedPlayerCount = 2;
  newGamePressed = false;

  config: GameConfig;
  listener: (() => void) | null = null;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setChangeListener(listener: () => void) {
    this.listener = listener;
  }

  notify() {
    if (this.listener) this.listener();
  }

  initGame(playerCount: number) {
    this.players = [];
    for (let i = 0; i < playerCount; i++) {
      this.players.push({
        id: i + 1,
        name: `玩家${i + 1}`,
        color: PLAYER_COLORS[i],
        score: 0,
        throwsLeft: this.config.totalThrowsPerPlayer,
        consecutiveHits: 0
      });
    }
    this.currentPlayerIndex = 0;
    this.state = 'countdown';
    this.countdownStartTime = performance.now();
    this.countdownProgress = 0;
    this.arrow = null;
    this.particles = [];
    this.selectedArrowSide = null;
    this.hitResult = null;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.potShake = 0;
    this.gameOverSaved = false;
    this.showPlayerSelect = false;
    this.currentPlayerHintAlpha = 0;
    this.notify();
  }

  get currentPlayer(): Player | null {
    if (this.players.length === 0) return null;
    return this.players[this.currentPlayerIndex];
  }

  startAiming(side: 'left' | 'right', x: number, y: number) {
    if (this.state !== 'idle') return;
    const cp = this.currentPlayer;
    if (!cp || cp.throwsLeft <= 0) return;

    this.selectedArrowSide = side;
    this.state = 'aiming';
    this.aimStartX = x;
    this.aimStartY = y;
    this.aimCurrentX = x;
    this.aimCurrentY = y;
    this.power = 0;
    this.notify();
  }

  updateAim(x: number, y: number) {
    if (this.state !== 'aiming') return;
    this.aimCurrentX = x;
    this.aimCurrentY = y;
    const dx = this.aimStartX - x;
    const dy = this.aimStartY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.power = Math.min(1, dist / 200);
    this.notify();
  }

  releaseArrow(potX: number, potY: number, scale: number) {
    if (this.state !== 'aiming') return;
    const cp = this.currentPlayer;
    if (!cp) return;

    const startX = this.selectedArrowSide === 'left'
      ? potX - 280 * scale
      : potX + 280 * scale;
    const startY = potY + 30 * scale;

    const dx = this.aimStartX - this.aimCurrentX;
    const dy = this.aimStartY - this.aimCurrentY;
    const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
    const basePower = Math.max(0.3, this.power);
    const vx = (dx / magnitude) * basePower * 14 * this.config.throwPowerMultiplier * 10;
    const vy = (dy / magnitude) * basePower * 14 * this.config.throwPowerMultiplier * 10 - 2 - basePower * 4;

    this.arrow = {
      x: startX,
      y: startY,
      vx: vx * (this.selectedArrowSide === 'left' ? 1 : -1) * 0.6 + (this.selectedArrowSide === 'left' ? 5 : -5),
      vy: vy - 4,
      angle: Math.atan2(vy, vx),
      active: true,
      trail: [],
      swayPhase: 0
    };

    cp.throwsLeft--;
    this.state = 'flying';
    this.selectedArrowSide = null;
    this.notify();
  }

  private spawnParticles(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: 3 + Math.random() * 3,
        alpha: 1,
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  private triggerCombo() {
    this.screenShake = 0.2;
    this.flashAlpha = 0.2;
  }

  private potHitShake() {
    this.potShake = 0.15;
  }

  checkCollision(potX: number, potY: number, scale: number): HitType {
    if (!this.arrow) return null;

    const potMouthW = 90 * scale;
    const potMouthH = 20 * scale;
    const potMouthY = potY - 100 * scale;

    if (
      this.arrow.x > potX - potMouthW / 2 &&
      this.arrow.x < potX + potMouthW / 2 &&
      this.arrow.y > potMouthY - potMouthH / 2 &&
      this.arrow.y < potMouthY + potMouthH / 2
    ) {
      return 'mouth';
    }

    const earR = 28 * scale;
    const earLY = potY - 60 * scale;
    if (
      Math.hypot(this.arrow.x - (potX - 85 * scale), this.arrow.y - earLY) < earR ||
      Math.hypot(this.arrow.x - (potX + 85 * scale), this.arrow.y - earLY) < earR
    ) {
      return 'ear';
    }

    if (this.arrow.y > potY + 200 * scale) {
      return 'ground';
    }

    return null;
  }

  update(deltaTime: number, potX: number, potY: number, scale: number, groundY: number) {
    const dt = deltaTime / 16.67;

    if (this.state === 'countdown') {
      const elapsed = performance.now() - this.countdownStartTime;
      this.countdownProgress = Math.min(1, elapsed / this.config.countdownDuration);
      if (elapsed >= this.config.countdownDuration) {
        this.state = 'idle';
        this.currentPlayerHintAlpha = 1;
        this.notify();
      }
      return;
    }

    if (this.state === 'idle') {
      this.currentPlayerHintAlpha = Math.max(0, this.currentPlayerHintAlpha - deltaTime / 1000);
    }

    if (this.state === 'flying' && this.arrow && this.arrow.active) {
      const startTime = performance.now();
      this.arrow.vy += this.config.gravity * dt;
      this.arrow.x += this.arrow.vx * dt;
      this.arrow.y += this.arrow.vy * dt;
      this.arrow.angle = Math.atan2(this.arrow.vy, this.arrow.vx);
      this.arrow.swayPhase += deltaTime * 0.06;

      this.arrow.trail.unshift({ x: this.arrow.x, y: this.arrow.y, alpha: 1 });
      if (this.arrow.trail.length > this.config.maxTrailLength) {
        this.arrow.trail.pop();
      }
      for (let i = 0; i < this.arrow.trail.length; i++) {
        this.arrow.trail[i].alpha = Math.max(0, 1 - i / this.config.maxTrailLength);
      }

      const elapsedCalc = performance.now() - startTime;
      if (elapsedCalc > 0.05) {
        console.warn('[perf] 抛物线计算耗时:', elapsedCalc.toFixed(3), 'ms');
      }

      const hit = this.checkCollision(potX, potY, scale);

      if (hit) {
        this.handleHit(hit);
      } else if (this.arrow.y > groundY) {
        this.handleHit('ground');
      } else if (
        this.arrow.x < -100 ||
        this.arrow.x > 2000 ||
        this.arrow.y < -500
      ) {
        this.handleHit('ground');
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += 0.1 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= deltaTime / 1000;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - deltaTime / 1000);
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - deltaTime / 2500);
    if (this.potShake > 0) this.potShake = Math.max(0, this.potShake - deltaTime / 1500);

    if (this.state === 'result') {
      this.resultDisplayTime -= deltaTime;
      if (this.resultDisplayTime <= 0) {
        this.advanceTurn();
      }
    }
  }

  private handleHit(hit: HitType) {
    if (!this.arrow) return;
    this.arrow.active = false;
    this.hitResult = hit;
    const cp = this.currentPlayer;
    if (!cp) return;

    let points = 0;
    if (hit === 'mouth') {
      points = 10;
      cp.consecutiveHits++;
      this.spawnParticles(this.arrow.x, this.arrow.y, 30);
      this.potHitShake();
      if (cp.consecutiveHits >= 3) {
        this.triggerCombo();
        cp.consecutiveHits = 0;
      }
    } else if (hit === 'ear') {
      points = 5;
      cp.consecutiveHits++;
      this.potHitShake();
      if (cp.consecutiveHits >= 3) {
        this.triggerCombo();
        cp.consecutiveHits = 0;
      }
    } else {
      points = 0;
      cp.consecutiveHits = 0;
    }

    cp.score += points;
    this.lastHitBonus = points;
    this.state = 'result';
    this.resultDisplayTime = 1500;
    this.notify();
  }

  private advanceTurn() {
    let allDone = true;
    for (const p of this.players) {
      if (p.throwsLeft > 0) { allDone = false; break; }
    }
    if (allDone) {
      this.state = 'gameover';
      this.saveGameResult();
      this.notify();
      return;
    }

    let next = (this.currentPlayerIndex + 1) % this.players.length;
    let safety = 0;
    while (this.players[next].throwsLeft <= 0 && safety < this.players.length) {
      next = (next + 1) % this.players.length;
      safety++;
    }
    this.currentPlayerIndex = next;
    this.arrow = null;
    this.hitResult = null;
    this.state = 'countdown';
    this.countdownStartTime = performance.now();
    this.countdownProgress = 0;
    this.currentPlayerHintAlpha = 1;
    this.notify();
  }

  private async saveGameResult() {
    if (this.gameOverSaved) return;
    this.gameOverSaved = true;

    const sorted = [...this.players].sort((a, b) => b.score - a.score);
    const scores = this.players.map(p => {
      const rank = sorted.findIndex(s => s.id === p.id) + 1;
      return {
        playerId: p.id,
        playerName: p.name,
        score: p.score,
        rank
      };
    });

    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCount: this.players.length,
          scores
        })
      });
      this.loadHistory();
    } catch (e) {
      console.warn('保存得分失败:', e);
    }
  }

  async loadHistory() {
    try {
      const resp = await fetch('/api/score');
      const json = await resp.json();
      if (json.success && json.data) {
        this.historyRecords = json.data;
        this.notify();
      }
    } catch (e) {
      console.warn('加载历史失败:', e);
    }
  }

  toggleHistoryPanel() {
    this.showHistoryPanel = !this.showHistoryPanel;
    if (this.showHistoryPanel) {
      this.loadHistory();
    }
    this.notify();
  }

  closeHistoryPanel() {
    this.showHistoryPanel = false;
    this.notify();
  }

  setPlayerCount(n: number) {
    this.selectedPlayerCount = n;
    this.notify();
  }

  confirmStart() {
    this.initGame(this.selectedPlayerCount);
  }

  restartGame() {
    this.showPlayerSelect = true;
    this.state = 'setup';
    this.selectedPlayerCount = 2;
    this.showHistoryPanel = false;
    this.notify();
  }
}
