import { GameMap, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './Map';
import { Player, MoveInput } from './Player';
import { Interactable, FloatingText, Chest, Teleport } from './Interactable';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: GameMap;
  private player: Player;
  private interactables: Interactable[] = [];
  private floatingTexts: FloatingText[] = [];
  private moveInput: MoveInput = { up: false, down: false, left: false, right: false };
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private isResetting: boolean = false;
  private resetAlpha: number = 0;
  private resetPhase: 'fadeOut' | 'waiting' | 'fadeIn' | 'idle' = 'idle';
  private resetTimer: number = 0;
  private initialPlayerX: number;
  private initialPlayerY: number;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private frameTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.map = new GameMap();
    this.initialPlayerX = 2 * TILE_SIZE + 16;
    this.initialPlayerY = 2 * TILE_SIZE + 8;
    this.player = new Player(this.initialPlayerX, this.initialPlayerY);

    this.initInteractables();
    this.setupCanvasScaling();
  }

  private initInteractables(): void {
    this.interactables = [
      new Chest(4 * TILE_SIZE + TILE_SIZE / 2, 5 * TILE_SIZE + TILE_SIZE / 2),
      new Chest(12 * TILE_SIZE + TILE_SIZE / 2, 3 * TILE_SIZE + TILE_SIZE / 2),
      new Chest(15 * TILE_SIZE + TILE_SIZE / 2, 11 * TILE_SIZE + TILE_SIZE / 2),
      new Teleport(
        8 * TILE_SIZE + TILE_SIZE / 2,
        12 * TILE_SIZE + TILE_SIZE / 2,
        17 * TILE_SIZE + TILE_SIZE / 2,
        7 * TILE_SIZE + TILE_SIZE / 2
      )
    ];
  }

  private setupCanvasScaling(): void {
    const resize = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

      let canvasHeight = windowHeight - 40;
      let canvasWidth = canvasHeight * aspectRatio;

      if (canvasWidth > windowWidth - 40) {
        canvasWidth = windowWidth - 40;
        canvasHeight = canvasWidth / aspectRatio;
      }

      this.canvas.style.width = `${canvasWidth}px`;
      this.canvas.style.height = `${canvasHeight}px`;
    };

    resize();
    window.addEventListener('resize', resize);
  }

  public setMoveInput(input: Partial<MoveInput>): void {
    this.moveInput = { ...this.moveInput, ...input };
  }

  public triggerInteract(): void {
    if (this.isResetting) return;
    const result = this.player.interact(this.interactables);
    if (result) {
      this.floatingTexts.push(result);
    }
  }

  public triggerReset(): void {
    if (this.isResetting) return;
    this.isResetting = true;
    this.resetPhase = 'fadeOut';
    this.resetAlpha = 0;
    this.resetTimer = 0;
  }

  private doReset(): void {
    this.player.reset(this.initialPlayerX, this.initialPlayerY);
    for (const item of this.interactables) {
      item.reset();
    }
    this.floatingTexts = [];
    this.map.reset();
  }

  public start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    const frameStart = performance.now();
    this.update(deltaTime);
    this.render();
    this.frameTime = performance.now() - frameStart;

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (this.isResetting) {
      this.updateReset(deltaTime);
    } else {
      this.player.move(this.moveInput, this.map);

      for (const item of this.interactables) {
        item.update(deltaTime);
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= deltaTime;
        ft.y -= 20 * deltaTime;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }
  }

  private updateReset(deltaTime: number): void {
    const fadeDuration = 0.15;
    const waitDuration = 0.3;
    this.resetTimer: number;
  }

  private render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.map.render(this.ctx);

    for (const item of this.interactables) {
      const inRange = item.isInRange(this.player.getCenterX(), this.player.getCenterY());
      item.render(this.ctx, inRange);
    }

    this.player.render(this.ctx);

    this.renderFloatingTexts();
    this.renderUI();

    if (this.isResetting) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.resetAlpha})`;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  private renderFloatingTexts(): void {
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, ft.life / ft.maxLife);
      const fontWeight = ft.bold ? 'bold' : 'normal';
      this.ctx.font = `${fontWeight} ${ft.size}px system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillText(ft.text, ft.x + 2, ft.y + 2);

      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.globalAlpha = 1;
    }
  }

  private renderUI(): void {
    const px = Math.floor(this.player.getCenterX());
    const py = Math.floor(this.player.getCenterY());

    this.ctx.font = '16px system-ui, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(8, 8, 180, 52);

    this.ctx.fillStyle = '#ECF0F1';
    this.ctx.fillText(`坐标: (${px}, ${py})`, 16, 14);
    this.ctx.fillText(`朝向: ${this.player.direction}`, 16, 36);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(CANVAS_WIDTH - 120, 8, 112, 36);
    this.ctx.fillStyle = '#F1C40F';
    this.ctx.font = 'bold 18px system-ui, sans-serif';
    this.ctx.fillText(`金币: ${this.player.gold}`, CANVAS_WIDTH - 16, 14);

    this.ctx.textAlign = 'left';
    this.ctx.font = '12px system-ui, sans-serif';
    this.ctx.fillStyle = 'rgba(236, 240, 241, 0.5)';
    this.ctx.fillText(`FPS: ${this.fps} | ${this.frameTime.toFixed(1)}ms`, 16, CANVAS_HEIGHT - 24);

    this.ctx.textAlign = 'right';
    this.ctx.fillText('WASD移动 | E交互 | R重置', CANVAS_WIDTH - 16, CANVAS_HEIGHT - 24);
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getMap(): GameMap {
    return this.map;
  }

  public getInteractables(): Interactable[] {
    return this.interactables;
  }
}
