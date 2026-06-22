import { GameManager } from './gameManager';
import { Renderer } from './renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private gameManager: GameManager;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private damageFlash: HTMLElement;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private showFPS: boolean = false;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const damageFlash = document.getElementById('damage-flash') as HTMLElement;
    
    if (!canvas || !damageFlash) {
      throw new Error('Required elements not found');
    }
    
    this.canvas = canvas;
    this.damageFlash = damageFlash;
    this.renderer = new Renderer(canvas);
    this.gameManager = new GameManager();
    
    this.setupCanvas();
    this.setupEventListeners();
    this.setupDamageFlash();
    
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
  }

  private setupCanvas(): void {
    const params = new URLSearchParams(window.location.search);
    this.showFPS = params.get('fps') === 'true';
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      const world = this.renderer.screenToWorld(screenX, screenY);
      this.gameManager.setMousePosition(world.x, world.y);
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      const world = this.renderer.screenToWorld(screenX, screenY);
      
      if (!this.gameManager.handleTowerSelectClick(world.x, world.y)) {
        if (!this.gameManager.handleUpgradeClick(world.x, world.y)) {
          this.gameManager.handleClick(world.x, world.y);
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      this.gameManager.handleKeyDown(e.key);
    });
  }

  private setupDamageFlash(): void {
    this.gameManager.setDamageFlashCallback(() => {
      this.damageFlash.classList.add('active');
      setTimeout(() => {
        this.damageFlash.classList.remove('active');
      }, 200);
    });
  }

  private handleResize(): void {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const gameAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const containerAspect = containerWidth / containerHeight;
    
    let scale: number;
    let offsetX: number;
    let offsetY: number;
    
    if (containerAspect > gameAspect) {
      scale = containerHeight / CANVAS_HEIGHT;
      offsetX = (containerWidth - CANVAS_WIDTH * scale) / 2;
      offsetY = 0;
    } else {
      scale = containerWidth / CANVAS_WIDTH;
      offsetX = 0;
      offsetY = (containerHeight - CANVAS_HEIGHT * scale) / 2;
    }
    
    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;
    
    this.renderer.setScale(scale, offsetX, offsetY);
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;
    
    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;
    }
    
    this.gameManager.update(deltaTime);
    
    this.renderer.clear();
    this.gameManager.render(this.renderer);
    
    if (this.showFPS) {
      this.drawFPS();
    }
    
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private drawFPS(): void {
    const ctx = (this.renderer as any).ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 80, 30);
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${this.fps}`, 20, 30);
    ctx.fillText(`E: ${this.gameManager.getEnemyCount()}`, 20, 50);
    ctx.fillText(`B: ${this.gameManager.getBulletCount()}`, 20, 70);
    ctx.fillText(`P: ${this.gameManager.getParticleCount()}`, 20, 90);
    ctx.restore();
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    game.start();
    
    console.log('%c像素塔防游戏已启动!', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
    console.log('操作说明:');
    console.log('  1/2/3 - 选择塔类型');
    console.log('  点击地图 - 部署塔');
    console.log('  点击已部署的塔 - 查看/升级');
    console.log('  ESC - 取消选择');
    console.log('  空格 - 游戏结束后重玩');
    console.log('  添加 ?fps=true 到URL显示性能信息');
  } catch (error) {
    console.error('游戏初始化失败:', error);
  }
});
