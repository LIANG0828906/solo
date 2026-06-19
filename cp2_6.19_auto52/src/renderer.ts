import { GameMap, COLORS, TILE_SIZE, GRID_WIDTH, GRID_HEIGHT } from './map';
import { Player } from './player';
import { HUD } from './hud';

const CHEST_ANIMATION_DURATION = 200;
const SCORE_POPUP_DURATION = 500;
const WAVE_ROW_DELAY = 50;

interface ChestAnimation {
  startTime: number;
  duration: number;
}

interface ScorePopup {
  value: number;
  startTime: number;
  gridX: number;
  gridY: number;
}

interface WaveReveal {
  startTime: number;
  rowDelay: number;
}

interface AnimationState {
  chestAnimations: Map<string, ChestAnimation>;
  scorePopup: ScorePopup | null;
  waveReveal: WaveReveal | null;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameMap: GameMap;
  private player: Player;
  private hud: HUD;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private animationState: AnimationState;
  private score: number = 0;
  private onChestCollected: ((gridX: number, gridY: number) => void) | null = null;
  private onPortalEntered: ((gridX: number, gridY: number) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    gameMap: GameMap,
    player: Player,
    hud: HUD
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建Canvas上下文');
    this.ctx = ctx;
    this.gameMap = gameMap;
    this.player = player;
    this.hud = hud;

    this.ctx.imageSmoothingEnabled = false;

    this.animationState = {
      chestAnimations: new Map(),
      scorePopup: null,
      waveReveal: null,
    };
  }

  setOnChestCollected(callback: (gridX: number, gridY: number) => void): void {
    this.onChestCollected = callback;
  }

  setOnPortalEntered(callback: (gridX: number, gridY: number) => void): void {
    this.onPortalEntered = callback;
  }

  setScore(score: number): void {
    this.score = score;
  }

