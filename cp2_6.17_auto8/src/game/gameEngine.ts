import {
  Gem,
  Particle,
  createGem,
  createParticles,
  updateGemAnimation,
  updateParticle,
  handleGemPickup,
  handleGemDrag,
  handleGemRelease,
  startBounceAnimation,
  easeOutElastic,
  easeOutQuad,
  lerp,
  createDragState,
  DragState,
  GEM_COLORS
} from './gemGen';
import { Renderer, LayoutConfig } from './renderer';

type GameState = 'playing' | 'gameover' | 'animating' | 'resetting';

interface MatchResult {
  gems: Gem[];
  startCol: number;
  startRow: number;
}

interface FallingGem {
  gem: Gem;
  startY: number;
  endY: number;
  progress: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer!: Renderer;
  private layout!: LayoutConfig;
  
  private state: GameState = 'playing';
  private grid: (Gem | null)[][] = [];
  private conveyorGems: Gem[] = [];
  private bufferGem: Gem | null = null;
  private particles: Particle[] = [];
  private fallingGems: FallingGem[] = [];
  
  private score: number = 0;
  private chainCount: number = 0;
  private maxChain: number = 0;
  private chainPulseProgress: number = 0;
  private mineGlowProgress: number = 0;
  private targetMineGlow: number = 0;
  
  private resetProgress: number = 0;
  private gameOverProgress: number = 0;
  
  private dragState: DragState = createDragState();
  
