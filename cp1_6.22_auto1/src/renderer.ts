import { Hero, Team, Position } from './hero';
import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_SIZE,
  CARD_WIDTH,
  CARD_HEIGHT,
  HeroConfig,
  HERO_CONFIGS,
  RACE_COLORS,
  CLASS_COLORS,
  CLASS_ICONS
} from './config';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'fire' | 'spark' | 'heal' | 'lightning';
}

export interface DragState {
  isDragging: boolean;
  heroConfig: HeroConfig | null;
  mouseX: number;
  mouseY: number;
  startX: number;
  startY: number;
  validPlacement: boolean;
  targetCell: Position | null;
}

export interface CameraState {
  scale: number;
  targetScale: number;
  offsetX: number;
  offsetY: number;
  targetOffsetX: number;
  targetOffsetY: number;
}

export interface UIState {
  selectedHeroIndex: number;
  showResult: boolean;
  resultAnimationProgress: number;
  winner: Team | null;
  survivorStats: { player: number; enemy: number };
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  offscreenCanvas: HTMLCanvasElement;
  offscreenCtx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  boardX: number = 0;
  boardY: number = 0;
  boardWidth: number = 0;
  boardHeight: number = 0;
  sidebarY: number = 0;
  sidebarHeight: number = 0;
  particlePool: Particle[] = [];
  activeParticles: Particle[] = [];
  animationFrame: number = 0;
  borderGlowPhase: number = 0;

  dragState: DragState = {
    isDragging: false,
    heroConfig: null,
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
    validPlacement: false,
    targetCell: null
  };

  camera: CameraState = {
    scale: 1,
    targetScale: 1,
    offsetX: 0,
    offsetY: 0,
    targetOffsetX: 0,
    targetOffsetY: 0
  };

  uiState: UIState = {
    selectedHeroIndex: 0,
    showResult: false,
    resultAnimationProgress: 0,
    winner: null,
    survivorStats: { player: 0, enemy: 0 }
  };

  hoveredCell: Position | null = null;
  onHeroPlaced: ((config: HeroConfig, pos: Position) => void) | null = null;
  onStartBattle: (() => void) | null = null;
  onReset: (() => void) | null = null;
  onHeroClicked: ((hero: Hero) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    this.resize();
    this.initParticlePool();
    this.setupEventListeners();
  }

  resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;

    this.sidebarHeight = CARD_HEIGHT + 40;
    this.sidebarY = this.height - this.sidebarHeight;

    const maxBoardWidth = this.width - 80;
    const maxBoardHeight = this.sidebarY - 120;
    const cellWidth = maxBoardWidth / BOARD_COLS;
    const cellHeight = maxBoardHeight / BOARD_ROWS;
    const actualCellSize = Math.min(cellWidth, cellHeight, CELL_SIZE * 1.5);

