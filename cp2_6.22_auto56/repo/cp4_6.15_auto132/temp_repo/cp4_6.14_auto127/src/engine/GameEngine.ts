import Matter from 'matter-js';
import { InputManager, inputManager } from './InputManager';
import { RenderEngine } from './RenderEngine';
import { WorldGenerator } from '../game/WorldGenerator';
import { playerState } from '../game/PlayerState';
import { useGameStore, Cell, FallingRock } from '../store/gameStore';

const DIG_DURATION = 1.5;
const FALLING_ROCK_CHANCE = 0.15;
const FALLING_ROCK_DURATION = 0.3;
const ENERGY_PER_DIG = 5;
const ENERGY_REGEN_PER_SEC = 2;
const MOVE_COOLDOWN = 0.15;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private renderEngine: RenderEngine | null = null;
  private inputManager: InputManager = inputManager;
  private worldGenerator: WorldGenerator | null = null;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private fixedTimeStep: number = 1 / 60;
  private isRunning: boolean = false;
  private moveCooldown: number = 0;
  private particles: Particle[] = [];
  private rockIdCounter: number = 0;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private hudHeight: number = 32;
  private toolbarHeight: number = 60;
  private scale: number = 1;

  private physicsEngine: Matter.Engine;
  private physicsWorld: Matter.World;
  private physicsRockBodies: Map<number, Matter.Body> = new Map();

  constructor() {
    this.physicsEngine = Matter.Engine.create();
    this.physicsWorld = this.physicsEngine.world;
    this.physicsEngine.gravity.y = 3;
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.renderEngine = new RenderEngine(canvas);
    this.inputManager.init();
    this.resize();
    this.startNewGame();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  destroy(): void {
    this.stop();
    this.inputManager.destroy();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.resize();
  }

  private resize(): void {
    if (!this.canvas || !this.renderEngine) return;

    const windowWidth = window.innerWidth;
    this.scale = windowWidth < 800 ? 0.8 : 1;

    const gridSize = useGameStore.getState().gridSize;
    const cellSize = Math.floor(48 * this.scale);
    const gridPixelSize = cellSize * gridSize;

    this.hudHeight = Math.floor(32 * this.scale);
    this.toolbarHeight = Math.floor(60 * this.scale);

    this.canvasWidth = gridPixelSize;
    this.canvasHeight = gridPixelSize + this.hudHeight + this.toolbarHeight + 10;

    this.canvas.style.width = `${this.canvasWidth}px`;
    this.canvas.style.height = `${this.canvasHeight}px`;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.renderEngine.setSize(this.canvasWidth, this.canvasHeight);
    this.renderEngine.setCellSize(cellSize);
    this.renderEngine.setOffset(0, this.hudHeight);
  }

  startNewGame(): void {
    useGameStore.getState().resetGame();
    
    this.worldGenerator = new WorldGenerator();
    const grid = this.worldGenerator.generate();
    useGameStore.getState().setGrid(grid);

    const startX = 1;
    const startY = 1;
    useGameStore.getState().setPlayerPosition(startX, startY);
    
    const cellSize = Math.floor(48 * this.scale);
    useGameStore.getState().setPlayerPixelPosition(startX * cellSize, startY * cellSize);

    this.particles = [];
    useGameStore.getState().updateFallingRocks([]);
    this.moveCooldown = 0;

    for (const [, body] of this.physicsRockBodies) {
      Matter.World.remove(this.physicsWorld, body);
    }
    this.physicsRockBodies.clear();

    this.resize();
    useGameStore.getState().setGameStarted(true);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (deltaTime > 0.25) deltaTime = 0.25;

    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    const state = useGameStore.getState();

    Matter.Engine.update(this.physicsEngine, dt * 1000);

    if (!state.gameStarted || state.isGameOver || state.isWin) {
      this.updateHurtTimer(dt);
      this.updateFallingRocks(dt);
      this.updateParticles(dt);
      return;
    }

    useGameStore.getState().setElapsedTime(state.elapsedTime + dt);
    playerState.regenerateEnergy(ENERGY_REGEN_PER_SEC * dt);

    if (this.moveCooldown > 0) {
      this.moveCooldown -= dt;
    }

    this.updateHurtTimer(dt);
    this.updateDigging(dt);
    this.handleMovement(dt);
    this.updateFallingRocks(dt);
    this.updateParticles(dt);
    this.checkWin();

    if (this.renderEngine) {
      this.renderEngine.update(dt);
    }
  }

  private updateHurtTimer(dt: number): void {
    const state = useGameStore.getState();
    if (state.playerHurtTimer > 0) {
      useGameStore.getState().setPlayerHurtTimer(Math.max(0, state.playerHurtTimer - dt));
    }
  }

  private updateDigging(dt: number): void {
    const state = useGameStore.getState();
    if (!state.isDigging) return;

    const speedMult = playerState.getDigSpeedMultiplier();
    const newProgress = state.digProgress + (dt / DIG_DURATION) * speedMult;

    if (newProgress >= 1) {
      this.completeDigging();
    } else {
      useGameStore.getState().setDigProgress(newProgress);
    }
  }

  private completeDigging(): void {
    const state = useGameStore.getState();
    const grid = state.grid.map(row => row.map(cell => ({ ...cell })));
    const targetX = state.digTargetX;
    const targetY = state.digTargetY;
    const cell = grid[targetY][targetX];

    const isOre = cell.type === 'iron' || cell.type === 'gold' || cell.type === 'diamond';
    const isRock = cell.type === 'rock';

    if (cell.type === 'iron') {
      playerState.addResource('iron', 1);
      this.spawnParticles(targetX, targetY, '#92400e', 8);
    } else if (cell.type === 'gold') {
      playerState.addResource('gold', 1);
      this.spawnParticles(targetX, targetY, '#f59e0b', 10);
    } else if (cell.type === 'diamond') {
      playerState.addResource('diamond', 1);
      this.spawnParticles(targetX, targetY, '#06b6d4', 12);
    } else if (cell.type === 'rock') {
      this.spawnParticles(targetX, targetY, '#6b7280', 6);
    }

    grid[targetY][targetX].type = 'empty';

    if (playerState.hasGoldPickaxe() && Math.random() < 0.2) {
      this.destroyAdjacent(grid, targetX, targetY);
    }

    useGameStore.getState().setGrid(grid);
    useGameStore.getState().setDigging(false);

    playerState.consumeEnergy(ENERGY_PER_DIG);

    if (isRock && Math.random() < FALLING_ROCK_CHANCE) {
      this.spawnFallingRock(targetX, targetY);
    }

    this.moveCooldown = 0;
  }

  private destroyAdjacent(grid: Cell[][], x: number, y: number): void {
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
        const adjCell = grid[ny][nx];
        if (adjCell.type === 'rock' || adjCell.type === 'iron' || adjCell.type === 'gold' || adjCell.type === 'diamond') {
          if (adjCell.type === 'iron') playerState.addResource('iron', 1);
          if (adjCell.type === 'gold') playerState.addResource('gold', 1);
          if (adjCell.type === 'diamond') playerState.addResource('diamond', 1);
          grid[ny][nx].type = 'empty';
          this.spawnParticles(nx, ny, '#6b7280', 4);
        }
      }
    }
  }

  private spawnFallingRock(gridX: number, gridY: number): void {
    const cellSize = Math.floor(48 * this.scale);
    const rockSize = 16;
    const startX = gridX * cellSize + cellSize / 2;
    const startY = -rockSize;

    const rockBody = Matter.Bodies.rectangle(startX, startY, rockSize, rockSize, {
      restitution: 0.3,
      friction: 0.5,
      angle: Math.random() * Math.PI,
      angularVelocity: (Math.random() - 0.5) * 0.3,
    });

    const rockId = this.rockIdCounter++;
    this.physicsRockBodies.set(rockId, rockBody);
    Matter.World.add(this.physicsWorld, rockBody);

    const rock: FallingRock = {
      id: rockId,
      x: gridX,
      y: -20,
      startY: -20,
      targetY: gridY * cellSize + cellSize,
      progress: 0,
      rotation: 0,
    };
    useGameStore.getState().addFallingRock(rock);
  }

  private updateFallingRocks(dt: number): void {
    const state = useGameStore.getState();
    const cellSize = Math.floor(48 * this.scale);
    const playerX = state.playerX;
    const playerY = state.playerY;
    const gridSize = state.gridSize;

    const rocks = state.fallingRocks;
    const updatedRocks: FallingRock[] = [];

    for (const rock of rocks) {
      const body = this.physicsRockBodies.get(rock.id);
      if (!body) continue;

      rock.y = body.position.y - 8;
      rock.rotation = body.angle;

      const playerCenterX = playerX * cellSize + cellSize / 2;
      const playerCenterY = playerY * cellSize + cellSize / 2;
      const rockCenterX = body.position.x;
      const rockCenterY = body.position.y;

      const dx = Math.abs(rockCenterX - playerCenterX);
      const dy = Math.abs(rockCenterY - playerCenterY);

      if (dx < cellSize * 0.35 && dy < cellSize * 0.35) {
        playerState.takeDamage(1);
        this.spawnParticles(Math.round(rockCenterX / cellSize), Math.round(rockCenterY / cellSize), '#ef4444', 10);
        Matter.World.remove(this.physicsWorld, body);
        this.physicsRockBodies.delete(rock.id);
        continue;
      }

      const groundY = gridSize * cellSize;
      if (body.position.y > groundY + 32) {
        const gridX = Math.round(rockCenterX / cellSize);
        const gridY = Math.floor((body.position.y + 8) / cellSize);
        this.spawnParticles(gridX, Math.min(gridSize - 1, Math.max(0, gridY - 1)), '#6b7280', 5);
        Matter.World.remove(this.physicsWorld, body);
        this.physicsRockBodies.delete(rock.id);
        continue;
      }

      updatedRocks.push(rock);
    }

    useGameStore.getState().updateFallingRocks(updatedRocks);
  }

  private handleMovement(dt: number): void {
    const state = useGameStore.getState();
    if (state.isDigging || this.moveCooldown > 0) return;

    const input = this.inputManager.getInput();
    let dx = 0;
    let dy = 0;

    if (input.up) dy = -1;
    else if (input.down) dy = 1;
    else if (input.left) dx = -1;
    else if (input.right) dx = 1;

    if (dx === 0 && dy === 0) return;

    const newX = state.playerX + dx;
    const newY = state.playerY + dy;

    const grid = state.grid;
    if (newY < 0 || newY >= grid.length || newX < 0 || newX >= grid[0].length) return;

    const targetCell = grid[newY][newX];

    if (targetCell.type === 'empty' || targetCell.type === 'exit') {
      useGameStore.getState().setPlayerPosition(newX, newY);
      const cellSize = Math.floor(48 * this.scale);
      useGameStore.getState().setPlayerPixelPosition(newX * cellSize, newY * cellSize);
      this.moveCooldown = MOVE_COOLDOWN;
    } else if (targetCell.type === 'rock' || targetCell.type === 'iron' || targetCell.type === 'gold' || targetCell.type === 'diamond') {
      if (state.energy >= ENERGY_PER_DIG) {
        useGameStore.getState().setDigging(true, newX, newY);
      }
    }
  }

  private checkWin(): void {
    const state = useGameStore.getState();
    const grid = state.grid;
    const cell = grid[state.playerY][state.playerX];

    if (cell.type === 'exit') {
      const score = this.calculateScore();
      useGameStore.getState().setScore(score);
      useGameStore.getState().setWin(true);
    }
  }

  private calculateScore(): number {
    const state = useGameStore.getState();
    let score = 0;

    const timeBonus = Math.floor((state.elapsedTime > 0 ? state.elapsedTime : 0) / 10) * 10;
    score += Math.max(0, 500 - timeBonus);

    score += state.inventory.iron * 5;
    score += state.inventory.gold * 10;
    score += state.inventory.diamond * 50;

    return Math.floor(score);
  }

  private spawnParticles(gridX: number, gridY: number, color: string, count: number): void {
    const cellSize = Math.floor(48 * this.scale);
    const centerX = gridX * cellSize + cellSize / 2;
    const centerY = gridY * cellSize + cellSize / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * cellSize * 0.5,
        y: centerY + (Math.random() - 0.5) * cellSize * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private render(): void {
    if (!this.renderEngine || !this.canvas) return;

    const state = useGameStore.getState();
    const cellSize = Math.floor(48 * this.scale);

    this.renderEngine.clear();

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    this.renderHUD(ctx);

    this.renderEngine.renderGrid(state.grid);

    for (const rock of state.fallingRocks) {
      this.renderEngine.renderFallingRocks([rock]);
    }

    const playerPx = state.playerX * cellSize;
    const playerPy = state.playerY * cellSize;
    this.renderEngine.renderPlayer(
      playerPx,
      playerPy,
      state.playerHurtTimer > 0,
      state.isDigging,
      state.digProgress
    );

    this.renderEngine.renderParticles(this.particles);

    this.renderToolbar(ctx);

    if (state.isGameOver) {
      this.renderGameOver(ctx);
    }

    if (state.isWin) {
      this.renderWin(ctx);
    }
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    const state = useGameStore.getState();
    const w = this.canvasWidth;
    const h = this.hudHeight;

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, w, h);

    const heartSize = Math.floor(16 * this.scale);
    const heartY = (h - heartSize) / 2;
    for (let i = 0; i < state.maxHealth; i++) {
      const heartX = 8 + i * (heartSize + 4);
      this.drawHeart(ctx, heartX, heartY, heartSize, i < Math.ceil(state.health), state.health - i);
    }

    const barWidth = Math.floor(200 * this.scale);
    const barHeight = Math.floor(8 * this.scale);
    const barX = w - barWidth - 12;
    const barY = (h - barHeight) / 2;

    ctx.fillStyle = '#475569';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const energyPercent = state.energy / state.maxEnergy;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    const timeStr = this.formatTime(state.elapsedTime);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.floor(20 * this.scale)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, w / 2, h / 2);
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, filled: boolean, healthFrac: number): void {
    const s = size;
    ctx.fillStyle = filled ? '#ef4444' : '#475569';

    const px = s / 8;
    ctx.fillRect(x + px, y, px * 2, px * 3);
    ctx.fillRect(x + px * 5, y, px * 2, px * 3);
    ctx.fillRect(x, y + px, px, px * 2);
    ctx.fillRect(x + px * 7, y + px, px, px * 2);
    ctx.fillRect(x, y + px * 2, s, px * 3);
    ctx.fillRect(x + px, y + px * 5, px * 6, px);
    ctx.fillRect(x + px * 2, y + px * 6, px * 4, px);
    ctx.fillRect(x + px * 3, y + px * 7, px * 2, px);

    if (filled && healthFrac < 1 && healthFrac > 0) {
      ctx.fillStyle = '#475569';
      const cutHeight = s * (1 - healthFrac);
      ctx.fillRect(x, y, s, cutHeight);
    }

    if (filled) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + px * 2, y + px * 2, px, px);
    }
  }

  private renderToolbar(ctx: CanvasRenderingContext2D): void {
    const state = useGameStore.getState();
    const w = this.canvasWidth;
    const h = this.toolbarHeight;
    const y = this.canvasHeight - h;

    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, 8, y + 4, w - 16, h - 8, Math.floor(8 * this.scale));
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y - 1);
    ctx.lineTo(w, y - 1);
    ctx.stroke();
    ctx.setLineDash([]);

    const slotWidth = Math.floor(96 * this.scale);
    const slotHeight = Math.floor(52 * this.scale);
    const slotY = y + (h - slotHeight) / 2;
    const spacing = Math.floor(12 * this.scale);
    const startX = (w - (slotWidth * 3 + spacing * 2)) / 2;

    const equipments = [
      { key: 'ironPickaxe', name: '铁镐', icon: '⛏', color: '#92400e', cost: '5铁' },
      { key: 'goldPickaxe', name: '金镐', icon: '⛏', color: '#f59e0b', cost: '3金' },
      { key: 'diamondHelmet', name: '钻石头盔', icon: '⛑', color: '#06b6d4', cost: '2钻' },
    ] as const;

    for (let i = 0; i < equipments.length; i++) {
      const eq = equipments[i];
      const slotX = startX + i * (slotWidth + spacing);
      const owned = state.equipment[eq.key];

      ctx.fillStyle = '#334155';
      this.roundRect(ctx, slotX, slotY, slotWidth, slotHeight, Math.floor(6 * this.scale));
      ctx.fill();

      if (owned) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        this.roundRect(ctx, slotX, slotY, slotWidth, slotHeight, Math.floor(6 * this.scale));
        ctx.stroke();
      }

      ctx.fillStyle = eq.color;
      ctx.font = `${Math.floor(20 * this.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(eq.icon, slotX + slotWidth / 2, slotY + slotHeight * 0.4);

      ctx.fillStyle = owned ? '#facc15' : '#94a3b8';
      ctx.font = `${Math.floor(10 * this.scale)}px 'Courier New', monospace`;
      ctx.fillText(eq.name, slotX + slotWidth / 2, slotY + slotHeight - 12 * this.scale);

      if (!owned) {
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.floor(9 * this.scale)}px 'Courier New', monospace`;
        ctx.fillText(eq.cost, slotX + slotWidth / 2, slotY + slotHeight - 4 * this.scale);
      }
    }

    const invY = y + h * 0.3;
    const invX = 16 * this.scale;
    const invItems = [
      { icon: '■', color: '#92400e', count: state.inventory.iron },
      { icon: '■', color: '#f59e0b', count: state.inventory.gold },
      { icon: '◆', color: '#06b6d4', count: state.inventory.diamond },
    ];

    for (let i = 0; i < invItems.length; i++) {
      const item = invItems[i];
      const ix = invX + i * 50 * this.scale;
      ctx.fillStyle = item.color;
      ctx.font = `${Math.floor(14 * this.scale)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, ix, invY);
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `${Math.floor(12 * this.scale)}px 'Courier New', monospace`;
      ctx.fillText(`×${item.count}`, ix + 18 * this.scale, invY);
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private renderGameOver(ctx: CanvasRenderingContext2D): void {
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.floor(480 * this.scale * 0.7);
    const panelH = Math.floor(320 * this.scale * 0.7);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, panelX, panelY, panelW, panelH, Math.floor(24 * this.scale));
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.font = `bold ${Math.floor(48 * this.scale)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', w / 2, panelY + panelH * 0.3);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = `${Math.floor(16 * this.scale)}px 'Courier New', monospace`;
    ctx.fillText('你被落石击中了...', w / 2, panelY + panelH * 0.5);

    const btnW = Math.floor(160 * this.scale);
    const btnH = Math.floor(48 * this.scale);
    const btnX = (w - btnW) / 2;
    const btnY = panelY + panelH * 0.7;

    ctx.fillStyle = '#22c55e';
    this.roundRect(ctx, btnX, btnY, btnW, btnH, Math.floor(8 * this.scale));
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(18 * this.scale)}px 'Courier New', monospace`;
    ctx.fillText('重新开始', w / 2, btnY + btnH / 2);
  }

  private renderWin(ctx: CanvasRenderingContext2D): void {
    const state = useGameStore.getState();
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.floor(480 * this.scale * 0.7);
    const panelH = Math.floor(320 * this.scale * 0.7);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, panelX, panelY, panelW, panelH, Math.floor(24 * this.scale));
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.font = `bold ${Math.floor(36 * this.scale)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('通关成功！', w / 2, panelY + panelH * 0.2);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = `${Math.floor(18 * this.scale)}px 'Courier New', monospace`;
    ctx.fillText(`得分: ${state.score}`, w / 2, panelY + panelH * 0.4);

    const timeStr = this.formatTime(state.elapsedTime);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.floor(14 * this.scale)}px 'Courier New', monospace`;
    ctx.fillText(`用时: ${timeStr}`, w / 2, panelY + panelH * 0.55);

    const btnW = Math.floor(160 * this.scale);
    const btnH = Math.floor(48 * this.scale);
    const btnX = (w - btnW) / 2;
    const btnY = panelY + panelH * 0.78;

    ctx.fillStyle = '#22c55e';
    this.roundRect(ctx, btnX, btnY, btnW, btnH, Math.floor(8 * this.scale));
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(18 * this.scale)}px 'Courier New', monospace`;
    ctx.fillText('再玩一次', w / 2, btnY + btnH / 2);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  handleClick(x: number, y: number): void {
    const state = useGameStore.getState();

    if (state.isGameOver || state.isWin) {
      const w = this.canvasWidth;
      const h = this.canvasHeight;
      const panelW = Math.floor(480 * this.scale * 0.7);
      const panelH = Math.floor(320 * this.scale * 0.7);
      const panelY = (h - panelH) / 2;

      const btnW = Math.floor(160 * this.scale);
      const btnH = Math.floor(48 * this.scale);
      const btnX = (w - btnW) / 2;
      const btnY = panelY + (state.isGameOver ? panelH * 0.7 : panelH * 0.78);

      if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
        this.startNewGame();
        return;
      }
    }

    const toolbarY = this.canvasHeight - this.toolbarHeight;
    if (y >= toolbarY) {
      const slotWidth = Math.floor(96 * this.scale);
      const slotHeight = Math.floor(52 * this.scale);
      const slotY = toolbarY + (this.toolbarHeight - slotHeight) / 2;
      const spacing = Math.floor(12 * this.scale);
      const startX = (this.canvasWidth - (slotWidth * 3 + spacing * 2)) / 2;

      const equipments: Array<{ key: 'ironPickaxe' | 'goldPickaxe' | 'diamondHelmet' }> = [
        { key: 'ironPickaxe' },
        { key: 'goldPickaxe' },
        { key: 'diamondHelmet' },
      ];

      for (let i = 0; i < equipments.length; i++) {
        const slotX = startX + i * (slotWidth + spacing);
        if (x >= slotX && x <= slotX + slotWidth && y >= slotY && y <= slotY + slotHeight) {
          const success = playerState.upgradeEquipment(equipments[i].key);
          if (success) {
            this.playUpgradeSound();
          }
          return;
        }
      }
    }
  }

  private playUpgradeSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio not supported
    }
  }
}

export const gameEngine = new GameEngine();
