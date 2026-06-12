import { GameState, RuneType, RUNE_COLORS, RUNE_TYPES, CellPosition } from '../types';

export class UIManager {
  private runeDots: Map<RuneType, HTMLElement>;
  private timerEl: HTMLElement;
  private portalHintEl: HTMLElement;
  private screenFlashEl: HTMLElement;
  private victoryOverlayEl: HTMLElement;
  private finalTimeEl: HTMLElement;
  private finalRunesEl: HTMLElement;
  private finalDifficultyEl: HTMLElement;
  private startOverlayEl: HTMLElement;
  private startBtnEl: HTMLButtonElement;
  private restartBtnEl: HTMLButtonElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;

  private onStartCallback?: () => void;
  private onRestartCallback?: () => void;

  constructor() {
    this.runeDots = new Map();
    RUNE_TYPES.forEach((type) => {
      const el = document.querySelector(`.rune-dot[data-rune="${type}"]`);
      if (el) this.runeDots.set(type, el as HTMLElement);
    });

    this.timerEl = this.requireEl('#timer-value');
    this.portalHintEl = this.requireEl('#portal-hint');
    this.screenFlashEl = this.requireEl('#screen-flash');
    this.victoryOverlayEl = this.requireEl('#victory-overlay');
    this.finalTimeEl = this.requireEl('#final-time');
    this.finalRunesEl = this.requireEl('#final-runes');
    this.finalDifficultyEl = this.requireEl('#final-difficulty');
    this.startOverlayEl = this.requireEl('#start-overlay');
    this.startBtnEl = this.requireEl('#start-btn') as HTMLButtonElement;
    this.restartBtnEl = this.requireEl('#restart-btn') as HTMLButtonElement;
    this.minimapCanvas = this.requireEl('#minimap-canvas') as HTMLCanvasElement;

    const ctx = this.minimapCanvas.getContext('2d');
    if (!ctx) throw new Error('无法获取迷你地图Canvas上下文');
    this.minimapCtx = ctx;

    this.bindEvents();
    this.setupMinimapCanvas();
    this.hideAllHints();
  }

