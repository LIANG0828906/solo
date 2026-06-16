import { EnergyManager } from './energySystem';
import { GameObjectManager } from './gameObjects';
import { UIRenderer } from './uiRenderer';

type GameState = 'title' | 'playing' | 'gameover';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private energy: EnergyManager;
  private objects: GameObjectManager;
  private ui: UIRenderer;
  private gameState: GameState = 'title';
  private lastTime: number = 0;
  private joystickX: number = 0;
  private joystickY: number = 0;
  private isDragging: boolean = false;
  private joystickCenterX: number = 0;
  private joystickCenterY: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private animFrameId: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.energy = new EnergyManager();
    this.objects = new GameObjectManager();
    this.ui = new UIRenderer();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.onTouchEnd());
    this.canvas.addEventListener('click', (e) => this.onClick(e));

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private resize(): void {
    const dpr = 1;
    const w = Math.max(800, window.innerWidth * 0.95);
    const h = window.innerHeight * 0.92;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.scale(dpr, dpr);

    this.ui.initStars(this.canvas.width, this.canvas.height);
    this.joystickCenterX = this.canvas.width / 2;
    this.joystickCenterY = this.canvas.height - 100;
    if (this.gameState === 'title') {
      this.objects.playerX = this.canvas.width / 2;
      this.objects.playerY = this.canvas.height - 80;
      this.objects.playerTargetX = this.canvas.width / 2;
    }
  }

  private getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private getTouchPos(e: TouchEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private isOnJoystick(x: number, y: number): boolean {
    const dx = x - this.joystickCenterX;
    const dy = y - this.joystickCenterY;
    return Math.sqrt(dx * dx + dy * dy) < 90;
  }

  private updateJoystick(x: number, y: number): void {
    const dx = x - this.joystickCenterX;
    const dy = y - this.joystickCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 80;
    if (dist <= maxDist) {
      this.joystickX = dx;
      this.joystickY = dy;
    } else {
      this.joystickX = (dx / dist) * maxDist;
      this.joystickY = (dy / dist) * maxDist;
    }
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);
    if (this.isOnJoystick(pos.x, pos.y)) {
      this.isDragging = true;
      this.updateJoystick(pos.x, pos.y);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);
    this.mouseX = pos.x;
    this.mouseY = pos.y;
    if (this.isDragging) {
      this.updateJoystick(pos.x, pos.y);
    }
    if (this.gameState === 'playing') {
      this.objects.playerTargetX = pos.x;
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    if (this.isOnJoystick(pos.x, pos.y)) {
      this.isDragging = true;
      this.updateJoystick(pos.x, pos.y);
    }
    if (this.gameState === 'playing') {
      this.objects.playerTargetX = pos.x;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    if (this.isDragging) {
      this.updateJoystick(pos.x, pos.y);
    }
    if (this.gameState === 'playing') {
      this.objects.playerTargetX = pos.x;
    }
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private onClick(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);

    if (this.gameState === 'title') {
      this.startGame();
      return;
    }

    if (this.gameState === 'gameover') {
      this.startGame();
      return;
    }

    if (this.gameState === 'playing') {
      for (const t of this.objects.interceptTargets) {
        const dx = pos.x - t.x;
        const dy = pos.y - (t.y - t.size / 2 - 25);
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          if (this.energy.consumeIntercept()) {
            this.objects.intercept(t.x, t.y);
          }
          return;
        }
      }
    }
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.energy.reset();
    this.objects.reset(this.canvas.width, this.canvas.height);
    this.joystickX = 0;
    this.joystickY = 0;
    this.isDragging = false;
  }

  private gameLoop(timestamp: number): void {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(deltaTime: number): void {
    if (this.gameState !== 'playing') return;

    this.energy.allocateEnergy(this.joystickX, this.joystickY);
    this.energy.update(deltaTime);

    if (this.energy.isDepleted) {
      this.gameState = 'gameover';
      return;
    }

    const hitResult = this.objects.update(
      deltaTime,
      this.canvas.width,
      this.canvas.height,
      this.energy.shieldActive,
      this.energy.engineActive,
      this.energy.weaponActive,
      this.energy.weaponRatio
    );

    if (hitResult === 'hit') {
      this.energy.consumeHit();
      this.objects.spawnExplosion(this.objects.playerX, this.objects.playerY, 15);
      if (this.energy.isDepleted) {
        this.gameState = 'gameover';
      }
    }

    if (!this.isDragging) {
      this.joystickX *= 0.9;
      this.joystickY *= 0.9;
      if (Math.abs(this.joystickX) < 0.5) this.joystickX = 0;
      if (Math.abs(this.joystickY) < 0.5) this.joystickY = 0;
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ui.render(this.ctx, this.energy, this.objects, this.gameState, this.joystickX, this.joystickY);
  }
}

new Game();
