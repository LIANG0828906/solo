import {
  Particle,
  ParticleType,
  MatchGroup,
  GameStateSnapshot,
  GameEvent
} from './types';
import { randomInt, clamp, wait } from './utils';

type EventCallback = (event: GameEvent) => void;

const HIGH_SCORE_KEY = 'quantum_match_high_score';
const TOTAL_TIME = 90;
const MAX_CHAIN = 5;
const BASE_SCORE = 10;
const ROWS = 8;
const COLS = 8;
const TYPE_COUNT = 5;

export class GameCore {
  private _rows: number = ROWS;
  private _cols: number = COLS;
  private _typeCount: number = TYPE_COUNT;
  private _grid: (Particle | null)[][] = [];
  private _score: number = 0;
  private _highScore: number = 0;
  private _timeLeft: number = TOTAL_TIME;
  private _totalTime: number = TOTAL_TIME;
  private _isPlaying: boolean = false;
  private _isProcessing: boolean = false;
  private _chainCount: number = 0;
  private _showResult: boolean = false;
  private _nextId: number = 1;
  private _listeners: Set<EventCallback> = new Set();
  private _timerInterval: number | null = null;
  private _soundEnabled: boolean = true;

  constructor() {
    this._loadHighScore();
  }

  private _loadHighScore(): void {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) this._highScore = parsed;
      }
    } catch (e) {
      this._highScore = 0;
    }
  }

  private _saveHighScore(): void {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(this._highScore));
    } catch (e) {}
  }

  public on(callback: EventCallback): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  private _emit(event: GameEvent): void {
    this._listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {}
    });
  }

  private _createParticle(
    type: ParticleType,
    row: number,
    col: number,
    isNew: boolean = false
  ): Particle {
    return {
      id: this._nextId++,
      type,
      row,
      col,
      renderX: col,
      renderY: row,
      targetX: col,
      targetY: row,
      scale: 1,
      opacity: 1,
      isMatched: false,
      isNew,
      spawnProgress: isNew ? 0 : 1,
      matchProgress: 0
    };
  }

  private _randomType(exclude: ParticleType[] = []): ParticleType {
    const available: ParticleType[] = [];
    for (let i = 0; i < this._typeCount; i++) {
      if (!exclude.includes(i as ParticleType)) {
        available.push(i as ParticleType);
      }
    }
    if (available.length === 0) {
      return randomInt(0, this._typeCount - 1) as ParticleType;
    }
    return available[randomInt(0, available.length - 1)];
  }

  public init(): void {
    this._grid = [];
    this._nextId = 1;
    for (let r = 0; r < this._rows; r++) {
      const row: (Particle | null)[] = [];
      for (let c = 0; c < this._cols; c++) {
        const exclude: ParticleType[] = [];
        if (c >= 2 && row[c - 1] && row[c - 2]) {
          if (
            row[c - 1]!.type === row[c - 2]!.type
          ) {
            exclude.push(row[c - 1]!.type);
          }
        }
        if (r >= 2 && this._grid[r - 1] && this._grid[r - 2]) {
          const above1 = this._grid[r - 1][c];
          const above2 = this._grid[r - 2][c];
          if (above1 && above2 && above1.type === above2.type) {
            exclude.push(above1.type);
          }
        }
        const type = this._randomType(exclude);
        row.push(this._createParticle(type, r, c, false));
      }
      this._grid.push(row);
    }
    this._score = 0;
    this._chainCount = 0;
    this._isProcessing = false;
    this._showResult = false;
  }

  public start(): void {
    this.init();
    this._timeLeft = this._totalTime;
    this._isPlaying = true;
    this._showResult = false;
    this._startTimer();
    this._emit({ type: 'start' });
    this._emit({ type: 'scoreUpdate', score: 0 });
  }

  private _startTimer(): void {
    if (this._timerInterval !== null) {
      window.clearInterval(this._timerInterval);
    }
    this._timerInterval = window.setInterval(() => {
      if (!this._isPlaying) return;
      this._timeLeft -= 1;
      if (this._timeLeft <= 0) {
        this._timeLeft = 0;
        this._gameOver();
      }
    }, 1000);
  }

  private _stopTimer(): void {
    if (this._timerInterval !== null) {
      window.clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  private _gameOver(): void {
    this._stopTimer();
    this._isPlaying = false;
    this._isProcessing = false;
    if (this._score > this._highScore) {
      this._highScore = this._score;
      this._saveHighScore();
    }
    this._showResult = true;
    this._emit({
      type: 'gameover',
      score: this._score,
      highScore: this._highScore
    });
  }

  public isAdjacent(
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): boolean {
    const dr = Math.abs(r1 - r2);
    const dc = Math.abs(c1 - c2);
    return dr + dc === 1;
  }

  public inBounds(r: number, c: number): boolean {
    return r >= 0 && r < this._rows && c >= 0 && c < this._cols;
  }

  public swap(
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): boolean {
    if (!this._isPlaying || this._isProcessing) return false;
    if (!this.inBounds(r1, c1) || !this.inBounds(r2, c2)) return false;
    if (!this.isAdjacent(r1, c1, r2, c2)) return false;
    const p1 = this._grid[r1][c1];
    const p2 = this._grid[r2][c2];
    if (!p1 || !p2) return false;
    this._grid[r1][c1] = p2;
    this._grid[r2][c2] = p1;
    p1.row = r2;
    p1.col = c2;
    p1.targetX = c2;
    p1.targetY = r2;
    p2.row = r1;
    p2.col = c1;
    p2.targetX = c1;
    p2.targetY = r1;
    return true;
  }

  public revertSwap(
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): void {
    const p1 = this._grid[r2][c2];
    const p2 = this._grid[r1][c1];
    if (!p1 || !p2) return;
    this._grid[r1][c1] = p1;
    this._grid[r2][c2] = p2;
    p1.row = r1;
    p1.col = c1;
    p1.targetX = c1;
    p1.targetY = r1;
    p2.row = r2;
    p2.col = c2;
    p2.targetX = c2;
    p2.targetY = r2;
  }

  public findMatches(): MatchGroup[] {
    const visited: boolean[][] = Array.from({ length: this._rows }, () =>
      Array(this._cols).fill(false)
    );
    const matchedParticles: Set<Particle> = new Set();
    const groups: Particle[][] = [];

    for (let r = 0; r < this._rows; r++) {
      let c = 0;
      while (c < this._cols) {
        const p = this._grid[r][c];
        if (!p) {
          c++;
          continue;
        }
        let end = c + 1;
        while (
          end < this._cols &&
          this._grid[r][end] &&
          this._grid[r][end]!.type === p.type
        ) {
          end++;
        }
        const length = end - c;
        if (length >= 3) {
          const group: Particle[] = [];
          for (let k = c; k < end; k++) {
            const pp = this._grid[r][k]!;
            if (!matchedParticles.has(pp)) group.push(pp);
            matchedParticles.add(pp);
            visited[r][k] = true;
          }
          groups.push(group);
        }
        c = end;
      }
    }

    for (let c = 0; c < this._cols; c++) {
      let r = 0;
      while (r < this._rows) {
        const p = this._grid[r][c];
        if (!p) {
          r++;
          continue;
        }
        let end = r + 1;
        while (
          end < this._rows &&
          this._grid[end][c] &&
          this._grid[end][c]!.type === p.type
        ) {
          end++;
        }
        const length = end - r;
        if (length >= 3) {
          const group: Particle[] = [];
          let addedAny = false;
          for (let k = r; k < end; k++) {
            const pp = this._grid[k][c]!;
            if (!matchedParticles.has(pp)) {
              group.push(pp);
              addedAny = true;
            }
            matchedParticles.add(pp);
            visited[k][c] = true;
          }
          if (addedAny) groups.push(group);
        }
        r = end;
      }
    }

    matchedParticles.forEach((p) => {
      p.isMatched = true;
    });

    return groups.map((particles) => ({ particles, isChained: false }));
  }

  public async resolveMatches(): Promise<{
    hadMatches: boolean;
    totalChain: number;
  }> {
    this._isProcessing = true;
    let chainLevel = 0;
    let totalMatched = 0;
    try {
      while (chainLevel < MAX_CHAIN) {
        const matches = this.findMatches();
        if (matches.length === 0) break;
        chainLevel++;
        const chainMultiplier = Math.pow(2, chainLevel - 1);
        let chainMatchedCount = 0;
        matches.forEach((g) => (chainMatchedCount += g.particles.length));
        const roundScore = chainMatchedCount * BASE_SCORE * chainMultiplier;
        this._score += Math.floor(roundScore);
        totalMatched += chainMatchedCount;
        this._emit({
          type: 'match',
          groups: matches,
          chainLevel
        });
        this._emit({ type: 'scoreUpdate', score: this._score });
        if (chainLevel > 1) {
          this._emit({ type: 'chain', level: chainLevel });
        }
        this._chainCount = chainLevel;
        await wait(280);
        matches.forEach((g) => {
          g.particles.forEach((p) => {
            if (this._grid[p.row][p.col] === p) {
              this._grid[p.row][p.col] = null;
            }
          });
        });
        await wait(120);
        this._collapseAndFill();
        await wait(300);
      }
    } finally {
      this._chainCount = 0;
      this._isProcessing = false;
    }
    return { hadMatches: totalMatched > 0, totalChain: chainLevel };
  }

  private _collapseAndFill(): void {
    for (let c = 0; c < this._cols; c++) {
      let writeRow = this._rows - 1;
      for (let r = this._rows - 1; r >= 0; r--) {
        const p = this._grid[r][c];
        if (p) {
          if (r !== writeRow) {
            this._grid[writeRow][c] = p;
            this._grid[r][c] = null;
            p.row = writeRow;
            p.col = c;
            p.targetX = c;
            p.targetY = writeRow;
          }
          writeRow--;
        }
      }
      for (let r = writeRow; r >= 0; r--) {
        const type = randomInt(0, this._typeCount - 1) as ParticleType;
        const p = this._createParticle(type, r, c, true);
        p.renderY = r - (writeRow + 1) - 0.5;
        p.targetY = r;
        p.spawnProgress = 0;
        this._grid[r][c] = p;
      }
    }
  }

  public hasAnyMatch(): boolean {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const p = this._grid[r][c];
        if (!p) continue;
        if (
          c + 2 < this._cols &&
          this._grid[r][c + 1]?.type === p.type &&
          this._grid[r][c + 2]?.type === p.type
        )
          return true;
        if (
          r + 2 < this._rows &&
          this._grid[r + 1][c]?.type === p.type &&
          this._grid[r + 2][c]?.type === p.type
        )
          return true;
      }
    }
    return false;
  }

  public getParticleAt(r: number, c: number): Particle | null {
    if (!this.inBounds(r, c)) return null;
    return this._grid[r][c];
  }

  public updateParticlesAnimation(dt: number): void {
    const moveSpeed = 10;
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const p = this._grid[r][c];
        if (!p) continue;
        const dx = p.targetX - p.renderX;
        const dy = p.targetY - p.renderY;
        const maxStep = moveSpeed * dt;
        if (Math.abs(dx) > 0.001) {
          p.renderX += clamp(dx, -maxStep, maxStep);
        } else {
          p.renderX = p.targetX;
        }
        if (Math.abs(dy) > 0.001) {
          p.renderY += clamp(dy, -maxStep, maxStep);
        } else {
          p.renderY = p.targetY;
        }
        if (p.isNew && p.spawnProgress < 1) {
          p.spawnProgress = Math.min(1, p.spawnProgress + dt * 3.5);
        }
        if (p.isMatched && p.matchProgress < 1) {
          p.matchProgress = Math.min(1, p.matchProgress + dt * 4);
        }
      }
    }
  }

  public get rows(): number {
    return this._rows;
  }

  public get cols(): number {
    return this._cols;
  }

  public get isProcessing(): boolean {
    return this._isProcessing;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get chainCount(): number {
    return this._chainCount;
  }

  public get timeLeft(): number {
    return this._timeLeft;
  }

  public get totalTime(): number {
    return this._totalTime;
  }

  public get score(): number {
    return this._score;
  }

  public get highScore(): number {
    return this._highScore;
  }

  public get showResult(): boolean {
    return this._showResult;
  }

  public setShowResult(v: boolean): void {
    this._showResult = v;
  }

  public getState(): GameStateSnapshot {
    return {
      grid: this._grid,
      score: this._score,
      highScore: this._highScore,
      timeLeft: this._timeLeft,
      totalTime: this._totalTime,
      isPlaying: this._isPlaying,
      isProcessing: this._isProcessing,
      chainCount: this._chainCount,
      showResult: this._showResult,
      rows: this._rows,
      cols: this._cols
    };
  }

  public destroy(): void {
    this._stopTimer();
    this._listeners.clear();
  }
}

export default GameCore;
