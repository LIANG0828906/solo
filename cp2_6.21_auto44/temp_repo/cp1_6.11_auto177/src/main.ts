import { GameManager } from './GameManager';
import { AssemblyScene } from './AssemblyScene';
import { RaceScene } from './RaceScene';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameManager: GameManager;
  
  private assemblyScene: AssemblyScene;
  private raceScene: RaceScene;
  
  private lastTime: number = 0;
  private targetFPS: number = 60;
  private frameTime: number = 1000 / this.targetFPS;
  
  private animationId: number = 0;
  
  private transitionCanvas: HTMLCanvasElement;
  private transitionCtx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.gameManager = GameManager.getInstance();
    
    this.transitionCanvas = document.createElement('canvas');
    this.transitionCtx = this.transitionCanvas.getContext('2d')!;
    
    this.assemblyScene = new AssemblyScene(this.canvas);
    this.raceScene = new RaceScene(this.canvas);
    
    this.resizeCanvas();
    this.bindEvents();
    
    this.startGameLoop();
  }
  
  private resizeCanvas(): void {
    const container = document.getElementById('game-container')!;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    this.transitionCanvas.width = this.canvas.width;
    this.transitionCanvas.height = this.canvas.height;
    
    this.assemblyScene.resize();
  }
  
  private bindEvents(): void {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.gameManager.currentPhase === 'assembly') {
        this.assemblyScene.handleMouseMove(x, y);
      } else if (this.gameManager.currentPhase === 'race' || this.gameManager.currentPhase === 'result') {
        this.raceScene.handleMouseMove(x, y);
      }
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.gameManager.currentPhase === 'assembly') {
        this.assemblyScene.handleMouseDown(x, y);
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.gameManager.currentPhase === 'assembly') {
        this.assemblyScene.handleMouseUp(x, y);
      }
    });
    
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.gameManager.currentPhase === 'assembly') {
        this.assemblyScene.handleClick(x, y);
      } else if (this.gameManager.currentPhase === 'result') {
        this.raceScene.handleClick(x, y);
      }
    });
    
    window.addEventListener('keydown', (e) => {
      if (this.gameManager.currentPhase === 'race') {
        this.raceScene.handleKeyDown(e.key);
      }
      
      if (e.key === ' ' && this.gameManager.currentPhase === 'assembly') {
        e.preventDefault();
        this.autoFillAndStart();
      }
      
      if (e.key === 'r' || e.key === 'R') {
        if (this.gameManager.currentPhase === 'race' || this.gameManager.currentPhase === 'result') {
          this.gameManager.returnToAssembly();
        }
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (this.gameManager.currentPhase === 'race') {
        this.raceScene.handleKeyUp(e.key);
      }
    });
  }
  
  private autoFillAndStart(): void {
    const modules = this.gameManager.availableModules;
    
    const wing2 = modules.find(m => m.id === 'wing2');
    const wing1 = modules.find(m => m.id === 'wing1');
    const engine2 = modules.find(m => m.id === 'engine2');
    const prop2 = modules.find(m => m.id === 'prop2');
    
    if (wing2) this.gameManager.placeModule('leftWing', wing2);
    if (wing1) this.gameManager.placeModule('rightWing', wing1);
    if (engine2) this.gameManager.placeModule('engine', engine2);
    if (prop2) this.gameManager.placeModule('propeller', prop2);
    
    this.assemblyScene.resize();
    
    if (this.gameManager.isAllSlotsFilled()) {
      this.gameManager.startRace();
    }
  }
  
  private startGameLoop(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= this.frameTime) {
      this.lastTime = currentTime - (deltaTime % this.frameTime);
      
      const dt = Math.min(deltaTime / 1000, 0.1);
      
      this.update(dt);
      this.render();
    }
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  private update(dt: number): void {
    switch (this.gameManager.currentPhase) {
      case 'assembly':
        this.assemblyScene.update(dt);
        break;
      case 'transition':
        this.updateTransition(dt);
        break;
      case 'race':
      case 'result':
        this.raceScene.update(dt);
        break;
    }
  }
  
  private updateTransition(dt: number): void {
    this.gameManager.transitionProgress += dt / 1.0;
    
    if (this.gameManager.transitionProgress >= 1) {
      this.gameManager.completeTransition();
      
      if (this.gameManager.transitionDirection === 'toRace') {
        this.raceScene.resetRace();
      }
    }
  }
  
  private render(): void {
    const ctx = this.ctx;
    
    switch (this.gameManager.currentPhase) {
      case 'assembly':
        this.assemblyScene.render();
        break;
      case 'transition':
        this.renderTransition();
        break;
      case 'race':
      case 'result':
        this.raceScene.render();
        break;
    }
  }
  
  private renderTransition(): void {
    const ctx = this.ctx;
    const progress = this.gameManager.transitionProgress;
    
    if (this.gameManager.transitionDirection === 'toRace') {
      if (progress < 0.5) {
        this.assemblyScene.render();
      } else {
        this.raceScene.render();
      }
    } else {
      if (progress < 0.5) {
        this.raceScene.render();
      } else {
        this.assemblyScene.render();
      }
    }
    
    this.drawFilmTransition(progress);
  }
  
  private drawFilmTransition(progress: number): void {
    const ctx = this.ctx;
    
    const pageProgress = progress;
    
    const foldProgress = Math.min(progress * 2, 1);
    
    ctx.save();
    
    if (progress < 0.5) {
      const foldAngle = foldProgress * Math.PI * 0.3;
      const foldY = this.canvas.height * foldProgress;
      
      ctx.fillStyle = '#2A2015';
      ctx.fillRect(0, foldY - 2, this.canvas.width, this.canvas.height - foldY + 2);
      
      const gradient = ctx.createLinearGradient(0, foldY - 30, 0, foldY);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0.5)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, foldY - 30, this.canvas.width, 30);
    } else {
      const unfoldProgress = (progress - 0.5) * 2;
      const foldY = this.canvas.height * (1 - unfoldProgress);
      
      ctx.fillStyle = '#2A2015';
      ctx.fillRect(0, 0, this.canvas.width, foldY + 2);
      
      const gradient = ctx.createLinearGradient(0, foldY, 0, foldY + 30);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.5)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, foldY, this.canvas.width, 30);
    }
    
    this.drawScratches(progress);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.restore();
  }
  
  private drawScratches(progress: number): void {
    const ctx = this.ctx;
    const intensity = Math.sin(progress * Math.PI) * 0.5;
    
    if (intensity < 0.1) return;
    
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
    ctx.lineWidth = 1;
    
    const scratchCount = Math.floor(intensity * 15);
    const seed = Math.floor(progress * 1000);
    
    for (let i = 0; i < scratchCount; i++) {
      const pseudoRand = this.pseudoRandom(seed + i);
      const x = pseudoRand * this.canvas.width;
      const length = 20 + this.pseudoRandom(seed + i + 100) * 100;
      const angle = (this.pseudoRandom(seed + i + 200) - 0.5) * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.sin(angle) * length, length);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}

window.addEventListener('load', () => {
  new Game();
});
