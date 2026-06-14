import { Renderer } from './renderer';
import { GameState } from './gameState';
import { MaterialBottle, Cauldron, MaterialType } from './entities';

class Game {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  gameState: GameState;
  lastTime: number;
  deltaTime: number;
  animationFrameId: number;
  cauldron: Cauldron;
  materialBottles: MaterialBottle[];
  mousePosition: { x: number; y: number };
  isDragging: boolean;
  fps: number;
  fpsCounter: number;
  fpsTimer: number;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    this.gameState = new GameState();
    this.lastTime = 0;
    this.deltaTime = 0;
    this.animationFrameId = 0;
    this.cauldron = new Cauldron(0, 0, 180, 120);
    this.materialBottles = [];
    this.mousePosition = { x: 0, y: 0 };
    this.isDragging = false;
    this.fps = 60;
    this.fpsCounter = 0;
    this.fpsTimer = 0;
  }

  init(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.setupInputHandlers();
    this.createMaterialBottles();
    
    this.gameState.spawnCustomer();
    
    this.loop(performance.now());
  }

  private resizeCanvas(): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.gameState.updateLayout(width, height);
    
    if (this.materialBottles.length > 0) {
      this.updateBottlePositions();
    }
  }

  private createMaterialBottles(): void {
    const types: MaterialType[] = ['fire', 'nature', 'water', 'earth'];
    this.materialBottles = [];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const type = types[(row * 4 + col) % types.length];
        const bottle = new MaterialBottle(type, 0, 0, row, col);
        this.materialBottles.push(bottle);
      }
    }
    
    this.updateBottlePositions();
  }

  private updateBottlePositions(): void {
    const area = this.gameState.cabinetArea;
    const cols = 4;
    const rows = 3;
    const cellWidth = area.width / cols;
    const cellHeight = (area.height - 40) / rows;

    this.materialBottles.forEach(bottle => {
      const col = bottle.gridIndex.col;
      const row = bottle.gridIndex.row;
      const x = area.x + cellWidth * (col + 0.5);
      const y = area.y + 40 + cellHeight * (row + 0.5);
      bottle.originalPosition = { x, y };
      if (!bottle.isDragging) {
        bottle.position = { x, y };
      }
    });
  }

  private setupInputHandlers(): void {
    const getCanvasPoint = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const point = getCanvasPoint(e);
      this.mousePosition = point;

      if (this.gameState.showUpgradeModal) {
        const rect = (window as any).__upgradeModalRect;
        if (rect && this.pointInRect(point, rect)) {
          this.gameState.levelUp();
        }
        return;
      }

      if (this.gameState.brewedPotion && !this.gameState.brewedPotion.isFlying) {
        if (this.gameState.brewedPotion.containsPoint(point.x, point.y)) {
          const customer = this.gameState.customers.find(
            c => c.state === 'waiting' && c.order.id === this.gameState.brewedPotion!.recipe.id
          );
          if (customer) {
            this.gameState.deliverPotionToCustomer(customer);
            return;
          }
        }
      }

      for (const bottle of this.materialBottles) {
        if (bottle.containsPoint(point.x, point.y)) {
          this.isDragging = true;
          bottle.isDragging = true;
          this.gameState.selectMaterial(bottle);
          this.canvas.style.cursor = 'grabbing';
          return;
        }
      }

      this.gameState.selectMaterial(null);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const point = getCanvasPoint(e);
      this.mousePosition = point;

      if (this.isDragging && this.gameState.selectedMaterial) {
        this.gameState.selectedMaterial.position.x = point.x;
        this.gameState.selectedMaterial.position.y = point.y;
      }

      if (!this.isDragging) {
        let hovering = false;
        for (const bottle of this.materialBottles) {
          if (bottle.containsPoint(point.x, point.y)) {
            hovering = true;
            break;
          }
        }
        if (this.gameState.brewedPotion && this.gameState.brewedPotion.containsPoint(point.x, point.y)) {
          hovering = true;
        }
        this.canvas.style.cursor = hovering ? 'grab' : 'default';
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      if (this.isDragging && this.gameState.selectedMaterial) {
        const bottle = this.gameState.selectedMaterial;
        
        if (this.cauldron.containsPoint(bottle.position.x, bottle.position.y)) {
          this.gameState.addMaterialToCauldron(this.cauldron, bottle);
        }
        
        bottle.resetPosition();
        bottle.isSelected = false;
        this.gameState.selectMaterial(null);
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
      }
    };

    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    this.canvas.addEventListener('mouseup', handleEnd);
    this.canvas.addEventListener('mouseleave', handleEnd);
    
    this.canvas.addEventListener('touchstart', handleStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleMove, { passive: false });
    this.canvas.addEventListener('touchend', handleEnd);
    this.canvas.addEventListener('touchcancel', handleEnd);
  }

  private pointInRect(point: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  private loop(currentTime: number): void {
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.fpsCounter++;
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
    }

    this.update(this.deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(deltaTime: number): void {
    this.gameState.update(deltaTime);
    this.cauldron.update(deltaTime);
    
    this.materialBottles.forEach(bottle => {
      bottle.update(deltaTime);
    });

    const waitingCustomers = this.gameState.customers.filter(c => c.state === 'waiting');
    waitingCustomers.forEach((customer, index) => {
      let targetX: number, targetY: number;
      if (this.gameState.isMobile) {
        const spacing = this.gameState.customerArea.width / Math.min(5, waitingCustomers.length + 2);
        targetX = this.gameState.customerArea.x + spacing * (index + 1);
        targetY = this.gameState.customerArea.y + this.gameState.customerArea.height / 2 + 20;
      } else {
        targetX = this.gameState.customerArea.x + this.gameState.customerArea.width / 2;
        targetY = this.gameState.customerArea.y + 100 + index * 120;
      }
      customer.targetPosition = { x: targetX, y: targetY };
    });
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawBackground();
    this.renderer.drawHeader('🧪 魔法药剂店', this.gameState.gold, this.gameState.level, this.gameState.goldScale);
    
    this.renderer.drawCustomerArea(this.gameState.customers, this.gameState.customerArea);
    this.renderer.drawCabinetArea(this.materialBottles, this.gameState.cabinetArea);
    
    const totalSteps = this.gameState.currentRecipe ? this.gameState.currentRecipe.ingredients.length : 0;
    this.renderer.drawCauldronArea(
      this.cauldron, 
      this.gameState.brewedPotion, 
      this.gameState.cauldronArea,
      this.gameState.currentRecipeStep,
      totalSteps
    );

    if (this.gameState.brewedPotion && this.gameState.brewedPotion.isFlying) {
      this.renderer.drawFlyingPotion(this.gameState.brewedPotion);
    }

    this.renderer.drawGoldFlyEffects(this.gameState.goldFlyEffects);
    
    if (this.gameState.showUpgradeModal || this.gameState.modalScale > 0) {
      this.renderer.drawUpgradeModal(
        this.gameState.showUpgradeModal,
        this.gameState.level,
        this.gameState.modalScale
      );
    }

    if (this.gameState.selectedMaterial && this.isDragging) {
      this.renderer.drawMaterialBottle(this.gameState.selectedMaterial);
    }

    this.drawFPS();
  }

  private drawFPS(): void {
    this.renderer.ctx.save();
    this.renderer.ctx.font = '10px system-ui, sans-serif';
    this.renderer.ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    this.renderer.ctx.textAlign = 'left';
    this.renderer.ctx.textBaseline = 'top';
    this.renderer.ctx.fillText(`${this.fps} FPS`, 10, 10);
    this.renderer.ctx.restore();
  }
}

const game = new Game();
window.addEventListener('DOMContentLoaded', () => {
  game.init();
});
