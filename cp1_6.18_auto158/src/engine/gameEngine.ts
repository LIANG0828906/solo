import {
  Tile,
  ResourceNode,
  BuildingType,
  BUILDING_BLUEPRINTS,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  generateMap,
  generateResourceNodes,
  findSafeSpawnPosition,
  isTileBuildable,
  ResourceType,
} from '../data/worldData';
import { Enemy, updateEnemies, spawnEnemyNearPlayer } from '../ai/enemyAI';
import {
  WorldRenderer,
  Building,
  Projectile,
  Particle,
  PlayerState,
} from '../renderer/worldRenderer';
import { UIController, PlayerResources } from '../ui/uiController';

const SAVE_KEY = 'pixelPioneer_save_v1';
const DAY_DURATION = 120;
const ENEMY_SPAWN_INTERVAL = 10;
const MAX_PARTICLES = 50;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

interface SaveData {
  version: 1;
  timestamp: number;
  player: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    resources: PlayerResources;
  };
  gameTime: number;
  buildings: Building[];
  map: Tile[][];
  resourceNodes: ResourceNode[];
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: WorldRenderer;
  private ui: UIController;

  private map: Tile[][] = [];
  private resourceNodes: ResourceNode[] = [];
  private buildings: Building[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];

  private player: PlayerState & { resources: PlayerResources } = {
    x: 0,
    y: 0,
    health: 100,
    maxHealth: 100,
    resources: { wood: 0, stone: 0, food: 0 },
    isGathering: false,
    gatherTargetId: undefined,
    gatherProgress: 0,
  };

  private gameTime: number = 0;
  private isNight: boolean = false;
  private nightTransition: number = 0;
  private lastEnemySpawn: number = 0;
  private loadFadeAlpha: number = 0;

  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private selectedBuildingType: BuildingType | null = null;

  private lastTime: number = 0;
  private running: boolean = false;
  private rafId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new WorldRenderer(canvas);
    this.ui = new UIController(canvas, {
      onBuildingSelected: (type) => {
        this.selectedBuildingType = type;
      },
      onBuildMenuClosed: () => {
        this.selectedBuildingType = null;
      },
      onInventoryClosed: () => {},
    });

    this.setupInputHandlers();
    this.resizeCanvas();
  }

  private setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);

      if (e.ctrlKey && key === 's') {
        e.preventDefault();
        this.saveGame();
        return;
      }
      if (e.ctrlKey && key === 'l') {
        e.preventDefault();
        this.loadGame();
        return;
      }

      if (key === 'b') {
        this.ui.toggleBuildMenu();
        if (!this.ui.buildMenu.visible) {
          this.selectedBuildingType = null;
        }
      }
      if (key === 'i') {
        this.ui.toggleInventory();
      }
      if (key === 'escape') {
        if (this.ui.inventory.visible) this.ui.toggleInventory();
        if (this.ui.buildMenu.visible) {
          this.ui.toggleBuildMenu();
          this.selectedBuildingType = null;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys.delete(key);
      if (key === 'e') {
        this.player.isGathering = false;
        this.player.gatherProgress = 0;
        this.player.gatherTargetId = undefined;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.ui.setMousePosition(this.mouseX, this.mouseY);
    });

    window.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const handled = this.ui.handleClick(mx, my);
      if (handled) return;

      if (this.selectedBuildingType) {
        const world = this.renderer.screenToWorld(mx, my);
        const tx = Math.floor(world.x / TILE_SIZE);
        const ty = Math.floor(world.y / TILE_SIZE);
        this.tryBuild(tx, ty);
      }
    });

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas() {
    this.renderer.resize();
  }

  init() {
    this.map = generateMap();
    this.resourceNodes = generateResourceNodes(this.map);
    const spawn = findSafeSpawnPosition(this.map);
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.player.health = this.player.maxHealth;
    this.buildings = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.gameTime = 0;
    this.isNight = false;
    this.nightTransition = 0;
    this.lastEnemySpawn = 0;

    this.ui.setResources(this.player.resources);
    this.ui.playerHealth = this.player.health;
    this.ui.playerMaxHealth = this.player.maxHealth;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const deltaTime = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.update(deltaTime);
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private update(deltaTime: number) {
    this.ui.update(deltaTime);

    if (this.loadFadeAlpha > 0) {
      this.loadFadeAlpha = Math.max(0, this.loadFadeAlpha - deltaTime);
      this.ui.loadFadeAlpha = this.loadFadeAlpha;
    }

    this.gameTime += deltaTime;
    this.updateDayNightCycle(deltaTime);

    if (!this.ui.inventory.visible && !this.ui.buildMenu.visible) {
      this.updatePlayer(deltaTime);
    }

    this.updateGathering(deltaTime);

    this.buildings = this.buildings.map((b) => ({
      ...b,
      spawnAnimation: Math.min(1, b.spawnAnimation + deltaTime / 0.3),
    }));

    const onDamage = () => this.damagePlayer(2);
    this.enemies = updateEnemies(
      this.enemies,
      this.player.x,
      this.player.y,
      this.map,
      this.buildings,
      deltaTime,
      onDamage
    );

    this.updateTowers(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateParticles(deltaTime);

    if (this.isNight) {
      this.spawnNightEnemies(deltaTime);
    }

    this.renderer.centerCameraOn(this.player.x, this.player.y);

    this.ui.playerHealth = this.player.health;
    this.ui.setResources(this.player.resources);
    this.ui.isNight = this.isNight;
    this.ui.nightTransition = this.nightTransition;
  }

  private updateDayNightCycle(deltaTime: number) {
    const cyclePos = this.gameTime % DAY_DURATION;
    const wasNight = this.isNight;
    this.isNight = cyclePos >= DAY_DURATION / 2;

    if (!wasNight && this.isNight) {
      this.nightTransition = 0;
    } else if (wasNight && !this.isNight) {
      this.nightTransition = 0.6;
    }

    if (this.isNight) {
      if (cyclePos < DAY_DURATION / 2 + 3) {
        this.nightTransition = Math.min(0.6, (cyclePos - DAY_DURATION / 2) / 3 * 0.6);
      } else {
        this.nightTransition = 0.6;
      }
    } else {
      if (cyclePos < 3 && this.gameTime > 3) {
        this.nightTransition = Math.max(0, 0.6 - cyclePos / 3 * 0.6);
      } else {
        this.nightTransition = 0;
      }
    }
  }

  private updatePlayer(deltaTime: number) {
    const speed = 80 * deltaTime;
    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(2);
      dx /= len;
      dy /= len;
    }

    const newX = this.player.x + dx * speed;
    const newY = this.player.y + dy * speed;

    if (this.canMoveTo(newX, this.player.y)) this.player.x = newX;
    if (this.canMoveTo(this.player.x, newY)) this.player.y = newY;
  }

  private canMoveTo(x: number, y: number): boolean {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
    const tile = this.map[tileY][tileX];
    if (tile.type === 'rock') return false;
    if (tile.occupiedByBuilding) return false;
    return true;
  }

  private updateGathering(deltaTime: number) {
    if (!this.keys.has('e')) {
      this.player.isGathering = false;
      this.player.gatherProgress = 0;
      this.player.gatherTargetId = undefined;
      return;
    }

    let nearestNode: ResourceNode | null = null;
    let nearestDist = Infinity;
    for (const node of this.resourceNodes) {
      if (node.amount <= 0) continue;
      const dx = node.x - this.player.x;
      const dy = node.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 30 && dist < nearestDist) {
        nearestDist = dist;
        nearestNode = node;
      }
    }

    if (!nearestNode) {
      this.player.isGathering = false;
      this.player.gatherProgress = 0;
      this.player.gatherTargetId = undefined;
      return;
    }

    this.player.isGathering = true;
    if (this.player.gatherTargetId !== nearestNode.id) {
      this.player.gatherTargetId = nearestNode.id;
      this.player.gatherProgress = 0;
    }

    this.player.gatherProgress += deltaTime / 1.5;
    if (this.player.gatherProgress >= 1) {
      const resType = nearestNode.type as ResourceType;
      this.player.resources[resType] += 1;
      nearestNode.amount -= 1;
      const tileX = Math.floor(nearestNode.x / TILE_SIZE);
      const tileY = Math.floor(nearestNode.y / TILE_SIZE);
      if (this.map[tileY]?.[tileX]) {
        this.map[tileY][tileX].resourceAmount = nearestNode.amount;
      }
      this.player.gatherProgress = 0;
      if (nearestNode.amount <= 0) {
        this.player.gatherTargetId = undefined;
      }
    }
  }

  private tryBuild(tx: number, ty: number) {
    if (!this.selectedBuildingType) return;
    const bp = BUILDING_BLUEPRINTS[this.selectedBuildingType];
    if (!bp) return;

    if (!isTileBuildable(this.map, tx, ty, this.resourceNodes)) return;

    if (
      this.player.resources.wood < bp.woodCost ||
      this.player.resources.stone < bp.stoneCost ||
      this.player.resources.food < bp.foodCost
    ) {
      return;
    }

    this.player.resources.wood -= bp.woodCost;
    this.player.resources.stone -= bp.stoneCost;
    this.player.resources.food -= bp.foodCost;

    this.map[ty][tx].occupiedByBuilding = true;

    this.buildings.push({
      id: generateId(),
      type: this.selectedBuildingType,
      x: tx,
      y: ty,
      health: bp.maxHealth,
      maxHealth: bp.maxHealth,
      spawnAnimation: 0,
      lastAttackTime: 0,
    });

    this.ui.setResources(this.player.resources);
  }

  private updateTowers(deltaTime: number) {
    const now = this.gameTime;
    for (const tower of this.buildings) {
      if (tower.type !== 'tower') continue;
      const towerX = tower.x * TILE_SIZE + TILE_SIZE / 2;
      const towerY = tower.y * TILE_SIZE + TILE_SIZE / 2;
      const lastAttack = tower.lastAttackTime || 0;
      if (now - lastAttack < 1.5) continue;

      let nearestEnemy: Enemy | null = null;
      let nearestDist = Infinity;
      for (const enemy of this.enemies) {
        const dx = enemy.x - towerX;
        const dy = enemy.y - towerY;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }

      if (nearestEnemy) {
        tower.lastAttackTime = now;
        this.projectiles.push({
          id: generateId(),
          x: towerX,
          y: towerY,
          targetId: nearestEnemy.id,
          targetX: nearestEnemy.x,
          targetY: nearestEnemy.y,
          speed: 3 * TILE_SIZE,
          damage: 15,
        });
      }
    }
  }

  private updateProjectiles(deltaTime: number) {
    const enemyMap = new Map<string, Enemy>();
    for (const e of this.enemies) enemyMap.set(e.id, e);

    this.projectiles = this.projectiles.filter((p) => {
      const target = enemyMap.get(p.targetId);
      const tx = target ? target.x : p.targetX;
      const ty = target ? target.y : p.targetY;

      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        if (target) {
          target.health -= p.damage;
          this.spawnParticles(target.x, target.y, '#f4d35e', 3);
        }
        return false;
      }

      const move = p.speed * deltaTime;
      const ratio = Math.min(move / dist, 1);
      p.x += dx * ratio;
      p.y += dy * ratio;
      return true;
    });
  }

  private updateParticles(deltaTime: number) {
    this.particles = this.particles.filter((p) => {
      p.life -= deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 30 * deltaTime;
      return p.life > 0;
    });
  }

  private spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      this.particles.push({
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        color,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
      });
    }
  }

  private spawnBuildingBreakParticles(building: Building) {
    const bp = BUILDING_BLUEPRINTS[building.type];
    const wx = building.x * TILE_SIZE + TILE_SIZE / 2;
    const wy = building.y * TILE_SIZE + TILE_SIZE / 2;
    for (let i = 0; i < 8; i++) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 50;
      this.particles.push({
        id: generateId(),
        x: wx,
        y: wy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        color: bp.color,
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  private damagePlayer(amount: number) {
    this.player.health = Math.max(0, this.player.health - amount);
    if (this.player.health <= 0) {
      this.player.health = this.player.maxHealth;
      const spawn = findSafeSpawnPosition(this.map);
      this.player.x = spawn.x;
      this.player.y = spawn.y;
      this.enemies = [];
    }
  }

  private spawnNightEnemies(deltaTime: number) {
    if (this.gameTime - this.lastEnemySpawn < ENEMY_SPAWN_INTERVAL) return;
    this.lastEnemySpawn = this.gameTime;

    const rect = this.canvas.getBoundingClientRect();
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const enemy = spawnEnemyNearPlayer(
        this.player.x,
        this.player.y,
        rect.width,
        rect.height,
        this.map
      );
      if (enemy) this.enemies.push(enemy);
    }
  }

  private render() {
    this.renderer.clear();
    this.renderer.renderMap(this.map);
    this.renderer.renderResourceNodes(
      this.resourceNodes,
      this.player.gatherTargetId,
      this.player.gatherProgress
    );
    this.renderer.renderTowerRanges(this.buildings);
    this.renderer.renderBuildings(this.buildings);
    this.renderer.renderEnemies(this.enemies);
    this.renderer.renderPlayer(this.player);
    this.renderer.renderProjectiles(this.projectiles);
    this.renderer.renderParticles(this.particles);

    if (this.selectedBuildingType) {
      const world = this.renderer.screenToWorld(this.mouseX, this.mouseY);
      const tx = Math.floor(world.x / TILE_SIZE);
      const ty = Math.floor(world.y / TILE_SIZE);
      const buildable = isTileBuildable(this.map, tx, ty, this.resourceNodes);
      this.renderer.renderBuildPreview(tx, ty, buildable);
    }

    this.ui.renderNightOverlay();
    this.ui.renderHUD();
    this.ui.renderBuildMenu();
    this.ui.renderInventory();
    this.ui.renderLoadFade();
  }

  saveGame() {
    const data: SaveData = {
      version: 1,
      timestamp: Date.now(),
      player: {
        x: this.player.x,
        y: this.player.y,
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        resources: { ...this.player.resources },
      },
      gameTime: this.gameTime,
      buildings: [...this.buildings],
      map: this.map,
      resourceNodes: [...this.resourceNodes],
    };

    try {
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
      console.log('游戏已保存');
    } catch (e) {
      console.error('保存失败', e);
    }
  }

  loadGame() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) {
        console.log('没有存档');
        return;
      }
      const data: SaveData = JSON.parse(json);
      if (data.version !== 1) return;

      this.player.x = data.player.x;
      this.player.y = data.player.y;
      this.player.health = data.player.health;
      this.player.maxHealth = data.player.maxHealth;
      this.player.resources = { ...data.player.resources };
      this.gameTime = data.gameTime;
      this.buildings = data.buildings.map((b) => ({ ...b, spawnAnimation: 1 }));
      this.map = data.map;
      this.resourceNodes = data.resourceNodes.map((n) => ({ ...n }));
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];

      this.loadFadeAlpha = 1;
      this.ui.loadFadeAlpha = 1;

      this.ui.setResources(this.player.resources);
      this.ui.playerHealth = this.player.health;
      this.ui.playerMaxHealth = this.player.maxHealth;
      console.log('游戏已加载');
    } catch (e) {
      console.error('加载失败', e);
    }
  }
}
