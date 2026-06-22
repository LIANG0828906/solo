import * as PIXI from 'pixi.js';
import { World } from './ecosystem/World';
import { UIManager } from './ui/UIManager';
import type { Creature } from './ecosystem/Creature';
import type { Resource, BattleEffect } from './ecosystem/BioSimulator';

class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 10) {
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.createFn();
  }

  release(item: T): void {
    this.pool.push(item);
  }
}

interface CreatureSprite {
  container: PIXI.Container;
  body: PIXI.Graphics;
  trails: PIXI.Graphics[];
  scaleAnim: number;
  isNew: boolean;
}

interface ResourceSprite {
  sprite: PIXI.Graphics;
  glow: PIXI.Graphics;
}

interface BattleEffectSprite {
  circle: PIXI.Graphics;
  duration: number;
  maxDuration: number;
}

class EcosystemApp {
  private app: PIXI.Application;
  private world: World;
  private uiManager: UIManager;
  private container: HTMLElement;

  private worldContainer: PIXI.Container;
  private gridLayer: PIXI.Graphics;
  private resourceLayer: PIXI.Container;
  private creatureLayer: PIXI.Container;
  private effectLayer: PIXI.Container;

  private creatureSprites: Map<string, CreatureSprite> = new Map();
  private resourceSprites: Map<string, ResourceSprite> = new Map();
  private battleEffectSprites: BattleEffectSprite[] = [];

  private graphicsPool: ObjectPool<PIXI.Graphics>;
  private trailPool: ObjectPool<PIXI.Graphics>;

  private lastTime: number = 0;
  private scale: number = 1;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.world = new World();
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: false,
      backgroundColor: 0x0a1628,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.app.view.style.display = 'block';
    this.app.view.style.width = '100%';
    this.app.view.style.height = '100%';
    container.appendChild(this.app.view as HTMLCanvasElement);

    this.graphicsPool = new ObjectPool<PIXI.Graphics>(() => new PIXI.Graphics(), 50);
    this.trailPool = new ObjectPool<PIXI.Graphics>(() => new PIXI.Graphics(), 200);

    this.worldContainer = new PIXI.Container();
    this.gridLayer = new PIXI.Graphics();
    this.resourceLayer = new PIXI.Container();
    this.creatureLayer = new PIXI.Container();
    this.effectLayer = new PIXI.Container();

    this.worldContainer.addChild(this.gridLayer);
    this.worldContainer.addChild(this.resourceLayer);
    this.worldContainer.addChild(this.creatureLayer);
    this.worldContainer.addChild(this.effectLayer);
    this.app.stage.addChild(this.worldContainer);

    this.uiManager = new UIManager(container);

