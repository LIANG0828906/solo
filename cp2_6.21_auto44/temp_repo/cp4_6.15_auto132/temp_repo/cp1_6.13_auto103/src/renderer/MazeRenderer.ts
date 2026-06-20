import type { GameState, Trap } from '../game/types';
import { TRAP_COLORS } from '../game/TrapManager';
import { MAZE_WIDTH, MAZE_HEIGHT } from '../game/MazeGenerator';

const WALL_COLOR = '#2d2d2d';
const FLOOR_COLOR = '#e0e0e0';
const GRID_LINE = '#c8c8c8';
const TREASURE_COLOR = '#f1c40f';
const PLAYER_BLUE = '#4a90d9';
const PLAYER_RED = '#e74c3c';

interface AnimationState {
  startTime: number;
  duration: number;
  type: 'move' | 'trapPlace' | 'roundSwitch';
  playerId?: 'blue' | 'red';
  trapPos?: { x: number; y: number };
}

interface TriggerEffect {
  pos: { x: number; y: number };
  startTime: number;
  duration: number;
}

export class MazeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 50;
  private gameState: GameState | null = null;
  private animationFrame: number | null = null;
  private animations: AnimationState[] = [];
  private triggerEffects: TriggerEffect[] = [];
  private breathPhase: number = 0;
  private lastTraps: Trap[] = [];
  private roundSwitchAlpha: number = 0;
  private onResize: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;

    this.onResize = () => this.handleResize();
    window.addEventListener('resize', this.onResize);
    this.handleResize();
  }

  public handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const isMobile = window.innerWidth < 768;
    this.cellSize = isMobile ? 35 : 50;

    const width = MAZE_WIDTH * this.cellSize;
    const height = MAZE_HEIGHT * this.cellSize;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
  }

  public updateState(state: GameState): void {
    const prevTraps = this.lastTraps;
    const newTraps = state.traps;

    if (newTraps.length > prevTraps.length) {
      const added = newTraps.find(
        (t) => !prevTraps.some((pt) => pt.id === t.id)
      );
      if (added) {
        this.animations.push({
          startTime: performance.now(),
          duration: 500,
          type: 'trapPlace',
          trapPos: { ...added.position },
        });
        this.triggerEffects.push({
          pos: { ...added.position },
          startTime: performance.now(),
          duration: 500,
        });
      }
    }

    const wasRoundEnd = this.gameState?.phase === 'roundEnd' || this.gameState?.phase === 'matchEnd';
    const nowPlaying = state.phase === 'playing';
    if (wasRoundEnd && this.gameState && this.gameState.round !== state.round) {
      this.animations.push({
        startTime: performance.now(),
        duration: 200,
        type: 'roundSwitch',
      });
    } else if (!wasRoundEnd && this.gameState && this.gameState.currentPlayer !== state.currentPlayer) {
      this.animations.push({
        startTime: performance.now(),
        duration: 200,
        type: 'roundSwitch',
      });
    }

    this.gameState = state;
    this.lastTraps = [...state.traps];
  }

  public start(): void {
    const loop = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  public stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
  }

  private render(): void {
    const now = performance.now();
    this.breathPhase = (now % 800) / 800;

    this.animations = this.animations.filter(
      (a) => now - a.startTime < a.duration
    );
    this.triggerEffects = this.triggerEffects.filter(
      (e) => now - e.startTime < e.duration
    );

    const roundSwitchAnim = this.animations.find((a) => a.type === 'roundSwitch');
    if (roundSwitchAnim) {
      const t = (now - roundSwitchAnim.startTime) / roundSwitchAnim.duration;
      this.roundSwitchAlpha = t < 0.5 ? t * 2 : (1 - t) * 2;
    } else {
      this.roundSwitchAlpha = 0;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState) return;

    this.drawMaze();
    this.drawTreasure();
    this.drawTraps(now);
    this.drawPlayers(now);
    this.drawTriggerEffects(now);
    this.drawRoundSwitchOverlay();
  }

  private drawMaze(): void {
    if (!this.gameState) return;
    const { maze } = this.gameState;
    const cs = this.cellSize;

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const px = x * cs;
        const py = y * cs;

        if (maze[y][x] === 1) {
          this.ctx.fillStyle = WALL_COLOR;
          this.ctx.fillRect(px, py, cs, cs);
          this.drawBrickTexture(px, py, cs);
        } else {
          this.ctx.fillStyle = FLOOR_COLOR;
          this.ctx.fillRect(px, py, cs, cs);
          this.ctx.strokeStyle = GRID_LINE;
          this.ctx.lineWidth = 0.5;
          this.ctx.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1);
        }
      }
    }
  }

  private drawBrickTexture(px: number, py: number, cs: number): void {
    this.ctx.fillStyle = 'rgba(255,255,255,0.03)';
    const row = Math.floor(py / cs);
    if (row % 2 === 0) {
      this.ctx.fillRect(px + cs * 0.5, py, 1, cs * 0.5);
    } else {
      this.ctx.fillRect(px, py + cs * 0.25, 1, cs * 0.25);
      this.ctx.fillRect(px + cs * 0.5, py + cs * 0.5, 1, cs * 0.5);
    }
    this.ctx.fillRect(px, py + cs * 0.5, cs, 1);
  }

  private drawTreasure(): void {
    if (!this.gameState) return;
    const cs = this.cellSize;
    const tx = (MAZE_WIDTH - 2) * cs;
    const ty = (MAZE_HEIGHT - 2) * cs;
    const cx = tx + cs / 2;
    const cy = ty + cs / 2;

    const glowPulse = 0.5 + 0.5 * Math.sin(this.breathPhase * Math.PI * 2);

    this.ctx.shadowColor = TREASURE_COLOR;
    this.ctx.shadowBlur = 20 + glowPulse * 15;
    this.ctx.fillStyle = TREASURE_COLOR;
    this.ctx.beginPath();
    const size = cs * 0.3 + glowPulse * 3;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const outerX = cx + Math.cos(angle) * size;
      const outerY = cy + Math.sin(angle) * size;
      const innerAngle = angle + Math.PI / 5;
      const innerX = cx + Math.cos(innerAngle) * size * 0.45;
      const innerY = cy + Math.sin(innerAngle) * size * 0.45;
      if (i === 0) this.ctx.moveTo(outerX, outerY);
      else this.ctx.lineTo(outerX, outerY);
      this.ctx.lineTo(innerX, innerY);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  private drawTraps(now: number): void {
    if (!this.gameState) return;
    const cs = this.cellSize;

    for (const trap of this.gameState.traps) {
      const px = trap.position.x * cs;
      const py = trap.position.y * cs;
      const color = TRAP_COLORS[trap.type];
      const cx = px + cs / 2;
      const cy = py + cs / 2;

      this.ctx.save();
      this.ctx.globalAlpha = 0.85;
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;

      if (trap.type === 'sleep') {
        const r = cs * 0.3 + Math.sin(now / 300) * 3;
        this.ctx.globalAlpha = 0.35;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${cs * 0.35}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
        this.ctx.fillText('Z', cx, cy);
      } else {
        const size = cs * 0.6;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.globalAlpha = 0.8 + 0.2 * Math.sin(now / 200);
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(cx - size / 2, cy - size / 4 + (i - 1) * (size / 4));
          this.ctx.lineTo(cx + size / 2, cy - size / 4 + (i - 1) * (size / 4));
          this.ctx.stroke();
        }
        this.ctx.beginPath();
        this.ctx.moveTo(cx - size / 2, cy - size / 2);
        this.ctx.lineTo(cx - size / 2, cy + size / 2);
        this.ctx.moveTo(cx + size / 2, cy - size / 2);
        this.ctx.lineTo(cx + size / 2, cy + size / 2);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  private drawPlayers(now: number): void {
    if (!this.gameState) return;
    const cs = this.cellSize;
    const breathScale = 0.92 + 0.08 * Math.sin(this.breathPhase * Math.PI * 2);

    for (const id of ['blue', 'red'] as const) {
      const player = this.gameState.players[id];
      const color = id === 'blue' ? PLAYER_BLUE : PLAYER_RED;

      let dx = player.position.x;
      let dy = player.position.y;

      const moveAnim = this.animations.find(
        (a) => a.type === 'move' && a.playerId === id
      );
      if (moveAnim) {
        const t = Math.min(1, (now - moveAnim.startTime) / moveAnim.duration);
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        dx = player.prevPosition.x + (player.position.x - player.prevPosition.x) * easeT;
        dy = player.prevPosition.y + (player.position.y - player.prevPosition.y) * easeT;
      }

      const cx = dx * cs + cs / 2;
      const cy = dy * cs + cs / 2;
      const radius = cs * 0.35 * breathScale;

      this.ctx.save();
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(255,255,255,0.35)';
      this.ctx.beginPath();
      this.ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fff';
      this.ctx.font = `bold ${cs * 0.3}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(id === 'blue' ? '1' : '2', cx, cy);

      if (player.sleepTurns > 0) {
        this.ctx.fillStyle = 'rgba(155,89,182,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius * 1.6, 0, Math.PI * 2);
        this.ctx.fill();
      }
      if (player.lockedDirection) {
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  private drawTriggerEffects(now: number): void {
    const cs = this.cellSize;
    for (const effect of this.triggerEffects) {
      const t = (now - effect.startTime) / effect.duration;
      if (t >= 1) continue;

      const cx = effect.pos.x * cs + cs / 2;
      const cy = effect.pos.y * cs + cs / 2;
      const maxR = cs * 0.75;
      const r = maxR * t;
      const alpha = 1 - t;

      this.ctx.save();
      this.ctx.strokeStyle = `rgba(231, 76, 60, ${alpha})`;
      this.ctx.lineWidth = 3 * (1 - t * 0.5);
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = `rgba(231, 76, 60, ${alpha * 0.2})`;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawRoundSwitchOverlay(): void {
    if (this.roundSwitchAlpha <= 0) return;
    this.ctx.save();
    this.ctx.fillStyle = `rgba(26, 26, 46, ${this.roundSwitchAlpha * 0.5})`;
    this.ctx.fillRect(0, 0, MAZE_WIDTH * this.cellSize, MAZE_HEIGHT * this.cellSize);
    this.ctx.restore();
  }

  public triggerMoveAnimation(playerId: 'blue' | 'red'): void {
    this.animations.push({
      startTime: performance.now(),
      duration: 300,
      type: 'move',
      playerId,
    });
  }
}
