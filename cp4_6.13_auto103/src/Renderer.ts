import { Player } from './Player';
import { PlatformManager, PlatformData } from './Platform';
import { CoinManager, CoinData, FloatingText } from './Coin';

export interface StarParticle {
  x: number;
  y: number;
  size: number;
  brightness: number;
  speed: number;
  twinkle: number;
}

export interface GameUIState {
  score: number;
  scoreAnim: number;
  prevScore: number;
  gameOver: boolean;
  gameOverAlpha: number;
  restartBtn: { x: number; y: number; w: number; h: number; hover: boolean };
  highScore: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private worldWidth: number;
  private worldHeight: number;
  private stars: StarParticle[] = [];
  private starCount: number = 80;

  private readonly COLOR_BG = '#1a1a2e';
  private readonly COLOR_PLATFORM = '#8b5a2b';
  private readonly COLOR_PLATFORM_DARK = '#5c3a1a';
  private readonly COLOR_PLATFORM_LIGHT = '#a0703a';
  private readonly COLOR_BRICK_LINE = '#4a2d13';
  private readonly COLOR_PLAYER = '#3498db';
  private readonly COLOR_PLAYER_DARK = '#2980b9';
  private readonly COLOR_PLAYER_FACE = '#f5cba7';
  private readonly COLOR_COIN = '#ffd700';
  private readonly COLOR_COIN_DARK = '#b8860b';
  private readonly COLOR_GREEN = '#2ecc71';
  private readonly COLOR_GOLD = '#ffd700';
  private readonly COLOR_TEXT = '#ffffff';

  constructor(canvas: HTMLCanvasElement, worldWidth: number, worldHeight: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight * 3 - this.worldHeight,
        size: Math.random() * 2 + 1,
        brightness: Math.random() * 0.6 + 0.4,
        speed: Math.random() * 0.15 + 0.05,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  public resize(worldWidth: number, worldHeight: number): void {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.starCount = Math.floor(80 * (worldWidth / 400));
    this.initStars();
  }

  public clear(): void {
    this.ctx.fillStyle = this.COLOR_BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private applyCameraScale(): { offsetX: number; offsetY: number; scale: number } {
    const scaleX = this.canvas.width / this.worldWidth;
    const scaleY = this.canvas.height / this.worldHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.canvas.width - this.worldWidth * scale) / 2;
    const offsetY = (this.canvas.height - this.worldHeight * scale) / 2;
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);
    this.ctx.imageSmoothingEnabled = false;
    return { offsetX, offsetY, scale };
  }

