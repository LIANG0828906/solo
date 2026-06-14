export type GameEvent =
  | 'scoreUpdate'
  | 'fragmentCollect'
  | 'comboChange'
  | 'timerUpdate'
  | 'gameEnd'
  | 'ringGlow'
  | 'ringShake'
  | 'spriteSynth'
  | 'noteHit'
  | 'noteMiss';

export interface HitResult {
  success: boolean;
  angleDiff: number;
  targetAngle: number;
  pressedKey: string;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  totalHits: number;
  totalAttempts: number;
  fragments: number;
  spriteCompleted: boolean;
}

type EventCallback = (...args: any[]) => void;

const KEY_ANGLE_MAP: Record<string, number> = {
  W: 0,
  E: 45,
  D: 90,
  C: 135,
  X: 180,
  Z: 225,
  A: 270,
  Q: 315,
};

const ANGLE_TOLERANCE = 15;
const GAME_DURATION = 60;
const FRAGMENTS_TO_SYNTH = 5;
const COMBO_THRESHOLD = 3;
const ROTATION_SPEED = 60;

export class GameEngine {
  private running = false;
  private paused = false;
  private lastTime = 0;
  private rafId = 0;

  public rotationAngle = 0;
  public timerRemaining = GAME_DURATION;
  public glowTimer = 0;
  public shakeTimer = 0;
  public shakeIntensity = 0;