  start(): void {
    this.lastTime = performance.now();
    this.triggerWaveReveal();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  triggerChestAnimation(gridX: number, gridY: number): void {
    const key = `${gridX},${gridY}`;
    this.animationState.chestAnimations.set(key, {
      startTime: performance.now(),
      duration: CHEST_ANIMATION_DURATION,
    });
  }

  triggerScorePopup(gridX: number, gridY: number, value: number = 1): void {
    this.animationState.scorePopup = {
      value,
      startTime: performance.now(),
      gridX,
      gridY,
    };
  }

  triggerWaveReveal(): void {
    this.animationState.waveReveal = {
      startTime: performance.now(),
      rowDelay: WAVE_ROW_DELAY,
    };
  }

  private gameLoop = (timestamp: number): void => {
    this.lastTime = timestamp;

    this.player.update((x: number, y: number) => this.gameMap.isWall(x, y));
    this.checkCollisions();
    this.updateAnimations();
    this.render();
    this.updateHUD();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private checkCollisions(): void {
    const playerPos = this.player.getGridPosition();
    const playerState = this.player.getState();

    if (playerState.moving) return;

    const tile = this.gameMap.getTile(playerPos.x, playerPos.y);

    if (tile.type === 'chest' && !tile.collected) {
      const collected = this.gameMap.collectChest(playerPos.x, playerPos.y);
      if (collected) {
        this.score++;
        this.triggerChestAnimation(playerPos.x, playerPos.y);
        this.triggerScorePopup(playerPos.x, playerPos.y);
        if (this.onChestCollected) {
          this.onChestCollected(playerPos.x, playerPos.y);
        }
      }
    } else if (tile.type === 'portal') {
      const newPos = this.gameMap.getRandomPortalPosition(
        playerPos.x,
        playerPos.y
      );
      this.player.setPosition(newPos.x, newPos.y);
      if (this.onPortalEntered) {
        this.onPortalEntered(newPos.x, newPos.y);
      }
    }
  }

  private updateAnimations(): void {
    const now = performance.now();

    this.animationState.chestAnimations.forEach((anim, key) => {
      if (now - anim.startTime > anim.duration) {
        this.animationState.chestAnimations.delete(key);
      }
    });

    if (this.animationState.scorePopup) {
      if (now - this.animationState.scorePopup.startTime > SCORE_POPUP_DURATION) {
        this.animationState.scorePopup = null;
      }
    }

    if (this.animationState.waveReveal) {
      const totalDuration =
        this.animationState.waveReveal.rowDelay * GRID_HEIGHT;
      if (now - this.animationState.waveReveal.startTime > totalDuration) {
        this.animationState.waveReveal = null;
      }
    }
  }

  private render(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawMap();
    this.drawChestAnimations();
    this.drawPlayer();
    this.drawScorePopup();
  }

  private drawMap(): void {
    const now = performance.now();
    let waveReveal: WaveReveal | null = null;
    if (this.animationState.waveReveal) {
      waveReveal = this.animationState.waveReveal;
    }

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.gameMap.getTile(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        let alpha = 1;
        if (waveReveal) {
          const rowStartTime = waveReveal.startTime + y * waveReveal.rowDelay;
          const elapsed = now - rowStartTime;
          if (elapsed < 0) {
            alpha = 0;
          } else if (elapsed < 200) {
            alpha = elapsed / 200;
          }
        }

        if (alpha <= 0) continue;

        this.ctx.globalAlpha = alpha;

        let bgColor = COLORS.grass;
        if (tile.type === 'wall') {
          bgColor = COLORS.wall;
        }
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        this.ctx.strokeStyle = COLORS.grid;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        if (tile.type === 'chest' && !tile.collected) {
          this.drawChest(px, py);
        } else if (tile.type === 'portal') {
          this.drawPortal(px, py, now);
        } else if (tile.type === 'wall') {
          this.drawWallTexture(px, py);
        }
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawChest(px: number, py: number): void {
    const padding = 6;
    const chestX = px + padding;
    const chestY = py + padding + 4;
    const chestW = TILE_SIZE - padding * 2;
    const chestH = TILE_SIZE - padding * 2 - 4;

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(chestX, chestY + chestH / 2, chestW, chestH / 2);

    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(chestX, chestY, chestW, chestH / 2);

    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(chestX, chestY + chestH / 2 - 2, chestW, 4);

    this.ctx.fillStyle = '#FFD700';
    const lockSize = 6;
    this.ctx.fillRect(
      chestX + chestW / 2 - lockSize / 2,
      chestY + chestH / 2 - lockSize / 2 - 1,
      lockSize,
      lockSize
    );
  }

  private drawPortal(px: number, py: number, now: number): void {
    const centerX = px + TILE_SIZE / 2;
    const centerY = py + TILE_SIZE / 2;
    const pulse = Math.sin(now / 300) * 0.2 + 0.8;
    const radius = (TILE_SIZE / 2 - 4) * pulse;

    const gradient = this.ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, '#E6E6FA');
    gradient.addColorStop(0.5, COLORS.portal);
    gradient.addColorStop(1, '#4B0082');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#DDA0DD';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawWallTexture(px: number, py: number): void {
    this.ctx.fillStyle = '#3A3A3A';
    this.ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    this.ctx.fillStyle = '#5A5A5A';
    this.ctx.fillRect(px + 4, py + 4, TILE_SIZE - 12, 4);
    this.ctx.fillRect(px + 4, py + TILE_SIZE - 12, 8, 8);
  }

  private drawChestAnimations(): void {
    const now = performance.now();

    this.animationState.chestAnimations.forEach((anim, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const progress = (now - anim.startTime) / anim.duration;
      const scale = 1 - progress;
      const alpha = 1 - progress;

      if (scale <= 0 || alpha <= 0) return;

      const px = gridX * TILE_SIZE;
      const py = gridY * TILE_SIZE;
      const centerX = px + TILE_SIZE / 2;
      const centerY = py + TILE_SIZE / 2;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(centerX, centerY);
      this.ctx.scale(scale, scale);
      this.ctx.translate(-centerX, -centerY);

      this.drawChest(px, py);

      this.ctx.restore();
    });
  }

  private drawPlayer(): void {
    const playerState = this.player.getState();
    const px = playerState.x;
    const py = playerState.y;

    const bodyX = px + 8;
    const bodyY = py + 10;
    const bodyW = 16;
    const bodyH = 18;

    this.ctx.fillStyle = COLORS.player;
    this.ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

    this.ctx.fillStyle = '#FFE4C4';
    this.ctx.fillRect(px + 10, py + 2, 12, 12);

    this.ctx.fillStyle = '#000';
    const eyeOffset = playerState.direction === 'left' ? -1 : playerState.direction === 'right' ? 1 : 0;
    this.ctx.fillRect(px + 12 + eyeOffset, py + 6, 2, 2);
    this.ctx.fillRect(px + 18 + eyeOffset, py + 6, 2, 2);

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(px + 10, py, 12, 4);

    this.ctx.fillStyle = '#2F4F4F';
    const legOffset = playerState.moving ? Math.sin(performance.now() / 50) * 2 : 0;
    this.ctx.fillRect(px + 10, py + 28, 5, 4 + legOffset);
    this.ctx.fillRect(px + 17, py + 28, 5, 4 - legOffset);
  }

  private drawScorePopup(): void {
    const popup = this.animationState.scorePopup;
    if (!popup) return;

    const now = performance.now();
    const progress = (now - popup.startTime) / SCORE_POPUP_DURATION;
    const alpha = 1 - progress;
    const offsetY = progress * 30;

    if (alpha <= 0) return;

    const px = popup.gridX * TILE_SIZE + TILE_SIZE / 2;
    const py = popup.gridY * TILE_SIZE - offsetY;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 20px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = '#FFA500';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText(`+${popup.value}`, px, py);
    this.ctx.restore();
  }

  private updateHUD(): void {
    const playerPos = this.player.getGridPosition();

    this.hud.updateScore(this.score);
    this.hud.updateChestCount(
      this.gameMap.getCollectedChests(),
      this.gameMap.getTotalChests()
    );
    this.hud.updateMinimap(this.gameMap, playerPos.x, playerPos.y);
  }

  reset(): void {
    this.score = 0;
    this.animationState.chestAnimations.clear();
    this.animationState.scorePopup = null;
    this.triggerWaveReveal();
  }
}
