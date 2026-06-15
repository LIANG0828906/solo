import { Island } from './Island';
import { Player } from './Player';
import { UI } from './UI';
import { BG_COLOR, HEX_HEIGHT } from './data';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private island: Island;
  private player: Player;
  private ui: UI;
  private lastTime: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private offsetStartX: number = 0;
  private offsetStartY: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.island = new Island();
    const startPos = this.island.findSandPosition();
    this.player = new Player(startPos.q, startPos.r);
    this.ui = new UI();

    this.centerOnPlayer();
    this.player.updatePosition(this.island, this.offsetX, this.offsetY);

    this.setupEventListeners();
    this.gameLoop(performance.now());
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private centerOnPlayer(): void {
    const pos = this.island.hexToPixel(this.player.getActualQ(), this.player.getActualR());
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    this.offsetX = canvasWidth / 2 - pos.x;
    this.offsetY = canvasHeight / 2 - pos.y;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 2 || e.button === 1) {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.offsetStartX = this.offsetX;
      this.offsetStartY = this.offsetY;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      this.offsetX = this.offsetStartX + (e.clientX - this.dragStartX);
      this.offsetY = this.offsetStartY + (e.clientY - this.dragStartY);
    } else {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hoverIndex = this.ui.getInventoryIndexAt(x, y);
      this.ui.setHoveredInventoryIndex(hoverIndex);
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    this.isDragging = false;
  }

  private onClick(e: MouseEvent): void {
    if (this.player.isDead()) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const inventoryIndex = this.ui.getInventoryIndexAt(x, y);
    if (inventoryIndex >= 0) {
      this.ui.setClickedInventoryIndex(inventoryIndex);
      const itemCenter = this.ui.getInventoryItemCenter(inventoryIndex);
      const playerPos = this.player.getRenderPosition(this.island, this.offsetX, this.offsetY);
      if (itemCenter) {
        this.player.useItem(inventoryIndex, itemCenter.x, itemCenter.y, playerPos.x, playerPos.y);
      }
      return;
    }

    const resourceHit = this.hitTestResourceIcon(x, y);
    if (resourceHit >= 0) {
      const pos = this.island.getResourceIconPosition(
        this.player.getActualQ(),
        this.player.getActualR(),
        resourceHit,
        this.offsetX,
        this.offsetY
      );
      const resource = this.island.collectResource(
        this.player.getActualQ(),
        this.player.getActualR(),
        resourceHit
      );
      if (resource) {
        this.player.addToInventory(resource, pos.x, pos.y);
      }
      return;
    }

    const hexCoord = this.pixelToHex(x - this.offsetX, y - this.offsetY);
    if (hexCoord) {
      this.player.tryMove(this.island, hexCoord.q, hexCoord.r);
    }
  }

  private pixelToHex(px: number, py: number): { q: number; r: number } | null {
    const q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / (HEX_HEIGHT / 2);
    const r = (2 / 3 * py) / (HEX_HEIGHT / 2);

    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    const rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }

  private hitTestResourceIcon(x: number, y: number): number {
    const count = this.island.getResourceCount(
      this.player.getActualQ(),
      this.player.getActualR()
    );
    for (let i = 0; i < count; i++) {
      const pos = this.island.getResourceIconPosition(
        this.player.getActualQ(),
        this.player.getActualR(),
        i,
        this.offsetX,
        this.offsetY
      );
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 18) {
        return i;
      }
    }
    return -1;
  }

  private gameLoop(currentTime: number): void {
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(dt: number): void {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    this.island.update(dt, canvasWidth, canvasHeight);
    this.player.update(dt, this.island);
    this.ui.update(dt);
  }

  private render(): void {
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    this.island.drawOcean(this.ctx, this.offsetX, this.offsetY);
    this.island.drawTerrain(this.ctx, this.offsetX, this.offsetY);
    this.island.drawResources(this.ctx, this.offsetX, this.offsetY, this.player.getActualQ(), this.player.getActualR());

    this.player.draw(this.ctx, this.island, this.offsetX, this.offsetY);

    this.island.drawWeatherEffects(this.ctx, canvasWidth, canvasHeight);

    this.ui.drawStatusBars(this.ctx, this.player);
    this.ui.drawInventoryPanel(this.ctx, this.player, canvasWidth, canvasHeight);
    this.ui.drawHintBar(this.ctx, this.player, this.island, canvasWidth, canvasHeight);
    this.ui.drawInventoryFullWarning(this.ctx, this.player, canvasWidth);

    if (this.player.isDead()) {
      this.ui.drawGameOver(this.ctx, canvasWidth, canvasHeight);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