  private stats: GameStats = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    totalHits: 0,
    totalAttempts: 0,
    fragments: 0,
    spriteCompleted: false,
  };

  private events: Map<GameEvent, Set<EventCallback>> = new Map();
  private keysPressed = new Set<string>();
  private pendingKeyTimestamps = new Map<string, number>();

  public startTime = 0;
  public frameCount = 0;
  public fps = 60;
  public lastFpsTime = 0;

  constructor() {
    for (const event of [
      'scoreUpdate',
      'fragmentCollect',
      'comboChange',
      'timerUpdate',
      'gameEnd',
      'ringGlow',
      'ringShake',
      'spriteSynth',
      'noteHit',
      'noteMiss',
    ] as GameEvent[]) {
      this.events.set(event, new Set());
    }
  }

  on(event: GameEvent, cb: EventCallback): () => void {
    this.events.get(event)!.add(cb);
    return () => this.events.get(event)!.delete(cb);
  }

  private emit(event: GameEvent, ...args: any[]): void {
    this.events.get(event)!.forEach((cb) => cb(...args));
  }

  getStats(): Readonly<GameStats> {
    return { ...this.stats };
  }

  getKeyAngle(key: string): number | null {
    return KEY_ANGLE_MAP[key] ?? null;
  }

  getAllKeyAngles(): typeof KEY_ANGLE_MAP {
    return { ...KEY_ANGLE_MAP };
  }

  normalizeAngle(angle: number): number {
    let a = angle % 360;
    if (a < 0) a += 360;
    return a;
  }

  getAngleDiff(a: number, b: number): number {
    let diff = Math.abs(a - b) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff;
  }

  getNearestStarAngle(): number | null {
    const normalized = this.normalizeAngle(this.rotationAngle);
    let bestAngle = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < 8; i++) {
      const starAngle = this.normalizeAngle(i * 45 - normalized);
      const diff = this.getAngleDiff(starAngle, 0);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestAngle = i * 45;
      }
    }
    return bestDiff <= ANGLE_TOLERANCE + 5 ? bestAngle : null;
  }

  handleKeyPress(key: string): HitResult | null {
    if (!this.running || this.paused) return null;
    const upper = key.toUpperCase();
    const targetAngle = this.getKeyAngle(upper);
    if (targetAngle === null) return null;

    if (this.keysPressed.has(upper)) return null;
    this.keysPressed.add(upper);

    const now = performance.now();
    this.pendingKeyTimestamps.set(upper, now);
    this.stats.totalAttempts++;

    const rot = this.rotationAngle;
    const normalizedRot = this.normalizeAngle(rot);

    const expectedTopAngle = this.normalizeAngle(targetAngle + rot);
    let diff = Math.min(expectedTopAngle, 360 - expectedTopAngle);

    let starOnRingIdx = -1;
    for (let i = 0; i < 8; i++) {
      if (this.normalizeAngle(i * 45) === this.normalizeAngle(targetAngle)) {
        starOnRingIdx = i;
        break;
      }
    }
    const actualStarScreenAngle = starOnRingIdx >= 0
      ? this.normalizeAngle(starOnRingIdx * 45 + rot)
      : -1;

    const success = diff <= ANGLE_TOLERANCE;

    console.log(
      `========== KEY PRESS ==========\n` +
      `  Key:           ${upper}\n` +
      `  TargetAngle:   ${targetAngle}°  (star index ${starOnRingIdx} on ring)\n` +
      `  RingRotation:  ${normalizedRot.toFixed(2)}°\n` +
      `  Star@Top:      ${actualStarScreenAngle >= 0 ? actualStarScreenAngle.toFixed(2) + '°' : '?'}  (should be ≈0°)\n` +
      `  AngleDiff:     ${diff.toFixed(2)}°  (tolerance ±${ANGLE_TOLERANCE}°)\n` +
      `  Result:        ${success ? '✓ HIT' : '✗ MISS'}\n` +
      `===============================`
    );

    if (success) {
      this.onNoteHit(upper, targetAngle, diff);
    } else {
      this.onNoteMiss(upper, targetAngle, diff);
    }

    return {
      success,
      angleDiff: diff,
      targetAngle,
      pressedKey: upper,
    };
  }

  handleKeyRelease(key: string): void {
    const upper = key.toUpperCase();
    this.keysPressed.delete(upper);
    this.pendingKeyTimestamps.delete(upper);
  }

  private onNoteHit(key: string, targetAngle: number, diff: number): void {
    this.stats.combo++;
    this.stats.totalHits++;
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }

    const baseScore = 100;
    const accuracyBonus = Math.floor((1 - diff / ANGLE_TOLERANCE) * 50);
    const comboBonus = this.stats.combo * 10;
    const total = baseScore + accuracyBonus + comboBonus;
    this.stats.score += total;

    console.log(
      `[COMBO] Hit! combo=${this.stats.combo}/${COMBO_THRESHOLD} ` +
      `score=${total} (base=${baseScore} accuracy=${accuracyBonus} comboBonus=${comboBonus}) ` +
      `totalScore=${this.stats.score}`
    );

    this.glowTimer = 0.3;
    this.emit('ringGlow');
    this.emit('scoreUpdate', this.stats.score, total);
    this.emit('comboChange', this.stats.combo);
    this.emit('noteHit', { key, targetAngle, diff, score: total });

    if (this.stats.combo % COMBO_THRESHOLD === 0) {
      console.log(`[COMBO] Threshold ${COMBO_THRESHOLD} reached! Triggering fragment collect.`);
      this.collectFragment();
    }
  }

  private onNoteMiss(key: string, targetAngle: number, diff: number): void {
    console.log(`[COMBO] Missed! Resetting combo from ${this.stats.combo} to 0`);
    this.stats.combo = 0;
    this.shakeTimer = 0.2;
    this.shakeIntensity = 5;
    this.emit('ringShake');
    this.emit('comboChange', this.stats.combo);
    this.emit('noteMiss', { key, targetAngle, diff });
  }

  private collectFragment(): void {
    if (this.stats.spriteCompleted) {
      console.log('[Fragment] Already completed, skipping');
      return;
    }
    if (this.stats.fragments >= FRAGMENTS_TO_SYNTH) {
      console.log('[Fragment] Already have all 5 fragments, skipping');
      return;
    }

    this.stats.fragments++;
    console.log(
      `[Fragment] Collected! count=${this.stats.fragments}/${FRAGMENTS_TO_SYNTH} ` +
      `emitting fragmentCollect event`
    );
    this.emit('fragmentCollect', this.stats.fragments);

    if (this.stats.fragments >= FRAGMENTS_TO_SYNTH) {
      console.log('[Fragment] All 5 collected! Emitting spriteSynth in 400ms');
      this.stats.spriteCompleted = true;
      setTimeout(() => this.emit('spriteSynth'), 400);
    }
  }

  reset(): void {
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.rafId = 0;
    this.rotationAngle = 0;
    this.timerRemaining = GAME_DURATION;
    this.glowTimer = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.keysPressed.clear();
    this.pendingKeyTimestamps.clear();
    this.startTime = 0;
    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsTime = 0;

    this.stats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      totalHits: 0,
      totalAttempts: 0,
      fragments: 0,
      spriteCompleted: false,
    };

    this.emit('scoreUpdate', 0, 0);
    this.emit('comboChange', 0);
    this.emit('timerUpdate', GAME_DURATION);
    for (let i = 0; i < FRAGMENTS_TO_SYNTH; i++) {
      this.emit('fragmentCollect', 0);
    }
  }

  start(): void {
    if (this.running) return;
    this.reset();
    this.running = true;
    this.startTime = performance.now();
    this.lastFpsTime = this.startTime;
    this.lastTime = this.startTime;
    this.emit('timerUpdate', this.timerRemaining);
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  pause(): void {
    if (!this.running) return;
    this.paused = true;
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  isRunning(): boolean {
    return this.running && !this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private loop = (t: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    if (this.paused) {
      this.lastTime = t;
      return;
    }

    const dt = Math.min(0.05, (t - this.lastTime) / 1000);
    this.lastTime = t;

    this.frameCount++;
    if (t - this.lastFpsTime >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (t - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = t;
    }

    this.update(dt);
  };

  private update(dt: number): void {
    this.rotationAngle += ROTATION_SPEED * dt;

    this.timerRemaining = Math.max(
      0,
      this.timerRemaining - dt
    );
    this.emit('timerUpdate', this.timerRemaining);

    if (this.glowTimer > 0) {
      this.glowTimer = Math.max(0, this.glowTimer - dt);
    }
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    if (this.timerRemaining <= 0) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    const accuracy =
      this.stats.totalAttempts === 0
        ? 0
        : Math.round((this.stats.totalHits / this.stats.totalAttempts) * 100);

    this.emit('gameEnd', {
      ...this.stats,
      accuracy,
      fragmentsNeeded: FRAGMENTS_TO_SYNTH,
    });
  }

  getGlowBrightness(): number {
    if (this.glowTimer <= 0) return 1.0;
    const t = 1 - this.glowTimer / 0.3;
    return 1.5 - t * 0.5;
  }

  getShakeOffset(): { x: number; y: number } {
    if (this.shakeTimer <= 0) return { x: 0, y: 0 };
    const t = this.shakeTimer / 0.2;
    const amp = this.shakeIntensity * t;
    return {
      x: (Math.random() * 2 - 1) * amp,
      y: (Math.random() * 2 - 1) * amp,
    };
  }
}
