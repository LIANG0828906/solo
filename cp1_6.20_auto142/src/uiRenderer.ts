import type { Player } from './player';
import type { Position } from './types';
import { GAME_CONFIG } from './constants';
import { generateAvatar } from './avatarGenerator';

export class UIRenderer {
  private hpBar: HTMLElement;
  private hpText: HTMLElement;
  private coinsDisplay: HTMLElement;
  private statusDisplay: HTMLElement;
  private minimapCtx: CanvasRenderingContext2D;
  private avatarCanvas: HTMLCanvasElement;
  private eventToast: HTMLElement;
  private toastTimeout: number | null = null;

  constructor() {
    this.hpBar = document.getElementById('hp-bar') as HTMLElement;
    this.hpText = document.getElementById('hp-text') as HTMLElement;
    this.coinsDisplay = document.getElementById('coins-display') as HTMLElement;
    this.statusDisplay = document.getElementById('status-display') as HTMLElement;
    this.eventToast = document.getElementById('event-toast') as HTMLElement;

    const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.minimapCtx = minimapCanvas.getContext('2d') as CanvasRenderingContext2D;

    this.avatarCanvas = document.getElementById('avatar-canvas') as HTMLCanvasElement;

    generateAvatar(this.avatarCanvas, Date.now().toString());
  }

  public updatePlayerUI(player: Player): void {
    const now = performance.now();
    const hp = player.getHp();
    const maxHp = player.getMaxHp();
    const hpPercent = (hp / maxHp) * 100;

    this.hpBar.style.width = `${hpPercent}%`;
    this.hpText.textContent = `${hp} / ${maxHp}`;

    if (hpPercent <= 30) {
      this.hpBar.classList.add('low-hp');
    } else {
      this.hpBar.classList.remove('low-hp');
    }

    this.coinsDisplay.textContent = player.getCoins().toString();

    const statusText = player.getStatusText(now);
    this.statusDisplay.textContent = statusText;
    if (player.isSlowed(now)) {
      this.statusDisplay.classList.add('slowed');
    } else {
      this.statusDisplay.classList.remove('slowed');
    }
  }

  public showEventToast(message: string, type: 'damage' | 'coin' | 'slow' | 'portal'): void {
    if (this.toastTimeout !== null) {
      window.clearTimeout(this.toastTimeout);
    }

    this.eventToast.textContent = message;
    this.eventToast.className = '';
    this.eventToast.classList.add('visible', type);

    this.toastTimeout = window.setTimeout(() => {
      this.eventToast.classList.remove('visible');
      this.toastTimeout = null;
    }, 1500);
  }

  public renderMinimap(
    playerPos: Position,
    exploredPositions: Position[],
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): void {
    const ctx = this.minimapCtx;
    const canvas = ctx.canvas;
    const cellSize = 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rangeX = Math.max(1, bounds.maxX - bounds.minX + 1);
    const rangeY = Math.max(1, bounds.maxY - bounds.minY + 1);
    const maxRange = Math.max(rangeX, rangeY);

    let offsetX = 0;
    let offsetY = 0;
    let drawCellSize = cellSize;

    if (maxRange * cellSize <= 80) {
      drawCellSize = cellSize;
      offsetX = Math.floor((80 - rangeX * cellSize) / 2);
      offsetY = Math.floor((80 - rangeY * cellSize) / 2);
    } else {
      drawCellSize = Math.floor(80 / maxRange);
      offsetX = Math.floor((80 - rangeX * drawCellSize) / 2);
      offsetY = Math.floor((80 - rangeY * drawCellSize) / 2);
    }

    ctx.fillStyle = '#555555';
    for (const pos of exploredPositions) {
      const px = offsetX + (pos.x - bounds.minX) * drawCellSize;
      const py = offsetY + (pos.y - bounds.minY) * drawCellSize;
      ctx.fillRect(px, py, drawCellSize, drawCellSize);
    }

    ctx.fillStyle = '#ffffff';
    const playerPx = offsetX + (playerPos.x - bounds.minX) * drawCellSize;
    const playerPy = offsetY + (playerPos.y - bounds.minY) * drawCellSize;
    ctx.fillRect(playerPx, playerPy, drawCellSize, drawCellSize);
  }
}