  private requireEl(selector: string): HTMLElement {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`找不到元素: ${selector}`);
    return el as HTMLElement;
  }

  private bindEvents(): void {
    this.startBtnEl.addEventListener('click', () => {
      this.hideStartOverlay();
      this.onStartCallback?.();
    });

    this.restartBtnEl.addEventListener('click', () => {
      this.hideVictory();
      this.onRestartCallback?.();
    });

    window.addEventListener('resize', () => {
      this.setupMinimapCanvas();
    });
  }

  private setupMinimapCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.minimapCanvas.getBoundingClientRect();
    this.minimapCanvas.width = rect.width * dpr;
    this.minimapCanvas.height = rect.height * dpr;
    this.minimapCtx.scale(dpr, dpr);
  }

  public onStart(cb: () => void): void {
    this.onStartCallback = cb;
  }

  public onRestart(cb: () => void): void {
    this.onRestartCallback = cb;
  }

  public update(state: GameState): void {
    this.updateTimer(state.elapsedTime);
    this.updateRuneDots(state.collectedRunes);
    this.updatePortalHint(state.portal.activated);
    this.drawMinimap(state);
  }

  private updateTimer(elapsedSeconds: number): void {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = Math.floor(elapsedSeconds % 60);
    this.timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  private updateRuneDots(collected: Set<RuneType>): void {
    RUNE_TYPES.forEach((type) => {
      const dot = this.runeDots.get(type);
      if (!dot) return;
      if (collected.has(type)) {
        if (!dot.classList.contains('collected')) {
          dot.classList.add('collected');
        }
      } else {
        dot.classList.remove('collected');
      }
    });
  }

  private updatePortalHint(activated: boolean): void {
    if (activated) {
      this.portalHintEl.classList.add('visible');
    } else {
      this.portalHintEl.classList.remove('visible');
    }
  }

  private hideAllHints(): void {
    this.portalHintEl.classList.remove('visible');
  }

  public flashScreen(runeType: RuneType): void {
    const color = RUNE_COLORS[runeType].css;
    this.screenFlashEl.style.setProperty('--flash-color', color);
    this.screenFlashEl.classList.remove('active');
    void this.screenFlashEl.offsetWidth;
    this.screenFlashEl.classList.add('active');
  }

  public showVictory(data: {
    elapsedTime: number;
    collectedRunes: number;
    mazeSize: number;
  }): void {
    const mins = Math.floor(data.elapsedTime / 60);
    const secs = Math.floor(data.elapsedTime % 60);
    this.finalTimeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
    this.finalRunesEl.textContent = `${data.collectedRunes} / 4`;
    this.finalDifficultyEl.textContent = `${data.mazeSize}×${data.mazeSize}`;

    requestAnimationFrame(() => {
      this.victoryOverlayEl.classList.add('visible');
    });
  }

  public hideVictory(): void {
    this.victoryOverlayEl.classList.remove('visible');
  }

  private hideStartOverlay(): void {
    this.startOverlayEl.classList.add('hidden');
  }

  public showStartOverlay(): void {
    this.startOverlayEl.classList.remove('hidden');
  }

  private drawMinimap(state: GameState): void {
    const ctx = this.minimapCtx;
    const rect = this.minimapCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const size = state.maze.size;

    const padding = 8;
    const availableW = w - padding * 2;
    const availableH = h - padding * 2;
    const cell = Math.min(availableW / size, availableH / size);
    const offsetX = padding + (availableW - cell * size) / 2;
    const offsetY = padding + (availableH - cell * size) / 2;

    ctx.clearRect(0, 0, w, h);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isWall = state.maze.grid[y][x] === 1;
        ctx.fillStyle = isWall ? 'rgba(60, 90, 140, 0.6)' : 'rgba(20, 40, 80, 0.4)';
        this.fillRounded(
          ctx,
          offsetX + x * cell,
          offsetY + y * cell,
          cell - 0.5,
          cell - 0.5,
          1
        );
        ctx.fill();
      }
    }

    const exitPos = state.portal.position;
    const exitX = offsetX + exitPos.x * cell + cell / 2;
    const exitY = offsetY + exitPos.y * cell + cell / 2;
    const exitPulse = (Math.sin(performance.now() / 300) + 1) / 2;
    ctx.beginPath();
    ctx.arc(exitX, exitY, (cell * 0.35) * (0.85 + exitPulse * 0.15), 0, Math.PI * 2);
    ctx.fillStyle = state.portal.activated
      ? `rgba(100, 255, 180, ${0.7 + exitPulse * 0.3})`
      : 'rgba(120, 140, 160, 0.5)';
    ctx.fill();

    for (const rune of state.runes) {
      if (rune.collected) continue;
      const rx = offsetX + rune.position.x * cell + cell / 2;
      const ry = offsetY + rune.position.y * cell + cell / 2;
      ctx.beginPath();
      ctx.arc(rx, ry, cell * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = RUNE_COLORS[rune.type].css;
      ctx.fill();
      ctx.shadowColor = RUNE_COLORS[rune.type].css;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const playerPos = state.player.isMoving
      ? this.lerpPosition(state.player.position, state.player.targetPosition, state.player.moveProgress)
      : state.player.position;

    const px = offsetX + playerPos.x * cell + cell / 2;
    const py = offsetY + playerPos.y * cell + cell / 2;
    ctx.beginPath();
    ctx.arc(px, py, cell * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#88ddff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= size; y++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * cell);
      ctx.lineTo(offsetX + size * cell, offsetY + y * cell);
      ctx.stroke();
    }
    for (let x = 0; x <= size; x++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * cell, offsetY);
      ctx.lineTo(offsetX + x * cell, offsetY + size * cell);
      ctx.stroke();
    }
  }

  private lerpPosition(a: CellPosition, b: CellPosition, t: number): { x: number; y: number } {
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return {
      x: a.x + (b.x - a.x) * eased,
      y: a.y + (b.y - a.y) * eased,
    };
  }

  private fillRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath();
    this.addRoundedRectPath(ctx, x, y, w, h, 1);
    ctx.fill();
  }

  private addRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private fillRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath();
    this.addRoundedRectPath(ctx, x, y, w, h, 1);
    ctx.fill();
  }

  private fillRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath();
    this.addRoundedRectPath(ctx, x, y, w, h, 1);
    ctx.fill();
  }
}