    this.setupEventListeners();
    this.setupUI();
    this.resize();
    this.world.init();
    this.drawGrid();
    this.app.ticker.add(this.animate.bind(this));
  }

  private setupUI(): void {
    this.uiManager.onPlayPause(() => {
      this.world.togglePause();
      this.uiManager.setIsPaused(this.world.isPaused);
    });

    this.uiManager.onSpeedChange((speed: number) => {
      this.world.setSpeed(speed);
    });

    this.uiManager.onReset(() => {
      this.world.reset();
      this.clearAllSprites();
      this.drawGrid();
      this.uiManager.statsChart.clear();
      this.uiManager.setIsPaused(false);
      this.uiManager.setSpeed(1);
    });

    this.uiManager.setIsPaused(false);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.resize.bind(this));

    this.app.view.addEventListener('click', (e: MouseEvent) => {
      const rect = this.app.view.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.app.renderer.width / rect.width) / this.scale;
      const y = (e.clientY - rect.top) * (this.app.renderer.height / rect.height) / this.scale;

      const offsetX = (this.app.renderer.width - this.world.worldWidth * this.scale) / 2 / this.scale;
      const offsetY = (this.app.renderer.height - this.world.worldHeight * this.scale) / 2 / this.scale;

      const worldX = x - offsetX;
      const worldY = y - offsetY;

      const creature = this.world.getCreatureAt(worldX, worldY);
      if (creature) {
        this.uiManager.showCreatureInfo(creature, e.clientX, e.clientY);
      } else {
        this.uiManager.hideCreatureInfo();
      }
    });
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.app.renderer.resize(width, height);

    const scaleX = (width - 320) / this.world.worldWidth;
    const scaleY = height / this.world.worldHeight;
    this.scale = Math.min(scaleX, scaleY, 2);

    if (window.innerWidth < 768) {
      const mobileScaleX = width / this.world.worldWidth;
      const mobileScaleY = (height - 200) / this.world.worldHeight;
      this.scale = Math.min(mobileScaleX, mobileScaleY, 2);
    }

    this.worldContainer.scale.set(this.scale);
    this.worldContainer.x = (width - this.world.worldWidth * this.scale) / 2;
    this.worldContainer.y = (height - this.world.worldHeight * this.scale) / 2;

    this.drawGrid();
  }

  private drawGrid(): void {
    this.gridLayer.clear();
    const gridSize = this.world.gridSize;
    const cellSize = this.world.cellSize;

    this.gridLayer.lineStyle(0.5, 0xffffff, 0.1);

    for (let i = 0; i <= gridSize; i++) {
      this.gridLayer.moveTo(i * cellSize, 0);
      this.gridLayer.lineTo(i * cellSize, gridSize * cellSize);
      this.gridLayer.moveTo(0, i * cellSize);
      this.gridLayer.lineTo(gridSize * cellSize, i * cellSize);
    }
  }

  private clearAllSprites(): void {
    for (const sprite of this.creatureSprites.values()) {
      this.creatureLayer.removeChild(sprite.container);
      for (const trail of sprite.trails) {
        this.trailPool.release(trail);
      }
      this.graphicsPool.release(sprite.body);
    }
    this.creatureSprites.clear();

    for (const sprite of this.resourceSprites.values()) {
      this.resourceLayer.removeChild(sprite.sprite);
      this.resourceLayer.removeChild(sprite.glow);
      this.graphicsPool.release(sprite.sprite);
      this.graphicsPool.release(sprite.glow);
    }
    this.resourceSprites.clear();

    for (const effect of this.battleEffectSprites) {
      this.effectLayer.removeChild(effect.circle);
      this.graphicsPool.release(effect.circle);
    }
    this.battleEffectSprites = [];
  }

  private animate(currentTime: number): void {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.world.update(deltaTime);
    this.updateResources();
    this.updateCreatures();
    this.updateBattleEffects();
    this.renderBattleEffects();

    const stats = this.world.getStats();
    this.uiManager.updateStats(stats);

    if (stats.tick % 5 === 0) {
      this.uiManager.addChartData(stats.population, stats.avgEnergy);
    }
  }

  private updateResources(): void {
    const resources = this.world.simulator.resources;
    const currentIds = new Set<string>();

    for (const resource of resources) {
      currentIds.add(resource.id);
      let sprite = this.resourceSprites.get(resource.id);

      if (!sprite) {
        sprite = this.createResourceSprite(resource);
        this.resourceSprites.set(resource.id, sprite);
      }

      sprite.sprite.x = resource.x;
      sprite.sprite.y = resource.y;
      sprite.glow.x = resource.x;
      sprite.glow.y = resource.y;
    }

    for (const [id, sprite] of this.resourceSprites) {
      if (!currentIds.has(id)) {
        this.resourceLayer.removeChild(sprite.sprite);
        this.resourceLayer.removeChild(sprite.glow);
        this.graphicsPool.release(sprite.sprite);
        this.graphicsPool.release(sprite.glow);
        this.resourceSprites.delete(id);
      }
    }
  }

  private createResourceSprite(resource: Resource): ResourceSprite {
    const sprite = this.graphicsPool.acquire();
    const glow = this.graphicsPool.acquire();

    const colors: Record<string, { fill: number; glow: number }> = {
      plant: { fill: 0x4ade80, glow: 0x22c55e },
      mineral: { fill: 0xfbbf24, glow: 0xf59e0b },
      water: { fill: 0x38bdf8, glow: 0x0ea5e9 },
    };

    const color = colors[resource.type];
    const size = this.world.cellSize * 0.8;

    glow.clear();
    glow.beginFill(color.glow, 0.3);
    glow.drawCircle(0, 0, size * 0.8);
    glow.endFill();

    sprite.clear();
    sprite.beginFill(color.fill, 0.9);
    sprite.drawRoundedRect(-size / 2, -size / 2, size, size, 2);
    sprite.endFill();

    this.resourceLayer.addChild(glow);
    this.resourceLayer.addChild(sprite);

    return { sprite, glow };
  }

  private updateCreatures(): void {
    const creatures = this.world.simulator.creatures;
    const currentIds = new Set<string>();

    for (const creature of creatures) {
      if (!creature.isAlive) continue;
      currentIds.add(creature.id);

      let sprite = this.creatureSprites.get(creature.id);
      if (!sprite) {
        sprite = this.createCreatureSprite(creature);
        this.creatureSprites.set(creature.id, sprite);
      }

      this.updateCreaturePosition(creature, sprite);
      this.updateCreatureTrail(creature, sprite);

      if (sprite.isNew) {
        sprite.scaleAnim += 0.1;
        if (sprite.scaleAnim >= 1) {
          sprite.scaleAnim = 1;
          sprite.isNew = false;
        }
        sprite.container.scale.set(sprite.scaleAnim);
      }
    }

    for (const [id, sprite] of this.creatureSprites) {
      if (!currentIds.has(id)) {
        this.creatureLayer.removeChild(sprite.container);
        for (const trail of sprite.trails) {
          this.trailPool.release(trail);
        }
        this.graphicsPool.release(sprite.body);
        this.creatureSprites.delete(id);
      }
    }
  }

  private createCreatureSprite(creature: Creature): CreatureSprite {
    const container = new PIXI.Container();
    const body = this.graphicsPool.acquire();
    const trails: PIXI.Graphics[] = [];

    for (let i = 0; i < 10; i++) {
      const trail = this.trailPool.acquire();
      trails.push(trail);
      container.addChild(trail);
    }

    container.addChild(body);
    this.creatureLayer.addChild(container);

    const color = new PIXI.Color(creature.getColorHsl());
    const size = 8;

    body.clear();
    body.beginFill(color.toNumber(), 0.95);
    body.lineStyle(1, 0xffffff, 0.3);
    this.drawRoundedTriangle(body, size);
    body.endFill();

    container.x = creature.x;
    container.y = creature.y;
    container.scale.set(0);

    return {
      container,
      body,
      trails,
      scaleAnim: 0,
      isNew: true,
    };
  }

  private drawRoundedTriangle(g: PIXI.Graphics, size: number): void {
    const r = size * 0.3;
    const h = size * 1.2;
    const w = size;

    g.moveTo(0, -h / 2 + r);
    g.quadraticCurveTo(0, -h / 2, r, -h / 2 + r * 0.5);
    g.lineTo(w / 2 - r * 0.5, h / 2 - r);
    g.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    g.lineTo(-w / 2 + r, h / 2);
    g.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r * 0.5, h / 2 - r);
    g.closePath();
  }

  private updateCreaturePosition(creature: Creature, sprite: CreatureSprite): void {
    sprite.container.x = creature.x;
    sprite.container.y = creature.y;

    const angle = Math.atan2(creature.vy, creature.vx) + Math.PI / 2;
    sprite.body.rotation = angle;

    const energyRatio = Math.min(creature.energy / 150, 1);
    sprite.body.alpha = 0.5 + energyRatio * 0.5;
  }

  private updateCreatureTrail(creature: Creature, sprite: CreatureSprite): void {
    const color = new PIXI.Color(creature.getColorHsl());
    const trailData = creature.trail;

    for (let i = 0; i < sprite.trails.length; i++) {
      const trail = sprite.trails[i];
      trail.clear();

      if (i < trailData.length) {
        const point = trailData[i];
        const alpha = point.alpha * 0.6;
        const size = 4 * point.alpha;

        if (size > 0.5) {
          trail.beginFill(color.toNumber(), alpha);
          trail.drawCircle(point.x - creature.x, point.y - creature.y, size);
          trail.endFill();
        }
      }
    }
  }

  private updateBattleEffects(): void {
    const effects = this.world.simulator.collectBattleEffects();

    for (const effect of effects) {
      const circle = this.graphicsPool.acquire();
      this.effectLayer.addChild(circle);

      this.battleEffectSprites.push({
        circle,
        duration: effect.duration,
        maxDuration: effect.maxDuration,
      });

      circle.x = effect.x;
      circle.y = effect.y;
    }

    for (let i = this.battleEffectSprites.length - 1; i >= 0; i--) {
      const effect = this.battleEffectSprites[i];
      effect.duration -= this.app.ticker.deltaTime;

      const alpha = effect.duration / effect.maxDuration;
      const size = 15 * (1 - alpha * 0.5);

      effect.circle.clear();
      effect.circle.lineStyle(2, 0xef4444, alpha);
      effect.circle.drawCircle(0, 0, size);

      if (Math.floor(effect.duration / 4) % 2 === 0) {
        effect.circle.beginFill(0xef4444, alpha * 0.3);
        effect.circle.drawCircle(0, 0, size * 0.7);
        effect.circle.endFill();
      }

      if (effect.duration <= 0) {
        this.effectLayer.removeChild(effect.circle);
        this.graphicsPool.release(effect.circle);
        this.battleEffectSprites.splice(i, 1);
      }
    }
  }

  private renderBattleEffects(): void {
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new EcosystemApp('app');
});