  private lastTime: number = 0;
  private lastSpawnTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  
  private matchQueue: MatchResult[] = [];
  private chainWaitTime: number = 0;
  private isProcessingChain: boolean = false;
  
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  
  private onGameOverCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  
  private pendingPlacement: { gem: Gem; col: number; row: number } | null = null;
  private placementAnimationProgress: number = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    
    this.canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    this.canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    this.layout = this.calculateLayout();
    this.renderer = new Renderer(this.ctx, this.layout.width, this.layout.height);
    this.initGrid();
    this.setupEventListeners();
  }
  
  private initGrid(): void {
    this.grid = [];
    for (let row = 0; row < 6; row++) {
      this.grid[row] = [];
      for (let col = 0; col < 6; col++) {
        this.grid[row][col] = null;
      }
    }
  }
  
  resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    
    this.layout = this.calculateLayout();
    
    if (this.renderer) {
      this.renderer.resize(this.layout.width, this.layout.height);
    }
  }
  
  private calculateLayout(): LayoutConfig {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const isMobile = width < 768;
    const maxGridWidth = isMobile ? width * 0.9 : 480;
    const gridSize = Math.min(maxGridWidth, height * 0.6);
    const cellSize = gridSize / 6;
    const gemSize = cellSize * 0.85;
    
    const gridOffsetX = (width - gridSize) / 2;
    const gridOffsetY = height * 0.35;
    
    const conveyorY = height * 0.15;
    const conveyorWidth = gridSize * 0.8;
    const conveyorX = (width - conveyorWidth) / 2;
    
    const bufferX = conveyorX + conveyorWidth + 30;
    const bufferY = conveyorY;
    
    return {
      width,
      height,
      gridSize,
      cellSize,
      gemSize,
      gridOffsetX,
      gridOffsetY,
      conveyorY,
      conveyorWidth,
      conveyorX,
      bufferX,
      bufferY
    };
  }
  
  private setupEventListeners(): void {
    const handleMouseDown = (e: MouseEvent) => {
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handlePointerDown(x, y);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handlePointerMove(x, y);
    };
    
    const handleMouseUp = () => {
      this.handlePointerUp();
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (this.state !== 'playing') return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.handlePointerDown(x, y);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.handlePointerMove(x, y);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      this.handlePointerUp();
    };
    
    const handleResize = () => {
      this.resize();
    };
    
    this.canvas.addEventListener('mousedown', handleMouseDown);
    this.canvas.addEventListener('mousemove', handleMouseMove);
    this.canvas.addEventListener('mouseup', handleMouseUp);
    this.canvas.addEventListener('mouseleave', handleMouseUp);
    
    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    window.addEventListener('resize', handleResize);
  }
  
  private handlePointerDown(x: number, y: number): void {
    if (this.state !== 'playing') return;
    
    for (let i = this.conveyorGems.length - 1; i >= 0; i--) {
      const gem = this.conveyorGems[i];
      if (handleGemPickup(gem, this.dragState, x, y, this.layout.gemSize)) {
        this.conveyorGems.splice(i, 1);
        return;
      }
    }
    
    if (this.bufferGem) {
      if (handleGemPickup(this.bufferGem, this.dragState, x, y, this.layout.gemSize)) {
        this.bufferGem = null;
        return;
      }
    }
  }
  
  private handlePointerMove(x: number, y: number): void {
    handleGemDrag(this.dragState, x, y);
  }
  
  private handlePointerUp(): void {
    if (this.state !== 'playing') return;
    
    const result = handleGemRelease(
      this.dragState,
      6, 6,
      this.layout.cellSize,
      this.layout.gridOffsetX,
      this.layout.gridOffsetY
    );
    
    const releasedGem = this.dragState.draggedGem;
    
    if (result.success && releasedGem) {
      const { gridCol, gridRow } = result;
      
      if (this.grid[gridRow][gridCol] === null) {
        this.pendingPlacement = { gem: releasedGem, col: gridCol, row: gridRow };
        this.placementAnimationProgress = 0;
        releasedGem.scale = 0.8;
        releasedGem.targetScale = 1;
        releasedGem.x = this.layout.gridOffsetX + gridCol * this.layout.cellSize + this.layout.cellSize / 2;
        releasedGem.y = this.layout.gridOffsetY + gridRow * this.layout.cellSize + this.layout.cellSize / 2;
        releasedGem.targetX = releasedGem.x;
        releasedGem.targetY = releasedGem.y;
        releasedGem.gridX = gridCol;
        releasedGem.gridY = gridRow;
      } else {
        this.returnGemToBuffer(releasedGem);
        startBounceAnimation(releasedGem, releasedGem.x, releasedGem.y);
      }
    } else if (releasedGem) {
      this.returnGemToBuffer(releasedGem);
    }
  }
  
  private returnGemToBuffer(gem: Gem): void {
    if (!this.bufferGem) {
      this.bufferGem = gem;
      gem.targetX = this.layout.bufferX;
      gem.targetY = this.layout.bufferY;
    } else {
      gem.targetX = this.layout.conveyorX + this.layout.conveyorWidth / 2;
      gem.targetY = this.layout.conveyorY;
      this.conveyorGems.push(gem);
    }
  }
  
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1 / 30);
    this.lastTime = currentTime;
    
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
    
    this.update(deltaTime);
    this.render();
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
  
  private update(dt: number): void {
    if (this.state === 'resetting') {
      this.updateResetAnimation(dt);
      return;
    }
    
    if (this.state === 'gameover') {
      this.updateGameOverAnimation(dt);
      return;
    }
    
    this.updateConveyor(dt);
    this.updatePendingPlacement(dt);
    this.updateGems(dt);
    this.updateParticles(dt);
    this.updateFallingGems(dt);
    this.updateChainReaction(dt);
    this.updateMineGlow(dt);
    this.updateChainPulse(dt);
    
    if (this.chainCount === 0 && !this.isProcessingChain && this.matchQueue.length === 0 && this.fallingGems.length === 0) {
      this.checkGameOver();
    }
  }
  
  private updateConveyor(dt: number): void {
    this.lastSpawnTime += dt;
    
    if (this.lastSpawnTime >= 1.5 && this.conveyorGems.length < 3) {
      this.lastSpawnTime = 0;
      const gem = createGem(
        this.layout.conveyorX - this.layout.gemSize,
        this.layout.conveyorY
      );
      gem.targetX = this.layout.conveyorX + this.layout.conveyorWidth / 2;
      this.conveyorGems.push(gem);
    }
    
    for (const gem of this.conveyorGems) {
      if (gem.x < this.layout.conveyorX + this.layout.conveyorWidth * 0.4) {
        gem.x += dt * 100;
      }
    }
    
    if (this.conveyorGems.length > 0) {
      const firstGem = this.conveyorGems[0];
      if (!firstGem.isDragging && firstGem.x >= this.layout.conveyorX + this.layout.conveyorWidth * 0.4) {
        if (!this.bufferGem) {
          this.bufferGem = firstGem;
          firstGem.targetX = this.layout.bufferX;
          firstGem.targetY = this.layout.bufferY;
          this.conveyorGems.shift();
        }
      }
    }
  }
  
  private updatePendingPlacement(dt: number): void {
    if (!this.pendingPlacement) return;
    
    this.placementAnimationProgress += dt / 0.3;
    
    const t = Math.min(this.placementAnimationProgress, 1);
    const elasticT = easeOutElastic(t);
    const scale = lerp(0.8, 1, elasticT);
    
    this.pendingPlacement.gem.scale = scale;
    
    if (this.placementAnimationProgress >= 1) {
      const { gem, col, row } = this.pendingPlacement;
      this.grid[row][col] = gem;
      gem.scale = 1;
      gem.targetScale = 1;
      this.pendingPlacement = null;
      
      this.chainCount = 0;
      this.checkForMatches();
      
      if (this.matchQueue.length === 0) {
        this.chainCount = 0;
        this.targetMineGlow = 0;
      }
    }
  }
  
  private updateGems(dt: number): void {
    for (const gem of this.conveyorGems) {
      updateGemAnimation(gem, dt);
    }
    
    if (this.bufferGem) {
      updateGemAnimation(this.bufferGem, dt);
    }
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const gem = this.grid[row][col];
        if (gem) {
          updateGemAnimation(gem, dt);
        }
      }
    }
    
    if (this.dragState.draggedGem) {
      updateGemAnimation(this.dragState.draggedGem, dt);
    }
  }
  
  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      updateParticle(this.particles[i], dt);
      if (this.particles[i].opacity <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  private updateFallingGems(dt: number): void {
    for (let i = this.fallingGems.length - 1; i >= 0; i--) {
      const falling = this.fallingGems[i];
      falling.progress += dt / 0.3;
      
      const t = Math.min(falling.progress, 1);
      const easedT = easeOutQuad(t);
      falling.gem.y = lerp(falling.startY, falling.endY, easedT);
      falling.gem.targetY = falling.gem.y;
      
      if (falling.progress >= 1) {
        falling.gem.y = falling.endY;
        falling.gem.targetY = falling.endY;
        falling.gem.falling = false;
        this.fallingGems.splice(i, 1);
      }
    }
    
    if (this.fallingGems.length === 0 && this.isProcessingChain) {
      this.chainWaitTime += dt;
      if (this.chainWaitTime >= 0.2) {
        this.chainWaitTime = 0;
        this.checkForMatches();
        
        if (this.matchQueue.length === 0) {
          this.isProcessingChain = false;
          this.chainCount = 0;
          this.targetMineGlow = 0;
        }
      }
    }
  }
  
  private updateChainReaction(_dt: number): void {
    if (this.matchQueue.length > 0 && this.fallingGems.length === 0) {
      const match = this.matchQueue[0];
      
      let allFlashing = true;
      for (const gem of match.gems) {
        if (!gem.isFlashing) {
          gem.isFlashing = true;
          allFlashing = false;
        }
        if (gem.flashPhase < 3) {
          allFlashing = false;
        }
      }
      
      if (allFlashing) {
        this.processMatchRemoval(match);
        this.matchQueue.shift();
      }
    }
  }
  
  private processMatchRemoval(match: MatchResult): void {
    for (const gem of match.gems) {
      gem.isFading = true;
      gem.animationProgress = 0;
      
      const newParticles = createParticles(gem.x, gem.y, GEM_COLORS[gem.color], 8);
      this.particles.push(...newParticles);
    }
    
    const baseScore = match.gems.length * 10;
    const chainBonus = this.chainCount * 50;
    this.score += baseScore + chainBonus;
    
    setTimeout(() => {
      for (const gem of match.gems) {
        if (gem.gridX !== undefined && gem.gridY !== undefined) {
          this.grid[gem.gridY][gem.gridX] = null;
        }
      }
      
      this.applyGravity();
    }, 400);
  }
  
  private checkForMatches(): void {
    this.matchQueue = [];
    const visited = new Set<string>();
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const key = `${col},${row}`;
        if (visited.has(key) || !this.grid[row][col]) continue;
        
        const connected = this.findConnectedGems(col, row);
        if (connected.length >= 4) {
          for (const gem of connected) {
            if (gem.gridX !== undefined && gem.gridY !== undefined) {
              visited.add(`${gem.gridX},${gem.gridY}`);
            }
          }
          
          this.matchQueue.push({
            gems: connected,
            startCol: col,
            startRow: row
          });
          
          this.chainCount++;
          this.maxChain = Math.max(this.maxChain, this.chainCount);
          this.chainPulseProgress = 0;
          
          if (this.chainCount >= 5) {
            this.targetMineGlow = 1;
          }
        }
      }
    }
    
    if (this.matchQueue.length > 0) {
      this.isProcessingChain = true;
    }
  }
  
  private findConnectedGems(startX: number, startY: number): Gem[] {
    if (!this.grid[startY][startX]) return [];
    
    const targetColor = this.grid[startY][startX]!.color;
    const visited = new Set<string>();
    const connected: Gem[] = [];
    const stack: [number, number][] = [[startX, startY]];
    
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= 6 || y < 0 || y >= 6) continue;
      if (!this.grid[y][x] || this.grid[y][x]!.color !== targetColor) continue;
      
      visited.add(key);
      connected.push(this.grid[y][x]!);
      
      for (const [dx, dy] of directions) {
        stack.push([x + dx, y + dy]);
      }
    }
    
    return connected;
  }
  
  private applyGravity(): void {
    this.fallingGems = [];
    
    for (let col = 0; col < 6; col++) {
      let writePos = 5;
      
      for (let row = 5; row >= 0; row--) {
        const currentGem = this.grid[row][col];
        if (currentGem) {
          if (writePos !== row) {
            this.grid[writePos][col] = currentGem;
            this.grid[row][col] = null;
            
            const startY = currentGem.y;
            const endY = this.layout.gridOffsetY + writePos * this.layout.cellSize + this.layout.cellSize / 2;
            
            currentGem.gridY = writePos;
            currentGem.falling = true;
            currentGem.y = startY;
            currentGem.targetY = endY;
            
            this.fallingGems.push({
              gem: currentGem,
              startY,
              endY,
              progress: 0
            });
          }
          writePos--;
        }
      }
    }
  }
  
  private updateMineGlow(dt: number): void {
    const lerpFactor = 1 - Math.exp(-dt * 0.5);
    this.mineGlowProgress += (this.targetMineGlow - this.mineGlowProgress) * lerpFactor;
  }
  
  private updateChainPulse(dt: number): void {
    if (this.chainCount > 0 && this.chainPulseProgress < 1) {
      this.chainPulseProgress += dt * 10;
      this.chainPulseProgress = Math.min(this.chainPulseProgress, 1);
    }
  }
  
  private updateResetAnimation(dt: number): void {
    this.resetProgress += dt / 0.8;
    
    if (this.resetProgress >= 0.5 && this.resetProgress - dt / 0.8 < 0.5) {
      this.initGrid();
      this.conveyorGems = [];
      this.bufferGem = null;
      this.particles = [];
      this.score = 0;
      this.chainCount = 0;
      this.maxChain = 0;
      this.mineGlowProgress = 0;
      this.targetMineGlow = 0;
      this.matchQueue = [];
      this.fallingGems = [];
      this.lastSpawnTime = 1.5;
    }
    
    if (this.resetProgress >= 1) {
      this.resetProgress = 0;
      this.state = 'playing';
      if (this.onRestartCallback) {
        this.onRestartCallback();
      }
    }
  }
  
  private updateGameOverAnimation(dt: number): void {
    if (this.gameOverProgress < 1) {
      this.gameOverProgress += dt * 1.5;
      this.gameOverProgress = Math.min(this.gameOverProgress, 1);
    }
  }
  
  private checkGameOver(): void {
    let hasEmpty = false;
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        if (this.grid[row][col] === null) {
          hasEmpty = true;
          break;
        }
      }
      if (hasEmpty) break;
    }
    
    if (!hasEmpty) {
      let hasMatch = false;
      const visited = new Set<string>();
      
      for (let row = 0; row < 6 && !hasMatch; row++) {
        for (let col = 0; col < 6 && !hasMatch; col++) {
          const key = `${col},${row}`;
          if (visited.has(key) || !this.grid[row][col]) continue;
          
          const connected = this.findConnectedGems(col, row);
          if (connected.length >= 4) {
            hasMatch = true;
          } else {
            for (const gem of connected) {
              if (gem.gridX !== undefined && gem.gridY !== undefined) {
                visited.add(`${gem.gridX},${gem.gridY}`);
              }
            }
          }
        }
      }
      
      if (!hasMatch) {
        this.state = 'gameover';
        this.gameOverProgress = 0;
        if (this.onGameOverCallback) {
          this.onGameOverCallback();
        }
      }
    }
  }
  
  restart(): void {
    if (this.state === 'playing') return;
    this.state = 'resetting';
    this.resetProgress = 0;
    this.gameOverProgress = 0;
  }
  
  private render(): void {
    const renderState = {
      grid: this.grid,
      conveyorGems: this.conveyorGems,
      bufferGem: this.bufferGem,
      particles: this.particles,
      score: this.score,
      chainCount: this.chainCount,
      chainPulseProgress: this.chainPulseProgress,
      mineGlowProgress: this.mineGlowProgress,
      state: this.state,
      resetProgress: this.resetProgress,
      gameOverProgress: this.gameOverProgress,
      dragState: this.dragState
    };
    
    this.renderer.render(renderState);
    
    if (this.dragState.draggedGem) {
      const layout = this.renderer.getLayout();
      const col = Math.floor((this.dragState.mouseX - layout.gridOffsetX) / layout.cellSize);
      const row = Math.floor((this.dragState.mouseY - layout.gridOffsetY) / layout.cellSize);
      
      if (col >= 0 && col < 6 && row >= 0 && row < 6) {
        if (!this.grid[row][col]) {
          this.ctx.save();
          this.ctx.strokeStyle = 'rgba(184, 134, 11, 0.5)';
          this.ctx.lineWidth = 3;
          this.ctx.setLineDash([5, 5]);
          this.ctx.strokeRect(
            layout.gridOffsetX + col * layout.cellSize + 2,
            layout.gridOffsetY + row * layout.cellSize + 2,
            layout.cellSize - 4,
            layout.cellSize - 4
          );
          this.ctx.restore();
        }
      }
    }
  }
  
  getScore(): number {
    return this.score;
  }
  
  getChainCount(): number {
    return this.chainCount;
  }
  
  getState(): GameState {
    return this.state;
  }
  
  getFPS(): number {
    return this.fps;
  }
  
  setOnGameOverCallback(callback: () => void): void {
    this.onGameOverCallback = callback;
  }
  
  setOnRestartCallback(callback: () => void): void {
    this.onRestartCallback = callback;
  }
  
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
