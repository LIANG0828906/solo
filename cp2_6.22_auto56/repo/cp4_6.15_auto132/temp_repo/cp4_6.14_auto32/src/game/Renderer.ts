import { Snake, Food, DeathParticle, Direction, MAP_WIDTH, MAP_HEIGHT, SMALL_MAP_WIDTH, SMALL_MAP_HEIGHT, GRID_SIZE, SEGMENT_SIZE, SEGMENT_GAP, FOOD_SIZE } from './types';

interface RendererOptions {
  canvas: HTMLCanvasElement;
  onDirectionChange?: (direction: Direction) => void;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onDirectionChange?: (direction: Direction) => void;
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  private width: number = MAP_WIDTH;
  private height: number = MAP_HEIGHT;
  private isSmallScreen: boolean = false;

  private snakes: Map<string, Snake> = new Map();
  private foods: Map<string, Food> = new Map();
  private deathParticles: DeathParticle[] = [];
  private playerSnakeId: string = '';
  private startTime: number = Date.now();

  private snakeHeadRotations: Map<string, { current: number; target: number; startTime: number }> = new Map();
  private flashSnakes: Set<string> = new Set();
  private flashStartTime: number = 0;

  private prevLeaderboard: { id: string; name: string; score: number }[] = [];
  private leaderboardAnimations: Map<string, { offsetY: number; opacity: number; startTime: number }> = new Map();

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.onDirectionChange = options.onDirectionChange;
    this.setupEventListeners();
    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setPlayerSnakeId(id: string) {
    this.playerSnakeId = id;
  }

  setGameState(snakes: Map<string, Snake>, foods: Map<string, Food>, deathParticles: DeathParticle[]) {
    this.snakes = snakes;
    this.foods = foods;
    this.deathParticles = deathParticles;
  }

  triggerSnakeFlash(snakeIds: string[]) {
    this.flashSnakes = new Set(snakeIds);
    this.flashStartTime = Date.now();
  }

  updateLeaderboard(newLeaderboard: { id: string; name: string; score: number }[]) {
    const now = Date.now();
    const oldPositions = new Map(this.prevLeaderboard.map((item, idx) => [item.id, idx]));

    newLeaderboard.forEach((item, newIdx) => {
      const oldIdx = oldPositions.get(item.id);
      if (oldIdx === undefined) {
        this.leaderboardAnimations.set(item.id, { offsetY: -20, opacity: 0, startTime: now });
      } else if (oldIdx !== newIdx) {
        this.leaderboardAnimations.set(item.id, { offsetY: (oldIdx - newIdx) * 30, opacity: 1, startTime: now });
      }
    });

    this.prevLeaderboard = newLeaderboard;
  }

