import {
  createInitialState,
  canPlacePiece,
  placePiece,
  endTurn,
  applyScoreChanges,
  setSelectedElement,
  calculateTerritoryStats,
  getGridSize,
  type GameState,
  type ElementType,
  type TerritoryStats
} from './gameEngine';
import { HexGridRenderer } from './hexGrid';

class Game {
  private state: GameState;
  private gridRenderer: HexGridRenderer;
  private ringCanvas: HTMLCanvasElement;
  private ringCtx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private isProcessingTurn: boolean = false;

  constructor() {
    this.state = createInitialState();

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('找不到游戏画布');
    this.gridRenderer = new HexGridRenderer(canvas);

    this.ringCanvas = document.getElementById('energy-ring-canvas') as HTMLCanvasElement;
    if (!this.ringCanvas) throw new Error('找不到能量环画布');
    const ringCtx = this.ringCanvas.getContext('2d');
    if (!ringCtx) throw new Error('无法获取能量环画布上下文');
    this.ringCtx = ringCtx;

    const container = document.getElementById('game-container');
    if (!container) throw new Error('找不到游戏容器');
    this.container = container;

    this.bindEvents();
    this.resize();
    this.updateUI();
    this.startGameLoop();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    canvas.addEventListener('click', (e) => this.handleClick(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mouseleave', () => this.gridRenderer.setHoveredCell(null));

    const elements1 = document.querySelectorAll('#player1-elements .element-btn');
    const elements2 = document.querySelectorAll('#player2-elements .element-btn');

    elements1.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.state.currentPlayer === 1 && !this.state.isAnimating) {
          const element = (btn as HTMLElement).dataset.element as ElementType;
          if (element) {
            setSelectedElement(this.state, 1, element);
            this.updateElementButtons();
          }
        }
      });
    });

    elements2.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.state.currentPlayer === 2 && !this.state.isAnimating) {
          const element = (btn as HTMLElement).dataset.element as ElementType;
          if (element) {
            setSelectedElement(this.state, 2, element);
            this.updateElementButtons();
          }
        }
      });
    });
  }

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.gridRenderer.resize(width, height);

    const ringSize = 180;
    const dpr = window.devicePixelRatio || 1;
    this.ringCanvas.width = ringSize * dpr;
    this.ringCanvas.height = ringSize * dpr;
    this.ringCanvas.style.width = ringSize + 'px';
    this.ringCanvas.style.height = ringSize + 'px';
    this.ringCtx.scale(dpr, dpr);
  }

  private handleClick(e: MouseEvent): void {
    if (this.state.isAnimating || this.isProcessingTurn) return;

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hex = this.gridRenderer.pixelToHex(x, y);
    if (!hex) return;

    const currentPlayer = this.state.currentPlayer;
    const selectedElement = this.state.players[currentPlayer].selectedElement;

    if (!canPlacePiece(this.state, hex.q, hex.r)) return;

    this.isProcessingTurn = true;
    this.state.isAnimating = true;

    const currentTime = performance.now();
    this.gridRenderer.addPlaceAnimation(hex.q, hex.r, currentTime);

    const result = placePiece(this.state, hex.q, hex.r, selectedElement, currentPlayer);

    setTimeout(() => {
      for (const fused of result.fusedCells) {
        const cell = this.state.grid[fused.r][fused.q];
        if (cell.element) {
          this.gridRenderer.addFusionParticles(fused.q, fused.r, cell.element, performance.now());
        }
      }
    }, 100);

    setTimeout(() => {
      for (const exploded of result.explodedCells) {
        this.gridRenderer.addExplosionAnimation(exploded.q, exploded.r, performance.now());
      }
    }, 200);

    applyScoreChanges(this.state, result.scoreChange);

    setTimeout(() => {
      endTurn(this.state);
      this.state.isAnimating = false;
      this.isProcessingTurn = false;
      this.updateUI();
    }, 500);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state.isAnimating) return;

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hex = this.gridRenderer.pixelToHex(x, y);
    this.gridRenderer.setHoveredCell(hex);
  }

  private updateUI(): void {
    this.updatePlayerPanel(1);
    this.updatePlayerPanel(2);
    this.updateTurnIndicator();
    this.updateElementButtons();
  }

  private updatePlayerPanel(playerId: 1 | 2): void {
    const player = this.state.players[playerId];

    const scoreEl = document.getElementById(`player${playerId}-score`);
    if (scoreEl) scoreEl.textContent = player.score.toString();

    const energyEl = document.getElementById(`player${playerId}-energy`);
    if (energyEl) {
      const percent = (player.energy / player.maxEnergy) * 100;
      energyEl.style.width = percent + '%';
      if (percent >= 100) {
        energyEl.classList.add('glow');
      } else {
        energyEl.classList.remove('glow');
      }
    }

    const actionEl = document.getElementById(`player${playerId}-action`);
    if (actionEl) actionEl.textContent = player.actionPoints.toString();

    const healthEl = document.getElementById(`player${playerId}-health`);
    if (healthEl) {
      const percent = (player.health / player.maxHealth) * 100;
      healthEl.style.width = percent + '%';
    }
  }

  private updateTurnIndicator(): void {
    const indicator = document.getElementById('turn-indicator');
    if (!indicator) return;

    indicator.textContent = `玩家 ${this.state.currentPlayer} 回合`;
    indicator.className = `turn-indicator player${this.state.currentPlayer}`;
  }

  private updateElementButtons(): void {
    const currentPlayer = this.state.currentPlayer;
    const selected = this.state.players[currentPlayer].selectedElement;

    const container = document.getElementById(`player${currentPlayer}-elements`);
    if (!container) return;

    const buttons = container.querySelectorAll('.element-btn');
    buttons.forEach((btn) => {
      const element = (btn as HTMLElement).dataset.element;
      if (element === selected) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  private renderEnergyRing(): void {
    const width = this.ringCanvas.width / (window.devicePixelRatio || 1);
    const height = this.ringCanvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 60;

    this.ringCtx.clearRect(0, 0, width, height);

    const stats1 = calculateTerritoryStats(this.state, 1);
    const stats2 = calculateTerritoryStats(this.state, 2);

    const combinedStats: TerritoryStats = {
      fire: stats1.fire + stats2.fire,
      water: stats1.water + stats2.water,
      earth: stats1.earth + stats2.earth,
      wind: stats1.wind + stats2.wind,
      total: stats1.total + stats2.total
    };

    if (combinedStats.total === 0) {
      this.ringCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ringCtx.lineWidth = 12;
      this.ringCtx.beginPath();
      this.ringCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ringCtx.stroke();
      return;
    }

    const elements: ElementType[] = ['fire', 'water', 'earth', 'wind'];
    const elementColors: { [key in ElementType]: string } = {
      fire: '#FF6B35',
      water: '#4FC3F7',
      earth: '#8BC34A',
      wind: '#B2EBF2'
    };

    let startAngle = -Math.PI / 2;

    for (const element of elements) {
      const value = combinedStats[element];
      if (value === 0) continue;

      const proportion = value / combinedStats.total;
      const endAngle = startAngle + proportion * Math.PI * 2;

      const gradient = this.ringCtx.createLinearGradient(
        centerX - radius,
        centerY - radius,
        centerX + radius,
        centerY + radius
      );
      gradient.addColorStop(0, elementColors[element]);
      gradient.addColorStop(1, this.lightenColor(elementColors[element], 30));

      this.ringCtx.strokeStyle = gradient;
      this.ringCtx.lineWidth = 12;
      this.ringCtx.lineCap = 'round';
      this.ringCtx.beginPath();
      this.ringCtx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ringCtx.stroke();

      startAngle = endAngle;
    }

    this.ringCtx.save();
    this.ringCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ringCtx.shadowBlur = 4;
    this.ringCtx.fillStyle = '#ffffff';
    this.ringCtx.font = 'bold 16px sans-serif';
    this.ringCtx.textAlign = 'center';
    this.ringCtx.textBaseline = 'middle';
    this.ringCtx.fillText(`第 ${this.state.turn} 回合`, centerX, centerY - 8);

    this.ringCtx.font = '12px sans-serif';
    this.ringCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const totalTiles = Math.floor(combinedStats.total);
    this.ringCtx.fillText(`${totalTiles} 块领地`, centerX, centerY + 10);
    this.ringCtx.restore();
  }

  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  private startGameLoop(): void {
    const loop = (time: number) => {
      this.lastTime = time;

      this.gridRenderer.render(this.state, time);
      this.gridRenderer.cleanupExplosions(this.state, time);
      this.renderEnergyRing();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
