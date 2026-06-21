import {
  RuneType, RUNE_COLORS,
  CellData, GamePhase, MatchGroup, Position, SwipeData, Particle,
  BOARD_SIZE, GAME_DURATION, SWIPE_DURATION, GLOW_DURATION,
  DESTROY_DURATION, FALL_DURATION, BURST_FLASH_DURATION,
  MATCH_SCORE_BASE, MATCH_SCORE_EXTRA, ENERGY_PER_ELIMINATION, MAX_PARTICLES
} from './types';

export class Game {
  board: CellData[][] = [];
  score = 0;
  energy = 0;
  timeRemaining = GAME_DURATION;
  phase: GamePhase = GamePhase.Idle;
  phaseTimer = 0;
  particles: Particle[] = [];
  currentMatches: MatchGroup[] = [];
  pendingSwipe: SwipeData | null = null;
  scoreAnimation = 0;
  burstFlashTimer = 0;
  burstButtonPulse = 0;
  comboCount = 0;

  constructor() {
    this.board = this.createBoard();
  }

  createBoard(): CellData[][] {
    const board: CellData[][] = [];
    const types = [
      RuneType.Fire, RuneType.Water, RuneType.Wind,
      RuneType.Earth, RuneType.Light, RuneType.Dark
    ];
    for (let r = 0; r < BOARD_SIZE; r++) {
      board[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        let type: RuneType;
        do {
          type = types[Math.floor(Math.random() * types.length)];
        } while (this.wouldCreateMatch(board, r, c, type));
        board[r][c] = this.createCell(type);
      }
    }
    return board;
  }

  createCell(type: RuneType, isNew = false): CellData {
    return {
      type,
      isGolden: type === RuneType.Golden,
      glowTimer: 0,
      destroyTimer: 0,
      fallOffsetY: 0,
      fallTimer: 0,
      fallDuration: FALL_DURATION,
      swipeOffsetX: 0,
      swipeOffsetY: 0,
      swipeTimer: 0,
      goldenRotation: 0,
      eliminated: false,
      isNew
    };
  }

  wouldCreateMatch(board: CellData[][], row: number, col: number, type: RuneType): boolean {
    if (col >= 2 && board[row][col - 1]?.type === type && board[row][col - 2]?.type === type) return true;
    if (row >= 2 && board[row - 1]?.[col]?.type === type && board[row - 2]?.[col]?.type === type) return true;
    return false;
  }