  public drawBackground(cameraY: number, time: number): void {
    const cam = this.applyCameraScale();
    this.ctx.fillStyle = this.COLOR_BG;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 1)');
    gradient.addColorStop(1, 'rgba(20, 30, 60, 1)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    for (const star of this.stars) {
      let y = star.y - cameraY * star.speed;
      while (y < -20) y += this.worldHeight * 3;
      while (y > this.worldHeight + 20) y -= this.worldHeight * 3;
      let x = star.x;
      while (x < -10) x += this.worldWidth;
      while (x > this.worldWidth + 10) x -= this.worldWidth;

      const tw = 0.5 + 0.5 * Math.sin(time * 0.002 + star.twinkle);
      const alpha = star.brightness * tw;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(star.size), Math.ceil(star.size));
    }

    this.ctx.restore();
    void cam;
  }

  private drawPlatform(p: PlatformData, cameraY: number): void {
    const drawY = p.y - cameraY;
    if (drawY + p.height < 0 || drawY > this.worldHeight) return;

    const x = Math.floor(p.x);
    const y = Math.floor(drawY);
    const w = Math.floor(p.width);
    const h = p.height;

    this.ctx.fillStyle = this.COLOR_PLATFORM_DARK;
    this.ctx.fillRect(x, y, w, h);

    this.ctx.fillStyle = this.COLOR_PLATFORM;
    this.ctx.fillRect(x, y, w, h - 2);

    this.ctx.fillStyle = this.COLOR_PLATFORM_LIGHT;
    this.ctx.fillRect(x, y, w, 2);

    this.ctx.fillStyle = this.COLOR_BRICK_LINE;
    const brickW = 20;
    for (let bx = 0; bx < w; bx += brickW) {
      this.ctx.fillRect(x + bx, y, 1, h);
    }
    for (let by = 4; by < h; by += 6) {
      this.ctx.fillRect(x, y + by, w, 1);
      for (let bx = brickW / 2; bx < w; bx += brickW) {
        this.ctx.fillRect(x + bx, y + by, 1, Math.min(6, h - by));
      }
    }
  }

  public drawPlatforms(platforms: PlatformManager, cameraY: number): void {
    const cam = this.applyCameraScale();
    for (const p of platforms.getAll()) {
      this.drawPlatform(p, cameraY);
    }
    this.ctx.restore();
    void cam;
  }

  private drawCoin(c: CoinData, cameraY: number): void {
    const drawY = c.y - cameraY;
    if (drawY + 16 < 0 || drawY - 16 > this.worldHeight) return;

    const bounce = Math.sin(c.animPhase) * 2;
    const spin = Math.abs(Math.cos(c.animPhase * 0.7));
    const rX = 5 + spin * 3;
    const rY = 7;
    const cx = Math.floor(c.x);
    const cy = Math.floor(drawY + bounce);

    this.ctx.fillStyle = this.COLOR_COIN_DARK;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 1, rX, rY, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = this.COLOR_COIN;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (spin > 0.3) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.fillRect(cx - 1, cy - 3, 1, 3);
    }
  }

  public drawCoins(coins: CoinManager, cameraY: number): void {
    const cam = this.applyCameraScale();
    for (const c of coins.getCoins()) {
      this.drawCoin(c, cameraY);
    }
    this.ctx.restore();
    void cam;
  }

  private drawPlayerSprite(player: Player, cameraY: number): void {
    const drawY = player.y - cameraY;
    const px = Math.floor(player.x);
    const py = Math.floor(drawY);
    const pw = player.width;
    const ph = player.height;
    const facing = player.facingRight ? 1 : -1;
    const cx = px + pw / 2;

    this.ctx.save();
    this.ctx.translate(cx, py + ph / 2);
    this.ctx.scale(facing, 1);

    const legOffset = Math.abs(player.velocityX) > 0.5 ? 1 : 0;

    this.ctx.fillStyle = this.COLOR_PLAYER_DARK;
    this.ctx.fillRect(-pw / 2, ph / 2 - 4, pw - 4, 4);

    this.ctx.fillStyle = this.COLOR_PLAYER;
    this.ctx.fillRect(-pw / 2 + 1, -ph / 2 + 2, pw - 2, ph - 6);

    this.ctx.fillStyle = this.COLOR_PLAYER;
    this.ctx.fillRect(-pw / 2 + 2, -ph / 2, pw - 4, 4);

    this.ctx.fillStyle = this.COLOR_PLAYER_FACE;
    this.ctx.fillRect(0, -ph / 2 + 1, 2, 2);

    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(1, -ph / 2 + 2, 1, 1);

    this.ctx.fillStyle = this.COLOR_PLAYER_DARK;
    this.ctx.fillRect(-pw / 2 + 1, ph / 2 - 3, 3, 3);
    this.ctx.fillRect(pw / 2 - 4, ph / 2 - 3 + legOffset, 3, 3);

    this.ctx.restore();
  }

  public drawPlayer(player: Player, cameraY: number): void {
    const cam = this.applyCameraScale();
    this.drawPlayerSprite(player, cameraY);
    this.ctx.restore();
    void cam;
  }

  public drawFloatingTexts(texts: FloatingText[], cameraY: number): void {
    if (texts.length === 0) return;
    const cam = this.applyCameraScale();
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    for (const ft of texts) {
      if (!ft.active) continue;
      const drawY = ft.y - cameraY;
      this.ctx.fillStyle = `rgba(255, 215, 0, ${ft.alpha.toFixed(3)})`;
      this.ctx.fillText(ft.text, Math.floor(ft.x), Math.floor(drawY));
    }
    this.ctx.restore();
    void cam;
  }

  public drawUI(ui: GameUIState): void {
    const scaleX = this.canvas.width / this.worldWidth;
    const scaleY = this.canvas.height / this.worldHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.canvas.width - this.worldWidth * scale) / 2;
    const offsetY = (this.canvas.height - this.worldHeight * scale) / 2;

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);
    this.ctx.imageSmoothingEnabled = false;

    const baseFontSize = 14;
    let scoreScale = 1;
    if (ui.scoreAnim > 0) {
      scoreScale = 1 + Math.sin(ui.scoreAnim) * 0.25;
    }

    this.ctx.font = `${baseFontSize * scoreScale}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    this.ctx.fillStyle = this.COLOR_GOLD;
    const text = `SCORE: ${ui.score}`;
    this.ctx.fillText(text, this.worldWidth / 2, 16);

    if (ui.highScore > 0) {
      this.ctx.font = `${10}px "Press Start 2P", monospace`;
      this.ctx.fillStyle = this.COLOR_GREEN;
      this.ctx.fillText(`BEST: ${ui.highScore}`, this.worldWidth / 2, 40);
    }

    this.ctx.restore();
  }

  public drawGameOver(ui: GameUIState): boolean {
    if (!ui.gameOver || ui.gameOverAlpha <= 0) return false;

    const scaleX = this.canvas.width / this.worldWidth;
    const scaleY = this.canvas.height / this.worldHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.canvas.width - this.worldWidth * scale) / 2;
    const offsetY = (this.canvas.height - this.worldHeight * scale) / 2;

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);

    this.ctx.fillStyle = `rgba(0, 0, 0, ${(ui.gameOverAlpha * 0.7).toFixed(3)})`;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    const alpha = Math.min(1, ui.gameOverAlpha);
    this.ctx.globalAlpha = alpha;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.fillStyle = this.COLOR_GOLD;
    this.ctx.fillText('GAME OVER', this.worldWidth / 2, this.worldHeight / 2 - 60);

    this.ctx.font = '12px "Press Start 2P", monospace';
    this.ctx.fillStyle = this.COLOR_TEXT;
    this.ctx.fillText(`FINAL SCORE`, this.worldWidth / 2, this.worldHeight / 2 - 20);
    this.ctx.font = '20px "Press Start 2P", monospace';
    this.ctx.fillStyle = this.COLOR_GREEN;
    this.ctx.fillText(`${ui.score}`, this.worldWidth / 2, this.worldHeight / 2 + 10);

    const btn = ui.restartBtn;
    this.ctx.fillStyle = btn.hover ? this.COLOR_GREEN : this.COLOR_GOLD;
    this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('RESTART', btn.x + btn.w / 2, btn.y + btn.h / 2);

    this.ctx.globalAlpha = 1;
    this.ctx.restore();

    return btn.hover;
  }

  public getRestartButton(): { x: number; y: number; w: number; h: number } {
    const w = 140;
    const h = 40;
    const x = this.worldWidth / 2 - w / 2;
    const y = this.worldHeight / 2 + 50;
    return { x, y, w, h };
  }

  public toWorldCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const scaleX = this.canvas.width / this.worldWidth;
    const scaleY = this.canvas.height / this.worldHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.canvas.width - this.worldWidth * scale) / 2;
    const offsetY = (this.canvas.height - this.worldHeight * scale) / 2;
    return {
      x: (cx - offsetX) / scale,
      y: (cy - offsetY) / scale,
    };
  }
}