    this.boardWidth = actualCellSize * BOARD_COLS;
    this.boardHeight = actualCellSize * BOARD_ROWS;
    this.boardX = (this.width - this.boardWidth) / 2;
    this.boardY = 60 + (maxBoardHeight - this.boardHeight) / 2;
  }

  initParticlePool(): void {
    for (let i = 0; i < 200; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
        color: '#fff', size: 2, type: 'spark'
      });
    }
  }

  spawnParticle(x: number, y: number, type: Particle['type'], count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.find(p => p.life <= 0);
      if (!particle) continue;

      particle.x = x;
      particle.y = y;
      particle.type = type;

      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'fire' ? 1 + Math.random() * 2 : 2 + Math.random() * 3;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - (type === 'fire' ? 2 : 0);
      particle.life = 1;
      particle.maxLife = type === 'fire' ? 600 : 400;
      particle.size = type === 'fire' ? 4 + Math.random() * 4 : 2 + Math.random() * 2;

      switch (type) {
        case 'fire':
          particle.color = `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`;
          break;
        case 'spark':
          particle.color = `hsl(${50 + Math.random() * 20}, 100%, 70%)`;
          break;
        case 'heal':
          particle.color = `hsl(${120 + Math.random() * 30}, 100%, 60%)`;
          break;
        case 'lightning':
          particle.color = `hsl(${200 + Math.random() * 40}, 100%, 70%)`;
          break;
      }

      this.activeParticles.push(particle);
    }
  }

  updateParticles(deltaTime: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'fire') {
        p.vy -= 0.1;
        p.size *= 0.98;
      }
    }
  }

  setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp(new MouseEvent('mouseup')));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseDown(new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY }));
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseMove(new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY }));
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onMouseUp(new MouseEvent('mouseup'));
    });

    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  getCellAt(x: number, y: number): Position | null {
    const cellSize = this.boardWidth / BOARD_COLS;
    const relX = x - this.boardX;
    const relY = y - this.boardY;

    if (relX < 0 || relX >= this.boardWidth || relY < 0 || relY >= this.boardHeight) {
      return null;
    }

    const col = Math.floor(relX / cellSize);
    const row = Math.floor(relY / cellSize);
    return { row, col };
  }

  getCardAt(x: number, y: number): number | null {
    if (y < this.sidebarY || y > this.height) return null;

    const cardSpacing = 20;
    const totalCardWidth = CARD_WIDTH + cardSpacing;
    const startX = (this.width - HERO_CONFIGS.length * totalCardWidth + cardSpacing) / 2;

    for (let i = 0; i < HERO_CONFIGS.length; i++) {
      const cardX = startX + i * totalCardWidth;
      const cardY = this.sidebarY + 20;
      if (x >= cardX && x <= cardX + CARD_WIDTH && y >= cardY && y <= cardY + CARD_HEIGHT) {
        return i;
      }
    }
    return null;
  }

  getButtonAt(x: number, y: number): 'start' | 'reset' | null {
    const btnY = this.boardY - 50;
    const btnWidth = 140;
    const btnHeight = 40;
    const spacing = 20;

    const startX = this.width / 2 - btnWidth - spacing / 2;
    const resetX = this.width / 2 + spacing / 2;

    if (y >= btnY && y <= btnY + btnHeight) {
      if (x >= startX && x <= startX + btnWidth) return 'start';
      if (x >= resetX && x <= resetX + btnWidth) return 'reset';
    }
    return null;
  }

  onMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const cardIndex = this.getCardAt(pos.x, pos.y);

    if (cardIndex !== null) {
      this.dragState.isDragging = true;
      this.dragState.heroConfig = HERO_CONFIGS[cardIndex];
      this.dragState.startX = pos.x;
      this.dragState.startY = pos.y;
      this.dragState.mouseX = pos.x;
      this.dragState.mouseY = pos.y;
      this.uiState.selectedHeroIndex = cardIndex;
    }
  }

  onMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    this.dragState.mouseX = pos.x;
    this.dragState.mouseY = pos.y;

    this.hoveredCell = this.getCellAt(pos.x, pos.y);

    if (this.dragState.isDragging) {
      const cell = this.getCellAt(pos.x, pos.y);
      this.dragState.targetCell = cell;
      this.dragState.validPlacement = cell !== null && cell.col >= BOARD_COLS / 2;
    }
  }

  onMouseUp(_e: MouseEvent): void {
    if (this.dragState.isDragging && this.dragState.validPlacement && this.dragState.targetCell && this.dragState.heroConfig) {
      if (this.onHeroPlaced) {
        this.onHeroPlaced(this.dragState.heroConfig, this.dragState.targetCell);
      }
      this.spawnParticle(
        this.boardX + (this.dragState.targetCell.col + 0.5) * (this.boardWidth / BOARD_COLS),
        this.boardY + (this.dragState.targetCell.row + 0.5) * (this.boardHeight / BOARD_ROWS),
        'spark',
        15
      );
    }

    this.dragState.isDragging = false;
    this.dragState.heroConfig = null;
    this.dragState.validPlacement = false;
    this.dragState.targetCell = null;
  }

  onClick(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const button = this.getButtonAt(pos.x, pos.y);

    if (button === 'start' && this.onStartBattle) {
      this.onStartBattle();
    } else if (button === 'reset' && this.onReset) {
      this.onReset();
    }
  }

  updateCamera(_deltaTime: number): void {
    const lerp = 0.1;
    this.camera.scale += (this.camera.targetScale - this.camera.scale) * lerp;
    this.camera.offsetX += (this.camera.targetOffsetX - this.camera.offsetX) * lerp;
    this.camera.offsetY += (this.camera.targetOffsetY - this.camera.offsetY) * lerp;
  }

  zoomToHero(hero: Hero): void {
    const cellSize = this.boardWidth / BOARD_COLS;
    const heroX = this.boardX + (hero.position.col + 0.5) * cellSize;
    const heroY = this.boardY + (hero.position.row + 0.5) * cellSize;

    this.camera.targetScale = 1.3;
    this.camera.targetOffsetX = this.width / 2 - heroX * 1.3;
    this.camera.targetOffsetY = this.height / 2 - heroY * 1.3;
  }

  resetCamera(): void {
    this.camera.targetScale = 1;
    this.camera.targetOffsetX = 0;
    this.camera.targetOffsetY = 0;
  }

  showResultAnimation(winner: Team, playerCount: number, enemyCount: number): void {
    this.uiState.showResult = true;
    this.uiState.resultAnimationProgress = 0;
    this.uiState.winner = winner;
    this.uiState.survivorStats = { player: playerCount, enemy: enemyCount };
  }

  update(deltaTime: number, _currentTime: number): void {
    this.updateParticles(deltaTime);
    this.updateCamera(deltaTime);
    this.borderGlowPhase += deltaTime * 0.003;

    if (this.uiState.showResult && this.uiState.resultAnimationProgress < 1) {
      this.uiState.resultAnimationProgress += deltaTime / 1500;
      if (this.uiState.resultAnimationProgress > 1) {
        this.uiState.resultAnimationProgress = 1;
      }
    }
  }

  render(heroes: Hero[], currentTime: number, phase: string): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawBackgroundGrid();

    ctx.save();
    ctx.translate(this.camera.offsetX, this.camera.offsetY);
    ctx.scale(this.camera.scale, this.camera.scale);

    this.drawBoard(currentTime, phase);
    this.drawHeroes(heroes, currentTime);
    this.drawParticles();

    ctx.restore();

    this.drawSidebar(currentTime);
    this.drawButtons(phase);
    this.drawDragPreview();

    if (this.uiState.showResult) {
      this.drawResultAnimation();
    }

    this.drawFPS();
  }

  drawBackgroundGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.03)';
    ctx.lineWidth = 1;

    const gridSize = 30;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  drawBoard(_currentTime: number, phase: string): void {
    const ctx = this.ctx;
    const cellSize = this.boardWidth / BOARD_COLS;

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const x = this.boardX + col * cellSize;
        const y = this.boardY + row * cellSize;

        const isPlayerSide = col >= BOARD_COLS / 2;
        const baseColor = isPlayerSide ? 'rgba(74, 158, 255, 0.1)' : 'rgba(220, 20, 60, 0.1)';

        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, cellSize, cellSize);

        const glowIntensity = (Math.sin(this.borderGlowPhase + row * 0.5 + col * 0.3) + 1) / 2;
        const borderAlpha = 0.3 + glowIntensity * 0.3;
        const isHovered = this.hoveredCell?.row === row && this.hoveredCell?.col === col;
        const isTarget = this.dragState.targetCell?.row === row && this.dragState.targetCell?.col === col;

        if (isTarget && this.dragState.isDragging) {
          ctx.strokeStyle = this.dragState.validPlacement ? '#50c878' : '#dc143c';
          ctx.lineWidth = 3;
          ctx.shadowColor = this.dragState.validPlacement ? '#50c878' : '#dc143c';
          ctx.shadowBlur = 15;
        } else if (isHovered && phase === 'preparing') {
          ctx.strokeStyle = `rgba(255, 215, 0, ${borderAlpha + 0.3})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = `rgba(255, 215, 0, ${borderAlpha})`;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        }

        ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        ctx.shadowBlur = 0;
      }
    }

    const midX = this.boardX + this.boardWidth / 2;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(midX, this.boardY);
    ctx.lineTo(midX, this.boardY + this.boardHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawHeroes(heroes: Hero[], currentTime: number): void {
    const ctx = this.ctx;
    const cellSize = this.boardWidth / BOARD_COLS;

    for (const hero of heroes) {
      if (!hero.isAlive && hero.effects.length === 0 && !hero.isPlacing) continue;

      const x = this.boardX + (hero.position.col + 0.5) * cellSize;
      const y = this.boardY + (hero.position.row + 0.5) * cellSize;

      ctx.save();

      let scale = 1;
      let alpha = 1;

      if (hero.isPlacing) {
        const bounce = Math.sin(hero.placeAnimationProgress * Math.PI) * 0.3;
        scale = 0.7 + hero.placeAnimationProgress * 0.3 + bounce * 0.2;
        alpha = hero.placeAnimationProgress;
      }

      if (!hero.isAlive) {
        alpha = 0.3;
        scale = 0.8;
      }

      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      if (hero.hasFireEffect(currentTime)) {
        for (let i = 0; i < 3; i++) {
          const angle = (currentTime * 0.005 + i * Math.PI * 2 / 3) % (Math.PI * 2);
          const radius = cellSize * 0.4;
          const fx = Math.cos(angle) * radius;
          const fy = Math.sin(angle) * radius;
          this.spawnParticle(x + fx, y + fy, 'fire', 1);
        }
      }

      if (hero.hasLightningEffect(currentTime)) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          let lx = -cellSize * 0.4;
          let ly = -cellSize * 0.3 + i * cellSize * 0.3;
          ctx.moveTo(lx, ly);
          while (lx < cellSize * 0.4) {
            lx += cellSize * 0.1;
            ly += (Math.random() - 0.5) * cellSize * 0.2;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      if (hero.hasHealEffect(currentTime)) {
        ctx.strokeStyle = '#50c878';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#50c878';
        ctx.shadowBlur = 15;
        const healPhase = (currentTime % 500) / 500;
        ctx.beginPath();
        ctx.arc(0, 0, cellSize * (0.3 + healPhase * 0.2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        this.spawnParticle(x, y - cellSize * 0.3, 'heal', 2);
      }

      if (hero.hasShieldEffect(currentTime)) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, cellSize * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const heroSize = cellSize * 0.7;
      this.drawPixelHero(ctx, -heroSize / 2, -heroSize / 2, heroSize, hero);

      if (hero.isHitFlashing(currentTime)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-heroSize / 2, -heroSize / 2, heroSize, heroSize);
      }

      ctx.restore();

      if (hero.isAlive) {
        this.drawHpBar(x, y - cellSize * 0.55, cellSize * 0.8, hero.currentHp / hero.maxHp, hero.team);
      }
    }
  }

  drawPixelHero(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, hero: Hero): void {
    const pixelSize = size / 8;
    const color = hero.config.pixelColor;
    const teamColor = hero.team === 'player' ? '#4a9eff' : '#dc143c';

    ctx.fillStyle = color;

    for (let py = 0; py < 8; py++) {
      for (let px = 0; px < 8; px++) {
        const fill = this.getHeroPixel(px, py, hero.config.class);
        if (fill) {
          ctx.fillStyle = fill === 'main' ? color : fill === 'team' ? teamColor : this.getPixelShade(color, fill);
          ctx.fillRect(x + px * pixelSize, y + py * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
        }
      }
    }

    ctx.strokeStyle = hero.team === 'player' ? '#4a9eff' : '#dc143c';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
  }

  getHeroPixel(px: number, py: number, heroClass: string): string | null {
    const patterns: Record<string, number[][]> = {
      warrior: [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0]
      ],
      mage: [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 2, 0, 1, 1, 0, 2, 1],
        [0, 0, 1, 0, 0, 1, 0, 0]
      ],
      archer: [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 3],
        [0, 1, 1, 1, 1, 3, 3, 0],
        [3, 1, 0, 1, 1, 0, 3, 0],
        [0, 3, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0]
      ],
      healer: [
        [0, 0, 1, 3, 3, 1, 0, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [3, 3, 1, 2, 2, 1, 3, 3],
        [3, 3, 1, 1, 1, 1, 3, 3],
        [0, 3, 1, 0, 0, 1, 3, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0]
      ]
    };

    const pattern = patterns[heroClass] || patterns.warrior;
    const value = pattern[py][px];
    if (value === 0) return null;
    if (value === 1) return 'main';
    if (value === 2) return 'light';
    if (value === 3) return 'team';
    return 'main';
  }

  getPixelShade(baseColor: string, shade: string): string {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    if (shade === 'light') {
      return `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
    }
    if (shade === 'dark') {
      return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
    }
    return baseColor;
  }

  drawHpBar(x: number, y: number, width: number, ratio: number, team: Team): void {
    const ctx = this.ctx;
    const height = 6;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x - width / 2, y, width, height);

    const color = team === 'player' ? '#50c878' : '#dc143c';
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2 + 1, y + 1, (width - 2) * ratio, height - 2);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y, width, height);
  }

  drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.activeParticles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  drawSidebar(currentTime: number): void {
    const ctx = this.ctx;
    const cardSpacing = 20;
    const totalCardWidth = CARD_WIDTH + cardSpacing;
    const startX = (this.width - HERO_CONFIGS.length * totalCardWidth + cardSpacing) / 2;

    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(0, this.sidebarY, this.width, this.sidebarHeight);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.sidebarY);
    ctx.lineTo(this.width, this.sidebarY);
    ctx.stroke();

    for (let i = 0; i < HERO_CONFIGS.length; i++) {
      const config = HERO_CONFIGS[i];
      const cardX = startX + i * totalCardWidth;
      const cardY = this.sidebarY + 20;
      const isSelected = i === this.uiState.selectedHeroIndex;
      const isDragging = this.dragState.isDragging && this.dragState.heroConfig === config;

      if (!isDragging) {
        this.drawHeroCard(ctx, cardX, cardY, config, isSelected, currentTime);
      }
    }
  }

  drawHeroCard(ctx: CanvasRenderingContext2D, x: number, y: number, config: HeroConfig, selected: boolean, currentTime: number): void {
    const raceColor = RACE_COLORS[config.race];
    const classColor = CLASS_COLORS[config.class];

    if (selected) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20;
    }

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    const borderPulse = selected ? (Math.sin(currentTime * 0.005) + 1) / 2 : 0;
    ctx.strokeStyle = selected ? `rgba(255, 215, 0, ${0.5 + borderPulse * 0.5})` : raceColor;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.shadowBlur = 0;

    const portraitSize = 60;
    const portraitX = x + (CARD_WIDTH - portraitSize) / 2;
    const portraitY = y + 10;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);

    const heroMock = {
      config,
      team: 'player' as Team,
      isAlive: true,
      isHitFlashing: () => false,
      hasFireEffect: () => false,
      hasLightningEffect: () => false,
      hasHealEffect: () => false,
      hasShieldEffect: () => false
    };
    this.drawPixelHero(ctx, portraitX + 5, portraitY + 5, portraitSize - 10, heroMock as unknown as Hero);

    ctx.strokeStyle = classColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(portraitX, portraitY, portraitSize, portraitSize);

    ctx.fillStyle = classColor;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(CLASS_ICONS[config.class], x + CARD_WIDTH / 2, portraitY + portraitSize + 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(config.name, x + CARD_WIDTH / 2, portraitY + portraitSize + 38);

    const barY = y + CARD_HEIGHT - 35;
    const barWidth = CARD_WIDTH - 16;
    const barHeight = 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(x + 8, barY, barWidth, barHeight);
    ctx.fillStyle = '#50c878';
    ctx.fillRect(x + 8, barY, barWidth * (config.maxHp / 150), barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP:${config.maxHp}`, x + 10, barY + 8);

    ctx.fillStyle = '#333';
    ctx.fillRect(x + 8, barY + 15, barWidth, barHeight);
    ctx.fillStyle = '#dc143c';
    ctx.fillRect(x + 8, barY + 15, barWidth * (config.attack / 40), barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText(`ATK:${config.attack}`, x + 10, barY + 23);
  }

  drawDragPreview(): void {
    if (!this.dragState.isDragging || !this.dragState.heroConfig) return;

    const ctx = this.ctx;
    const x = this.dragState.mouseX - CARD_WIDTH / 2;
    const y = this.dragState.mouseY - CARD_HEIGHT / 2;

    ctx.globalAlpha = 0.7;
    this.drawHeroCard(ctx, x, y, this.dragState.heroConfig, false, performance.now());
    ctx.globalAlpha = 1;

    if (this.dragState.targetCell) {
      const cellSize = this.boardWidth / BOARD_COLS;
      const tx = this.boardX + this.dragState.targetCell.col * cellSize;
      const ty = this.boardY + this.dragState.targetCell.row * cellSize;

      ctx.globalAlpha = 0.5;
      const mockHero = {
        config: this.dragState.heroConfig,
        team: 'player' as Team,
        isAlive: true,
        isHitFlashing: () => false,
        hasFireEffect: () => false,
        hasLightningEffect: () => false,
        hasHealEffect: () => false,
        hasShieldEffect: () => false
      };
      this.drawPixelHero(ctx, tx + cellSize * 0.15, ty + cellSize * 0.15, cellSize * 0.7, mockHero as unknown as Hero);
      ctx.globalAlpha = 1;
    }
  }

  drawButtons(phase: string): void {
    const ctx = this.ctx;
    const btnY = this.boardY - 50;
    const btnWidth = 140;
    const btnHeight = 40;
    const spacing = 20;

    const startX = this.width / 2 - btnWidth - spacing / 2;
    const resetX = this.width / 2 + spacing / 2;

    const canStart = phase === 'preparing';
    this.drawButton(ctx, startX, btnY, btnWidth, btnHeight, '开始战斗', canStart ? '#ffd700' : '#666', canStart);
    this.drawButton(ctx, resetX, btnY, btnWidth, btnHeight, '重置', '#dc143c', true);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    const phaseText = phase === 'preparing' ? '部署阶段' : phase === 'fighting' ? '战斗中...' : '战斗结束';
    ctx.fillText(phaseText, this.width / 2, btnY - 15);
  }

  drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, color: string, enabled: boolean): void {
    ctx.fillStyle = enabled ? '#1a1a2e' : '#333';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    if (enabled) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = color;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  drawResultAnimation(): void {
    const ctx = this.ctx;
    const progress = this.uiState.resultAnimationProgress;
    const isVictory = this.uiState.winner === 'player';

    if (progress < 0.3) {
      const flashAlpha = progress / 0.3;
      ctx.fillStyle = isVictory ? `rgba(255, 215, 0, ${flashAlpha * 0.8})` : `rgba(220, 20, 60, ${flashAlpha * 0.8})`;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (progress < 0.6) {
      ctx.fillStyle = isVictory ? 'rgba(255, 215, 0, 0.8)' : 'rgba(220, 20, 60, 0.8)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const fadeAlpha = 1 - (progress - 0.6) / 0.4;
      ctx.fillStyle = isVictory ? `rgba(255, 215, 0, ${0.3 + fadeAlpha * 0.5})` : `rgba(220, 20, 60, ${0.3 + fadeAlpha * 0.5})`;
      ctx.fillRect(0, 0, this.width, this.height);

      const scale = 0.5 + (progress - 0.6) / 0.4 * 0.5;
      ctx.save();
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(scale, scale);

      ctx.font = 'bold 72px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = isVictory ? '#ffd700' : '#dc143c';
      ctx.shadowBlur = 30;
      ctx.fillText(isVictory ? '胜 利!' : '失 败!', 0, -60);

      ctx.font = '24px "Courier New", monospace';
      ctx.shadowBlur = 15;
      ctx.fillText(`存活英雄: 我方 ${this.uiState.survivorStats.player}  敌方 ${this.uiState.survivorStats.enemy}`, 0, 20);

      ctx.font = '18px "Courier New", monospace';
      ctx.fillStyle = '#aaa';
      ctx.shadowBlur = 0;
      ctx.fillText('点击 "重置" 开始新的战斗', 0, 80);

      ctx.restore();
    }
  }

  private lastFpsUpdate: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 0;

  drawFPS(): void {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 80, 30);
    ctx.fillStyle = this.currentFps >= 55 ? '#50c878' : this.currentFps >= 30 ? '#ffd700' : '#dc143c';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.currentFps} FPS`, 20, 30);
  }
}