  update(dt: number): void {
    if (this.phase !== GamePhase.GameOver && this.phase !== GamePhase.BurstFlash) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.phase = GamePhase.GameOver;
        return;
      }
    }

    if (this.scoreAnimation > 0) {
      this.scoreAnimation = Math.max(0, this.scoreAnimation - dt * 5);
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.board[r][c];
        if (cell.isGolden) {
          cell.goldenRotation += dt * 2;
        }
      }
    }

    if (this.energy >= 1) {
      this.burstButtonPulse += dt * 4;
    }

    switch (this.phase) {
      case GamePhase.Swiping:
        this.updateSwiping(dt);
        break;
      case GamePhase.CheckMatch:
        this.checkMatches();
        break;
      case GamePhase.Eliminating:
        this.updateEliminating(dt);
        break;
      case GamePhase.Falling:
        this.updateFalling(dt);
        break;
      case GamePhase.CheckCascade:
        this.checkCascade();
        break;
      case GamePhase.BurstFlash:
        this.updateBurstFlash(dt);
        break;
    }

    this.updateParticles(dt);
  }

  updateSwiping(dt: number): void {
    this.phaseTimer += dt;
    const progress = Math.min(this.phaseTimer / SWIPE_DURATION, 1);
    const eased = this.easeInOutCubic(progress);

    if (this.pendingSwipe) {
      const { isRow, index, direction } = this.pendingSwipe;
      if (isRow) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (direction === 'right') {
            this.board[index][c].swipeOffsetX = (eased - 1);
          } else {
            this.board[index][c].swipeOffsetX = -(eased - 1);
          }
          this.board[index][c].swipeTimer = progress;
        }
      } else {
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (direction === 'down') {
            this.board[r][index].swipeOffsetY = (eased - 1);
          } else {
            this.board[r][index].swipeOffsetY = -(eased - 1);
          }
          this.board[r][index].swipeTimer = progress;
        }
      }
    }

    if (progress >= 1) {
      this.applySwipe();
      this.resetSwipeOffsets();
      this.phase = GamePhase.CheckMatch;
      this.phaseTimer = 0;
      this.comboCount = 0;
    }
  }

  applySwipe(): void {
    if (!this.pendingSwipe) return;
    const { isRow, index, direction } = this.pendingSwipe;

    if (isRow) {
      if (direction === 'right') {
        const last = { ...this.board[index][BOARD_SIZE - 1] };
        for (let c = BOARD_SIZE - 1; c > 0; c--) {
          this.board[index][c] = { ...this.board[index][c - 1] };
        }
        this.board[index][0] = last;
      } else {
        const first = { ...this.board[index][0] };
        for (let c = 0; c < BOARD_SIZE - 1; c++) {
          this.board[index][c] = { ...this.board[index][c + 1] };
        }
        this.board[index][BOARD_SIZE - 1] = first;
      }
    } else {
      if (direction === 'down') {
        const last = { ...this.board[BOARD_SIZE - 1][index] };
        for (let r = BOARD_SIZE - 1; r > 0; r--) {
          this.board[r][index] = { ...this.board[r - 1][index] };
        }
        this.board[0][index] = last;
      } else {
        const first = { ...this.board[0][index] };
        for (let r = 0; r < BOARD_SIZE - 1; r++) {
          this.board[r][index] = { ...this.board[r + 1][index] };
        }
        this.board[BOARD_SIZE - 1][index] = first;
      }
    }
  }

  resetSwipeOffsets(): void {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.board[r][c].swipeOffsetX = 0;
        this.board[r][c].swipeOffsetY = 0;
        this.board[r][c].swipeTimer = 0;
      }
    }
  }

  checkMatches(): void {
    this.currentMatches = this.findMatches();
    if (this.currentMatches.length > 0) {
      this.phase = GamePhase.Eliminating;
      this.phaseTimer = 0;
      for (const match of this.currentMatches) {
        for (const pos of match.positions) {
          this.board[pos.row][pos.col].glowTimer = GLOW_DURATION;
          this.board[pos.row][pos.col].eliminated = true;
        }
      }
    } else {
      this.phase = GamePhase.Idle;
      this.comboCount = 0;
    }
  }

  findMatches(): MatchGroup[] {
    const matches: MatchGroup[] = [];
    const allMatched = new Set<string>();

    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = 0;
      while (c < BOARD_SIZE) {
        const result = this.findMatchInLine(r, c, 0, 1);
        if (result && result.positions.length >= 3) {
          const key = result.positions.map(p => `${p.row},${p.col}`).join('|');
          if (!allMatched.has(key)) {
            allMatched.add(key);
            for (const p of result.positions) allMatched.add(`${p.row},${p.col}`);
            matches.push(result);
          }
          c += result.positions.length;
        } else {
          c++;
        }
      }
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
      let r = 0;
      while (r < BOARD_SIZE) {
        const result = this.findMatchInLine(r, c, 1, 0);
        if (result && result.positions.length >= 3) {
          const key = result.positions.map(p => `${p.row},${p.col}`).join('|');
          if (!allMatched.has(key)) {
            allMatched.add(key);
            for (const p of result.positions) allMatched.add(`${p.row},${p.col}`);
            matches.push(result);
          }
          r += result.positions.length;
        } else {
          r++;
        }
      }
    }

    return matches;
  }

  findMatchInLine(startRow: number, startCol: number, dr: number, dc: number): MatchGroup | null {
    if (startRow >= BOARD_SIZE || startCol >= BOARD_SIZE) return null;

    let firstNonGoldenType: RuneType | null = null;
    let rr = startRow;
    let cc = startCol;
    while (rr < BOARD_SIZE && cc < BOARD_SIZE) {
      const cell = this.board[rr][cc];
      if (!cell.isGolden) {
        firstNonGoldenType = cell.type;
        break;
      }
      rr += dr;
      cc += dc;
    }

    const positions: Position[] = [];
    let hasGolden = false;
    let baseType: RuneType;

    if (firstNonGoldenType === null) {
      baseType = RuneType.Golden;
      rr = startRow;
      cc = startCol;
      while (rr < BOARD_SIZE && cc < BOARD_SIZE) {
        const cell = this.board[rr][cc];
        if (cell.isGolden) {
          positions.push({ row: rr, col: cc });
          hasGolden = true;
        } else {
          break;
        }
        rr += dr;
        cc += dc;
      }
    } else {
      baseType = firstNonGoldenType;
      rr = startRow;
      cc = startCol;
      while (rr < BOARD_SIZE && cc < BOARD_SIZE) {
        const cell = this.board[rr][cc];
        if (cell.isGolden) {
          hasGolden = true;
          positions.push({ row: rr, col: cc });
        } else if (cell.type === baseType) {
          positions.push({ row: rr, col: cc });
        } else {
          break;
        }
        rr += dr;
        cc += dc;
      }
    }

    if (positions.length >= 3) {
      return { positions, type: baseType, hasGolden };
    }
    return null;
  }

  updateEliminating(dt: number): void {
    this.phaseTimer += dt;

    if (this.phaseTimer < GLOW_DURATION) {
      for (const match of this.currentMatches) {
        for (const pos of match.positions) {
          this.board[pos.row][pos.col].glowTimer = Math.max(0,
            GLOW_DURATION - this.phaseTimer);
        }
      }
      return;
    }

    const destroyProgress = (this.phaseTimer - GLOW_DURATION) / DESTROY_DURATION;
    if (destroyProgress < 1) {
      for (const match of this.currentMatches) {
        for (const pos of match.positions) {
          this.board[pos.row][pos.col].destroyTimer = destroyProgress;
        }
      }
      return;
    }

    this.processElimination();
  }

  processElimination(): void {
    const eliminatedPositions = new Set<string>();
    for (const match of this.currentMatches) {
      for (const pos of match.positions) {
        eliminatedPositions.add(`${pos.row},${pos.col}`);
      }
    }

    for (const match of this.currentMatches) {
      const count = match.positions.length;
      let baseScore = MATCH_SCORE_BASE + (count - 3) * MATCH_SCORE_EXTRA;
      this.comboCount++;
      baseScore *= this.comboCount;
      if (match.hasGolden) {
        baseScore *= 2;
      }
      this.score += baseScore;
      this.scoreAnimation = 1;
      this.energy = Math.min(1, this.energy + ENERGY_PER_ELIMINATION);
    }

    for (const match of this.currentMatches) {
      for (const pos of match.positions) {
        const cell = this.board[pos.row][pos.col];
        this.spawnEliminationParticles(pos.row, pos.col, cell.type);
      }
    }

    for (const key of eliminatedPositions) {
      const [r, c] = key.split(',').map(Number);
      this.board[r][c] = this.createCell(RuneType.Fire);
      this.board[r][c].eliminated = true;
      this.board[r][c].type = RuneType.Fire;
    }

    this.applyGravity();
    this.phase = GamePhase.Falling;
    this.phaseTimer = 0;
  }

  spawnEliminationParticles(row: number, col: number, type: RuneType): void {
    const color = RUNE_COLORS[type] || '#FFFFFF';
    const count = 20 + Math.floor(Math.random() * 11);
    const boardX = 10 + col * 84;
    const boardY = 70 + row * 84;
    const cx = boardX + 40;
    const cy = boardY + 40;

    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  applyGravity(): void {
    for (let c = 0; c < BOARD_SIZE; c++) {
      let writeRow = BOARD_SIZE - 1;
      const column: CellData[] = [];
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (!this.board[r][c].eliminated) {
          column.push(this.board[r][c]);
        }
      }

      const types = [
        RuneType.Fire, RuneType.Water, RuneType.Wind,
        RuneType.Earth, RuneType.Light, RuneType.Dark
      ];

      for (let r = 0; r < BOARD_SIZE; r++) {
        const targetRow = BOARD_SIZE - 1 - r;
        if (r < column.length) {
          const cell = column[r];
          const fallDistance = targetRow - this.findOriginalRow(c, cell);
          this.board[targetRow][c] = cell;
          if (fallDistance > 0) {
            this.board[targetRow][c].fallOffsetY = -fallDistance * 84;
            this.board[targetRow][c].fallTimer = 0;
            this.board[targetRow][c].fallDuration = FALL_DURATION * (1 + fallDistance * 0.1);
          } else {
            this.board[targetRow][c].fallOffsetY = 0;
            this.board[targetRow][c].fallTimer = 1;
            this.board[targetRow][c].fallDuration = FALL_DURATION;
          }
        } else {
          const newType = types[Math.floor(Math.random() * types.length)];
          const newCell = this.createCell(newType, true);
          const emptySlots = BOARD_SIZE - column.length;
          const fallDistance = emptySlots - r;
          newCell.fallOffsetY = -(fallDistance + (BOARD_SIZE - column.length)) * 84;
          newCell.fallTimer = 0;
          newCell.fallDuration = FALL_DURATION * (1 + fallDistance * 0.15);
          this.board[targetRow][c] = newCell;
        }
      }
    }
  }

  findOriginalRow(col: number, cell: CellData): number {
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (this.board[r][col] === cell) return r;
    }
    return 0;
  }

  updateFalling(dt: number): void {
    let allDone = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.board[r][c];
        if (cell.fallTimer < 1) {
          cell.fallTimer += dt / cell.fallDuration;
          if (cell.fallTimer >= 1) {
            cell.fallTimer = 1;
            cell.fallOffsetY = 0;
          } else {
            allDone = false;
          }
        }
      }
    }

    if (allDone) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          this.board[r][c].fallOffsetY = 0;
          this.board[r][c].fallTimer = 1;
          this.board[r][c].isNew = false;
          this.board[r][c].eliminated = false;
        }
      }
      this.phase = GamePhase.CheckCascade;
    }
  }

  checkCascade(): void {
    this.currentMatches = this.findMatches();
    if (this.currentMatches.length > 0) {
      this.phase = GamePhase.Eliminating;
      this.phaseTimer = 0;
      for (const match of this.currentMatches) {
        for (const pos of match.positions) {
          this.board[pos.row][pos.col].glowTimer = GLOW_DURATION;
          this.board[pos.row][pos.col].eliminated = true;
        }
      }
    } else {
      this.phase = GamePhase.Idle;
      this.comboCount = 0;
    }
  }

  updateBurstFlash(dt: number): void {
    this.burstFlashTimer += dt;
    if (this.burstFlashTimer >= BURST_FLASH_DURATION) {
      this.burstFlashTimer = 0;
      this.phase = GamePhase.Idle;
    }
  }

  activateBurst(): void {
    if (this.energy < 1 || this.phase !== GamePhase.Idle) return;
    this.energy = 0;

    const types = [
      RuneType.Fire, RuneType.Water, RuneType.Wind,
      RuneType.Earth, RuneType.Light, RuneType.Dark
    ];
    const targetType = types[Math.floor(Math.random() * types.length)];

    const candidates: Position[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!this.board[r][c].isGolden) {
          candidates.push({ row: r, col: c });
        }
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const count = Math.min(2, candidates.length);
    for (let i = 0; i < count; i++) {
      const pos = candidates[i];
      this.board[pos.row][pos.col] = this.createCell(RuneType.Golden);
      this.board[pos.row][pos.col].isGolden = true;
      this.board[pos.row][pos.col].type = RuneType.Golden;
      this.board[pos.row][pos.col].goldenRotation = 0;
    }

    this.phase = GamePhase.BurstFlash;
    this.burstFlashTimer = 0;
  }

  handleSwipe(row: number, col: number, direction: 'left' | 'right' | 'up' | 'down'): void {
    if (this.phase !== GamePhase.Idle) return;

    const isRow = direction === 'left' || direction === 'right';
    const index = isRow ? row : col;

    this.pendingSwipe = { direction, isRow, index };
    this.phase = GamePhase.Swiping;
    this.phaseTimer = 0;
  }

  isBurstButtonHit(canvasX: number, canvasY: number, btnX: number, btnY: number, btnW: number, btnH: number): boolean {
    return canvasX >= btnX && canvasX <= btnX + btnW &&
           canvasY >= btnY && canvasY <= btnY + btnH;
  }

  reset(): void {
    this.board = this.createBoard();
    this.score = 0;
    this.energy = 0;
    this.timeRemaining = GAME_DURATION;
    this.phase = GamePhase.Idle;
    this.phaseTimer = 0;
    this.particles = [];
    this.currentMatches = [];
    this.pendingSwipe = null;
    this.scoreAnimation = 0;
    this.burstFlashTimer = 0;
    this.burstButtonPulse = 0;
    this.comboCount = 0;
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getStarRating(): number {
    if (this.score >= 2000) return 3;
    if (this.score >= 1000) return 2;
    return 1;
  }

  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