  private handleResize() {
    this.isSmallScreen = window.innerWidth < 768;
    if (this.isSmallScreen) {
      this.width = SMALL_MAP_WIDTH;
      this.height = SMALL_MAP_HEIGHT;
    } else {
      this.width = MAP_WIDTH;
      this.height = MAP_HEIGHT;
    }
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      let direction: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
      }
      if (direction) {
        e.preventDefault();
        this.onDirectionChange?.(direction);
      }
    });
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private normalizeAngle(angle: number): number {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }

  private getSnakeHeadRotation(snake: Snake): number {
    let anim = this.snakeHeadRotations.get(snake.id);
    if (!anim || anim.target !== snake.targetRotation) {
      anim = {
        current: anim?.current || snake.headRotation,
        target: snake.targetRotation,
        startTime: Date.now(),
      };
      this.snakeHeadRotations.set(snake.id, anim);
    }

    const elapsed = (Date.now() - anim.startTime) / 100;
    const t = Math.min(1, elapsed);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const currentAngle = anim.current;
    const targetAngle = anim.target;
    const delta = this.normalizeAngle(targetAngle - currentAngle);
    return currentAngle + delta * easeT;
  }

  private getWaveOffset(segmentIndex: number, time: number): { x: number; y: number } {
    const amplitude = 2;
    const period = 0.3;
    const phase = segmentIndex * 0.2;
    const offset = Math.sin((time / period) * Math.PI * 2 + phase) * amplitude;
    return { x: offset * 0.3, y: offset * 0.7 };
  }

  private getFoodOpacity(time: number): number {
    const period = 0.5;
    const t = (Math.sin((time / period) * Math.PI * 2) + 1) / 2;
    return 0.7 + t * 0.3;
  }

  private getGradientColor(baseColor: string, index: number, total: number): string {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    const factor = 1 - (index / total) * 0.6;
    const newR = Math.min(255, Math.floor(r * factor + 50 * (1 - factor)));
    const newG = Math.min(255, Math.floor(g * factor + 50 * (1 - factor)));
    const newB = Math.min(255, Math.floor(b * factor + 50 * (1 - factor)));
    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  private drawGrid() {
    this.ctx.strokeStyle = '#16213e';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x += GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += GRID_SIZE) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  private drawBoundary() {
    this.ctx.strokeStyle = '#ff4444';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(1.5, 1.5, this.width - 3, this.height - 3);
    this.ctx.setLineDash([]);
  }

  private drawFood(food: Food, time: number) {
    const opacity = this.getFoodOpacity(time);
    const pulse = 1 + Math.sin(time * Math.PI * 4) * 0.05;
    const size = FOOD_SIZE * pulse;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#ff4757';
    this.ctx.shadowColor = '#ff4757';
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(food.x - size / 2, food.y - size / 2, size, size);
    this.ctx.restore();
  }

  private drawSnake(snake: Snake, time: number) {
    if (!snake.alive) return;

    const now = Date.now();
    const isFlashing = this.flashSnakes.has(snake.id) && (now - this.flashStartTime) < 300;
    const flashProgress = Math.min(1, (now - this.flashStartTime) / 300);

    for (let i = snake.segments.length - 1; i >= 0; i--) {
      const seg = snake.segments[i];
      const waveOffset = i === 0 ? { x: 0, y: 0 } : this.getWaveOffset(i, time);
      const x = seg.x + waveOffset.x;
      const y = seg.y + waveOffset.y;

      let color = this.getGradientColor(snake.color, i, snake.segments.length);
      if (isFlashing) {
        const whiteFactor = Math.sin(flashProgress * Math.PI);
        color = `rgba(255, 255, 255, ${whiteFactor})`;
      }

      if (i === 0) {
        const rotation = this.getSnakeHeadRotation(snake);
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.fillStyle = isFlashing ? 'rgba(255, 255, 255, ' + Math.sin(flashProgress * Math.PI) + ')' : snake.color;
        this.ctx.shadowColor = snake.color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.roundRect(-SEGMENT_SIZE / 2, -SEGMENT_SIZE / 2, SEGMENT_SIZE, SEGMENT_SIZE, 4);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        this.ctx.arc(4, -4, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-4, -5, 1.5, 0, Math.PI * 2);
        this.ctx.arc(4, -5, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
      } else {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = snake.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.roundRect(x - SEGMENT_SIZE / 2, y - SEGMENT_SIZE / 2, SEGMENT_SIZE, SEGMENT_SIZE, 3);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  private drawDeathParticles(time: number) {
    const now = Date.now();
    for (const p of this.deathParticles) {
      const age = (now - p.createdAt) / 1000;
      if (age > 1) continue;
      const opacity = 1 - age;
      const size = p.size * (1 - age * 0.5);

      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 5;
      this.ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      this.ctx.restore();
    }
  }

  render() {
    const time = (Date.now() - this.startTime) / 1000;

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawGrid();
    this.drawBoundary();

    for (const food of this.foods.values()) {
      this.drawFood(food, time);
    }

    for (const snake of this.snakes.values()) {
      if (snake.id !== this.playerSnakeId) {
        this.drawSnake(snake, time);
      }
    }

    const playerSnake = this.snakes.get(this.playerSnakeId);
    if (playerSnake) {
      this.drawSnake(playerSnake, time);
    }

    this.drawDeathParticles(time);
  }

  getLeaderboardAnimation(id: string): { translateY: number; opacity: number } {
    const anim = this.leaderboardAnimations.get(id);
    if (!anim) return { translateY: 0, opacity: 1 };

    const elapsed = (Date.now() - anim.startTime) / 200;
    const t = Math.min(1, elapsed);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    return {
      translateY: anim.offsetY * (1 - easeT),
      opacity: this.lerp(anim.opacity, 1, easeT),
    };
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  getWidth() { return this.width; }
  getHeight() { return this.height; }
  getIsSmallScreen() { return this.isSmallScreen; }
}
