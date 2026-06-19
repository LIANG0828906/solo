import { GameMap, COLORS, GRID_WIDTH, GRID_HEIGHT } from './map';

const MINIMAP_TILE_SIZE = 4;

export class HUD {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private chestCountElement: HTMLElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private panelElement: HTMLElement;
  private totalChests: number;
  private victoryInterval: number | null = null;
  private scoreBounceTimeout: number | null = null;

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
        background: rgba(20, 20, 40, 0.8);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 12px;
        padding: 20px;
        border: 2px solid rgba(255, 255, 255, 0.1);
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
        transition: transform 0.2s ease;
      }
      .hud-score.bounce {
        animation: scoreBounce 0.5s ease;
      }
      @keyframes scoreBounce {
        0% { transform: scale(1); }
        30% { transform: scale(1.4); }
        50% { transform: scale(0.9); }
        70% { transform: scale(1.1); }
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
    `;
    document.head.appendChild(style);
  }

  updateScore(score: number): void {
    this.scoreElement.textContent = score.toString();

    if (this.scoreBounceTimeout) {
      clearTimeout(this.scoreBounceTimeout);
    }
    this.scoreElement.classList.remove('bounce');
    void this.scoreElement.offsetWidth;
    this.scoreElement.classList.add('bounce');
    this.scoreBounceTimeout = window.setTimeout(() => {
      this.scoreElement.classList.remove('bounce');
    }, 500);
  }

  updateChestCount(collected: number, total: number): void {
    this.totalChests = total;
    this.chestCountElement.textContent = `${collected} / ${total}`;

    if (collected >= total) {
      this.triggerVictoryAnimation();
    }
  }

  updateMinimap(gameMap: GameMap, playerGridX: number, playerGridY: number): void {
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
  }

  reset(): void {
    this.scoreElement.textContent = '0';
    this.chestCountElement.textContent = `0 / ${this.totalChests}`;
    this.panelElement.classList.remove('victory');
    if (this.victoryInterval) {
      clearInterval(this.victoryInterval);
      this.victoryInterval = null;
    }
    if (this.scoreBounceTimeout) {
      clearTimeout(this.scoreBounceTimeout);
      this.scoreBounceTimeout = null;
    }
  }

  remove(): void {
    this.container.remove();
    if (this.victoryInterval) {
      clearInterval(this.victoryInterval);
    }
    if (this.scoreBounceTimeout) {
      clearTimeout(this.scoreBounceTimeout);
    }
  }
}
