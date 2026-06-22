import { GameMap, COLORS, GRID_WIDTH, GRID_HEIGHT } from './map';

const MINIMAP_TILE_SIZE = 4;

interface MinimapFlash {
  gridX: number;
  gridY: number;
  startTime: number;
  duration: number;
}

export class HUD {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private chestCountElement: HTMLElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private panelElement: HTMLElement;
  private victoryText: HTMLElement;
  private totalChests: number;
  private victoryInterval: number | null = null;
  private scoreBounceTimeout: number | null = null;
  private minimapFlashes: MinimapFlash[] = [];
  private flashAnimationId: number | null = null;
  private lastGameMap: GameMap | null = null;
  private lastPlayerX: number = 0;
  private lastPlayerY: number = 0;
  private victoryHideTimeout: number | null = null;
  private victoryFadeTimeout: number | null = null;

  constructor(parentElement: HTMLElement, totalChests: number) {
    this.totalChests = totalChests;
    this.container = document.createElement('div');
    this.container.className = 'hud-panel';

    this.panelElement = document.createElement('div');
    this.panelElement.className = 'hud-content';

    const title = document.createElement('h2');
    title.textContent = '游戏信息';
    title.className = 'hud-title';
    this.panelElement.appendChild(title);

    const scoreSection = document.createElement('div');
    scoreSection.className = 'hud-section';
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'hud-label';
    scoreLabel.textContent = '得分';
    this.scoreElement = document.createElement('div');
    this.scoreElement.className = 'hud-score';
    this.scoreElement.textContent = '0';
    scoreSection.appendChild(scoreLabel);
    scoreSection.appendChild(this.scoreElement);
    this.panelElement.appendChild(scoreSection);

    const chestSection = document.createElement('div');
    chestSection.className = 'hud-section';
    const chestLabel = document.createElement('div');
    chestLabel.className = 'hud-label';
    chestLabel.textContent = '宝箱';
    this.chestCountElement = document.createElement('div');
    this.chestCountElement.className = 'hud-chests';
    this.chestCountElement.textContent = `0 / ${totalChests}`;
    chestSection.appendChild(chestLabel);
    chestSection.appendChild(this.chestCountElement);
    this.panelElement.appendChild(chestSection);

    const minimapSection = document.createElement('div');
    minimapSection.className = 'hud-section';
    const minimapLabel = document.createElement('div');
    minimapLabel.className = 'hud-label';
    minimapLabel.textContent = '小地图';
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = GRID_WIDTH * MINIMAP_TILE_SIZE;
    this.minimapCanvas.height = GRID_HEIGHT * MINIMAP_TILE_SIZE;
    this.minimapCanvas.className = 'hud-minimap';
    const minimapCtx = this.minimapCanvas.getContext('2d');
    if (!minimapCtx) throw new Error('无法创建小地图上下文');
    this.minimapCtx = minimapCtx;
    minimapSection.appendChild(minimapLabel);
    minimapSection.appendChild(this.minimapCanvas);
    this.panelElement.appendChild(minimapSection);

    this.victoryText = document.createElement('div');
    this.victoryText.className = 'victory-text';
    this.victoryText.textContent = '胜利！';
    this.panelElement.appendChild(this.victoryText);

    this.container.appendChild(this.panelElement);
    parentElement.appendChild(this.container);

    this.addStyles();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .hud-panel {
        position: relative;
        width: 100%;
      }
      .hud-content {
        position: relative;
        background: rgba(20, 20, 40, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 20px;
        border: 2px solid rgba(255, 255, 255, 0.15);
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      }
      .hud-content.victory {
        border-color: #FFD700;
        animation: goldPulse 1s ease-in-out infinite;
      }
      @keyframes goldPulse {
        0%, 100% {
          border-color: #FFD700;
          box-shadow: 0 0 10px #FFD700, 0 0 20px rgba(255, 215, 0, 0.5);
        }
        50% {
          border-color: #FFA500;
          box-shadow: 0 0 20px #FFD700, 0 0 40px rgba(255, 215, 0, 0.8);
        }
      }
      .hud-title {
        color: #fff;
        font-size: 18px;
        margin-bottom: 16px;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
      }
      .hud-section {
        margin-bottom: 16px;
      }
      .hud-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .hud-score {
        color: #FFD700;
        font-size: 32px;
        font-weight: bold;
        text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
        transform-origin: left center;
      }
      .hud-score.bounce {
        animation: scoreBounce 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      @keyframes scoreBounce {
        0% { transform: scale(1); }
        60% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      .hud-chests {
        color: #9370DB;
        font-size: 24px;
        font-weight: bold;
      }
      .hud-minimap {
        display: block;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        background: #1a1a2e;
      }
      .victory-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 28px;
        font-weight: bold;
        color: #FFD700;
        text-shadow: 0 0 10px #FFD700, 0 0 20px rgba(255, 215, 0, 0.8);
        opacity: 0;
        pointer-events: none;
        letter-spacing: 4px;
        z-index: 10;
        white-space: nowrap;
      }
      .victory-text.show {
        animation: victoryBreath 2s ease-in-out infinite, victoryFadeIn 500ms ease-out forwards;
      }
      .victory-text.hide {
        animation: victoryFadeOut 500ms ease-in forwards;
      }
      @keyframes victoryBreath {
        0%, 100% {
          color: #FFD700;
          text-shadow: 0 0 10px #FFD700, 0 0 20px rgba(255, 215, 0, 0.8);
          opacity: 0.8;
        }
        50% {
          color: #FFFFFF;
          text-shadow: 0 0 20px #FFFFFF, 0 0 40px rgba(255, 255, 255, 0.6);
          opacity: 1.0;
        }
      }
      @keyframes victoryFadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      @keyframes victoryFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  updateScore(score: number): void {
    this.updateScoreAnimation(score);
  }

  private updateScoreAnimation(score: number): void {
    this.scoreElement.textContent = score.toString();

    if (this.scoreBounceTimeout) {
      clearTimeout(this.scoreBounceTimeout);
    }

    this.scoreElement.classList.remove('bounce');
    void this.scoreElement.offsetWidth;
    this.scoreElement.classList.add('bounce');
    this.scoreBounceTimeout = window.setTimeout(() => {
      this.scoreElement.classList.remove('bounce');
      this.scoreBounceTimeout = null;
    }, 300);
  }

  updateChestCount(collected: number, total: number): void {
    this.totalChests = total;
    this.chestCountElement.textContent = `${collected} / ${total}`;

    if (collected >= total) {
      this.triggerVictoryAnimation();
    }
  }

  triggerMinimapFlash(gridX: number, gridY: number): void {
    const flash: MinimapFlash = {
      gridX,
      gridY,
      startTime: performance.now(),
      duration: 200,
    };
    this.minimapFlashes.push(flash);

    if (!this.flashAnimationId) {
      this.flashAnimationLoop();
    }
  }

  private flashAnimationLoop = (): void => {
    this.flashAnimationId = requestAnimationFrame(this.flashAnimationLoop);
    this.renderMinimapWithFlashes();
  };

  private renderMinimapWithFlashes(): void {
    if (!this.lastGameMap) return;

    const ctx = this.minimapCtx;
    const tileSize = MINIMAP_TILE_SIZE;
    const now = performance.now();

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.lastGameMap.getTile(x, y);
        let color = COLORS.grass;

        if (tile.type === 'wall') {
          color = COLORS.wall;
        } else if (tile.type === 'chest' && !tile.collected) {
          color = COLORS.chest;
        } else if (tile.type === 'portal') {
          color = COLORS.portal;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    this.minimapFlashes = this.minimapFlashes.filter((flash) => {
      const elapsed = now - flash.startTime;
      if (elapsed >= flash.duration) return false;

      const flashCycle = 100;
      const cyclePos = elapsed % flashCycle;
      const intensity = cyclePos < flashCycle / 2 ? 1 : 0;

      if (intensity > 0) {
        const flashX = flash.gridX * tileSize;
        const flashY = flash.gridY * tileSize;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(flashX - 1, flashY - 1, tileSize + 2, tileSize + 2);

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(flashX, flashY, tileSize, tileSize);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
          flashX + tileSize / 4,
          flashY + tileSize / 4,
          tileSize / 2,
          tileSize / 2
        );
      }

      return true;
    });

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(
      this.lastPlayerX * tileSize + tileSize / 2,
      this.lastPlayerY * tileSize + tileSize / 2,
      tileSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (this.minimapFlashes.length === 0 && this.flashAnimationId) {
      cancelAnimationFrame(this.flashAnimationId);
      this.flashAnimationId = null;
    }
  }

  updateMinimap(gameMap: GameMap, playerGridX: number, playerGridY: number): void {
    this.lastGameMap = gameMap;
    this.lastPlayerX = playerGridX;
    this.lastPlayerY = playerGridY;

    if (this.flashAnimationId) return;

    const ctx = this.minimapCtx;
    const tileSize = MINIMAP_TILE_SIZE;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = gameMap.getTile(x, y);
        let color = COLORS.grass;

        if (tile.type === 'wall') {
          color = COLORS.wall;
        } else if (tile.type === 'chest' && !tile.collected) {
          color = COLORS.chest;
        } else if (tile.type === 'portal') {
          color = COLORS.portal;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(
      playerGridX * tileSize + tileSize / 2,
      playerGridY * tileSize + tileSize / 2,
      tileSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  triggerVictoryAnimation(): void {
    if (this.victoryInterval) return;
    this.panelElement.classList.add('victory');
    this.showVictoryEffect();
  }

  private showVictoryEffect(): void {
    if (this.victoryHideTimeout) {
      clearTimeout(this.victoryHideTimeout);
    }
    if (this.victoryFadeTimeout) {
      clearTimeout(this.victoryFadeTimeout);
    }

    this.victoryText.classList.remove('show', 'hide');
    void this.victoryText.offsetWidth;
    this.victoryText.classList.add('show');

    this.victoryHideTimeout = window.setTimeout(() => {
      this.hideVictoryEffect();
    }, 3000);
  }

  private hideVictoryEffect(): void {
    this.victoryText.classList.remove('show');
    this.victoryText.classList.add('hide');

    this.victoryFadeTimeout = window.setTimeout(() => {
      this.victoryText.classList.remove('hide');
      this.victoryFadeTimeout = null;
    }, 500);
  }

  reset(): void {
    this.scoreElement.textContent = '0';
    this.chestCountElement.textContent = `0 / ${this.totalChests}`;
    this.panelElement.classList.remove('victory');
    this.victoryText.classList.remove('show', 'hide');

    if (this.victoryInterval) {
      clearInterval(this.victoryInterval);
      this.victoryInterval = null;
    }
    if (this.scoreBounceTimeout) {
      clearTimeout(this.scoreBounceTimeout);
      this.scoreBounceTimeout = null;
    }
    if (this.victoryHideTimeout) {
      clearTimeout(this.victoryHideTimeout);
      this.victoryHideTimeout = null;
    }
    if (this.victoryFadeTimeout) {
      clearTimeout(this.victoryFadeTimeout);
      this.victoryFadeTimeout = null;
    }
    if (this.flashAnimationId) {
      cancelAnimationFrame(this.flashAnimationId);
      this.flashAnimationId = null;
    }
    this.minimapFlashes = [];
  }

  remove(): void {
    this.container.remove();
    if (this.victoryInterval) {
      clearInterval(this.victoryInterval);
    }
    if (this.scoreBounceTimeout) {
      clearTimeout(this.scoreBounceTimeout);
    }
    if (this.victoryHideTimeout) {
      clearTimeout(this.victoryHideTimeout);
    }
    if (this.victoryFadeTimeout) {
      clearTimeout(this.victoryFadeTimeout);
    }
    if (this.flashAnimationId) {
      cancelAnimationFrame(this.flashAnimationId);
    }
  }
}
