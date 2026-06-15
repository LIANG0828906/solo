import Phaser from 'phaser';

export type TileType = 'forest' | 'stone' | 'farm' | 'ground' | 'water';
export type BuildingType = 'lumbermill' | 'quarry' | 'farm' | 'port' | null;
export type WeatherType = 'sunny' | 'cloudy' | 'rainy';

export interface Tile {
  type: TileType;
  building: BuildingType;
  buildingLevel: number;
  resourceAmount: number;
  maxResource: number;
  regenRate: number;
  explored: boolean;
  islandId: number;
}

export interface Resources {
  wood: number;
  stone: number;
  grain: number;
  gold: number;
}

export interface ShipStats {
  capacity: number;
  speed: number;
  defense: number;
  level: number;
}

const GRID_SIZE = 5;
const TILE_SIZE = 128;
const TOTAL_PARTICLES = 200;

export default class GameScene extends Phaser.Scene {
  private tiles: Tile[][] = [];
  private tileSprites: Phaser.GameObjects.Sprite[][] = [];
  private buildingSprites: (Phaser.GameObjects.Sprite | null)[][] = [];
  private buildingLights: (Phaser.GameObjects.Graphics | null)[][] = [];
  private fogSprites: Phaser.GameObjects.Graphics[][] = [];

  private shipSprite!: Phaser.GameObjects.Sprite;
  private shipGlow!: Phaser.GameObjects.Graphics;
  private shipX: number = 2;
  private shipY: number = 2;
  private isMoving: boolean = false;

  private resources: Resources = { wood: 20, stone: 10, grain: 15, gold: 50 };
  private shipStats: ShipStats = { capacity: 100, speed: 1, defense: 1, level: 1 };

  private weather: WeatherType = 'sunny';
  private weatherTimer: number = 0;
  private weatherDuration: number = 180;

  private dayNightTimer: number = 0;
  private dayNightDuration: number = 60;
  private isNight: boolean = false;
  private nightOverlay!: Phaser.GameObjects.Graphics;
  private rainSprites: Phaser.GameObjects.Sprite[] = [];
  private particlePool: Phaser.GameObjects.Sprite[] = [];

  private skyTween: Phaser.Tweens.Tween | null = null;
  private skyColor: number = 0x87ceeb;

  private selectedBuilding: BuildingType = null;

  private islandCounter: number = 0;

  private visionMaskSprite: Phaser.GameObjects.Sprite | null = null;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1e3a5f');

    this.generateIslands();
    this.createTileSprites();
    this.createBuildingSprites();
    this.createFogSprites();
    this.createShip();
    this.createNightOverlay();
    this.createParticlePool();

    this.setupInput();
    this.setupEventListeners();

    this.weatherTimer = this.weatherDuration * 0.3;
    this.dayNightTimer = this.dayNightDuration * 0.25;

    this.updateUI();
  }

  private generateIslands(): void {
    const startTime = performance.now();

    this.tiles = [];

    const islandPositions = this.generateIslandPositions();

    for (let y = 0; y < GRID_SIZE; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const islandInfo = islandPositions.find(i => i.x === x && i.y === y);
        let type: TileType = 'water';
        let islandId = -1;

        if (islandInfo) {
          islandId = islandInfo.id;
          const rand = Math.random();
          if (rand < 0.25) type = 'forest';
          else if (rand < 0.45) type = 'stone';
          else if (rand < 0.65) type = 'farm';
          else type = 'ground';
        }

        this.tiles[y][x] = {
          type,
          building: null,
          buildingLevel: 0,
          resourceAmount: type === 'forest' ? 50 : type === 'stone' ? 30 : type === 'farm' ? 80 : 0,
          maxResource: type === 'forest' ? 50 : type === 'stone' ? 30 : type === 'farm' ? 80 : 0,
          regenRate: type === 'forest' ? 0.1 : type === 'stone' ? 0.05 : type === 'farm' ? 0.2 : 0,
          explored: false,
          islandId
        };
      }
    }

    this.tiles[2][2].type = 'ground';
    this.tiles[2][2].explored = true;
    this.tiles[2][2].islandId = 0;
    this.exploreAround(2, 2);

    const elapsed = performance.now() - startTime;
    console.log(`岛屿生成耗时: ${elapsed.toFixed(2)}ms`);
  }

  private generateIslandPositions(): Array<{ x: number; y: number; id: number }> {
    const positions: Array<{ x: number; y: number; id: number }> = [];
    let currentIslandId = 0;

    const islands = [
      { centerX: 2, centerY: 2, size: 3 },
      { centerX: 0, centerY: 0, size: 2 },
      { centerX: 4, centerY: 0, size: 2 },
      { centerX: 0, centerY: 4, size: 2 },
      { centerX: 4, centerY: 4, size: 2 }
    ];

    islands.forEach(island => {
      const offsets = this.getIslandShape(island.size);
      offsets.forEach(offset => {
        const x = island.centerX + offset.dx;
        const y = island.centerY + offset.dy;
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          const existing = positions.find(p => p.x === x && p.y === y);
          if (!existing) {
            positions.push({ x, y, id: currentIslandId });
          }
        }
      });
      currentIslandId++;
    });

    return positions;
  }

  private getIslandShape(size: number): Array<{ dx: number; dy: number }> {
    const offsets: Array<{ dx: number; dy: number }> = [];
    const halfSize = Math.floor(size / 2);

    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const noise = (Math.sin(dx * 2 + dy * 3) + Math.cos(dx * 1.5 - dy * 2)) * 0.3;
        if (distance + noise <= halfSize + 0.3) {
          offsets.push({ dx, dy });
        }
      }
    }

    return offsets;
  }

  private exploreAround(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          this.tiles[ny][nx].explored = true;
        }
      }
    }
  }

  private createTileSprites(): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    this.tileSprites = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tiles[y][x];
        const textureKey = this.getTileTextureKey(tile.type);
        const sprite = this.add.sprite(
          offsetX + x * TILE_SIZE + TILE_SIZE / 2,
          offsetY + y * TILE_SIZE + TILE_SIZE / 2,
          textureKey
        );
        sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
        sprite.setInteractive({ useHandCursor: true });
        sprite.setData('gridX', x);
        sprite.setData('gridY', y);
        this.tileSprites[y][x] = sprite;
      }
    }
  }

  private getTileTextureKey(type: TileType): string {
    switch (type) {
      case 'forest': return 'tile_forest';
      case 'stone': return 'tile_stone';
      case 'farm': return 'tile_farm';
      case 'ground': return 'tile_ground';
      case 'water': return 'tile_water';
      default: return 'tile_water';
    }
  }

  private createBuildingSprites(): void {
    this.buildingSprites = [];
    this.buildingLights = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.buildingSprites[y] = [];
      this.buildingLights[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.buildingSprites[y][x] = null;
        this.buildingLights[y][x] = null;
      }
    }
  }

  private createFogSprites(): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    this.fogSprites = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.fogSprites[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const fog = this.add.graphics();
        fog.fillStyle(0x0a0a1a, 0.9);
        fog.fillRect(
          offsetX + x * TILE_SIZE,
          offsetY + y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
        fog.setVisible(!this.tiles[y][x].explored);
        this.fogSprites[y][x] = fog;
      }
    }
  }

  private createShip(): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    this.shipGlow = this.add.graphics();
    this.shipGlow.fillStyle(0x00ffff, 0);
    this.shipGlow.fillCircle(0, 0, 50);
    this.shipGlow.setDepth(9);

    this.shipSprite = this.add.sprite(
      offsetX + this.shipX * TILE_SIZE + TILE_SIZE / 2,
      offsetY + this.shipY * TILE_SIZE + TILE_SIZE / 2,
      'ship'
    );
    this.shipSprite.setDisplaySize(64, 42);
    this.shipSprite.setDepth(10);
    this.shipSprite.setInteractive({ useHandCursor: true });

    this.updateShipGlowPosition();
  }

  private updateShipGlowPosition(): void {
    this.shipGlow.setPosition(this.shipSprite.x, this.shipSprite.y);
  }

  private createNightOverlay(): void {
    this.nightOverlay = this.add.graphics();
    this.nightOverlay.setDepth(5);
    this.updateNightOverlay();
  }

  private createParticlePool(): void {
    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const sprite = this.add.sprite(0, 0, 'tile_stone');
      sprite.setDisplaySize(4, 4);
      sprite.setVisible(false);
      sprite.setDepth(20);
      this.particlePool.push(sprite);
    }
  }

  private getParticleFromPool(): Phaser.GameObjects.Sprite | null {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop()!;
    }
    return null;
  }

  private returnParticleToPool(sprite: Phaser.GameObjects.Sprite): void {
    sprite.setVisible(false);
    this.tweens.killTweensOf(sprite);
    this.particlePool.push(sprite);
  }

  private setupInput(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        this.tileSprites[y][x].on('pointerdown', () => {
          this.onTileClick(x, y);
        });
      }
    }

    this.shipSprite.on('pointerdown', () => {
      this.showMoveTargets();
    });
  }

  private setupEventListeners(): void {
    this.events.on('buildBuilding', (type: BuildingType) => {
      this.selectedBuilding = type;
      this.showBuildTargets();
    });

    this.events.on('upgradeShip', () => {
      this.upgradeShip();
    });

    this.events.on('getState', () => {
      this.updateUI();
    });
  }

  private onTileClick(x: number, y: number): void {
    if (this.selectedBuilding) {
      this.tryBuild(x, y, this.selectedBuilding);
      this.selectedBuilding = null;
      this.clearHighlights();
      return;
    }

    if (this.isAdjacent(x, y, this.shipX, this.shipY)) {
      this.moveShip(x, y);
    }
  }

  private showMoveTargets(): void {
    this.clearHighlights();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.isAdjacent(x, y, this.shipX, this.shipY) && this.tiles[y][x].type !== 'water') {
          this.tileSprites[y][x].setTint(0x88ff88);
        }
      }
    }
  }

  private showBuildTargets(): void {
    this.clearHighlights();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.tiles[y][x].type === 'ground' && !this.tiles[y][x].building && this.tiles[y][x].explored) {
          if (this.canAffordBuilding(this.selectedBuilding!)) {
            this.tileSprites[y][x].setTint(0x88ff88);
          } else {
            this.tileSprites[y][x].setTint(0xff8888);
          }
        }
      }
    }
  }

  private clearHighlights(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        this.tileSprites[y][x].clearTint();
      }
    }
  }

  private isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  private moveShip(x: number, y: number): void {
    if (this.isMoving) return;
    if (this.tiles[y][x].type === 'water') return;

    this.isMoving = true;

    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    const targetX = offsetX + x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = offsetY + y * TILE_SIZE + TILE_SIZE / 2;
    const startX = this.shipSprite.x;
    const startY = this.shipSprite.y;

    const duration = 400 / this.shipStats.speed;

    this.tweens.add({
      targets: this.shipSprite,
      x: targetX,
      duration: duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        const progress = tween.progress;
        const linearY = startY + (targetY - startY) * progress;
        const bobOffset = Math.sin(progress * Math.PI * 4) * 6;
        this.shipSprite.y = linearY + bobOffset;
        this.updateShipGlowPosition();
      },
      onComplete: () => {
        this.shipX = x;
        this.shipY = y;
        this.isMoving = false;
        this.exploreAround(x, y);
        this.updateFog();
        this.collectResources(x, y);
        this.clearHighlights();
        this.updateNightOverlay();
        this.updateShipGlowPosition();
      }
    });
  }

  private updateFog(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.tiles[y][x].explored && this.fogSprites[y][x].visible) {
          this.fogSprites[y][x].setAlpha(0.9);
          this.tweens.add({
            targets: this.fogSprites[y][x],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              this.fogSprites[y][x].setVisible(false);
            }
          });
        }
      }
    }
  }

  private collectResources(x: number, y: number): void {
    const tile = this.tiles[y][x];
    let amount = 0;
    let resourceType = '';
    let color = '#ffffff';

    const efficiency = this.getCollectionEfficiency();
    const multiplier = this.getBuildingMultiplier(x, y, tile.type);

    switch (tile.type) {
      case 'forest':
        amount = Math.floor(5 * efficiency * multiplier);
        resourceType = 'wood';
        color = '#8b4513';
        break;
      case 'stone':
        amount = Math.floor(3 * efficiency * multiplier);
        resourceType = 'stone';
        color = '#808080';
        break;
      case 'farm':
        amount = Math.floor(8 * efficiency * multiplier);
        resourceType = 'grain';
        color = '#ffd700';
        break;
      default:
        return;
    }

    const totalResources = this.resources.wood + this.resources.stone + this.resources.grain;

    if (totalResources >= this.shipStats.capacity) {
      this.showCapacityFullPopup();
      return;
    }

    const actualAmount = Math.min(amount, this.shipStats.capacity - totalResources);

    if (actualAmount <= 0) {
      this.showCapacityFullPopup();
      return;
    }

    (this.resources as any)[resourceType] += actualAmount;

    this.showCollectPopup(x, y, `+${actualAmount}`, color);
    this.spawnCollectParticles(x, y, color);
    this.updateUI();
  }

  private getCollectionEfficiency(): number {
    let efficiency = 1;
    if (this.weather === 'rainy') efficiency *= 0.7;
    if (this.isNight) efficiency *= 0.8;
    return efficiency;
  }

  private getBuildingMultiplier(x: number, y: number, tileType: TileType): number {
    let multiplier = 1;

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        const neighbor = this.tiles[ny][nx];
        if (tileType === 'forest' && neighbor.building === 'lumbermill') {
          multiplier = 2;
          break;
        }
        if (tileType === 'stone' && neighbor.building === 'quarry') {
          multiplier = 2;
          break;
        }
      }
    }

    return multiplier;
  }

  private showCollectPopup(gridX: number, gridY: number, text: string, color: string): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    const popup = this.add.text(
      offsetX + gridX * TILE_SIZE + TILE_SIZE / 2,
      offsetY + gridY * TILE_SIZE + TILE_SIZE / 2,
      text,
      {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: color,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    popup.setDepth(30);
    popup.setResolution(2);
    popup.setShadow(2, 2, '#000000', 2, true, true);

    this.tweens.add({
      targets: popup,
      y: popup.y - 80,
      alpha: 0,
      scale: 1.2,
      duration: 1200,
      ease: 'Cubic.Out',
      onComplete: () => {
        popup.destroy();
      }
    });
  }

  private showCapacityFullPopup(): void {
    const popup = this.add.text(
      this.shipSprite.x,
      this.shipSprite.y - 50,
      '船舱已满!',
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ff4444',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    popup.setDepth(30);
    popup.setResolution(2);
    popup.setShadow(2, 2, '#000000', 2, true, true);

    const originalX = popup.x;
    this.tweens.add({
      targets: popup,
      x: {
        getStart: () => originalX,
        getEnd: () => originalX + Phaser.Math.Between(-5, 5)
      },
      yoyo: true,
      repeat: 12,
      duration: 70,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: popup,
      alpha: 0,
      duration: 1500,
      delay: 500,
      ease: 'Quad.In',
      onComplete: () => {
        popup.destroy();
      }
    });
  }

  private spawnCollectParticles(gridX: number, gridY: number, color: string): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;
    const centerX = offsetX + gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = offsetY + gridY * TILE_SIZE + TILE_SIZE / 2;

    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;

    for (let i = 0; i < 10; i++) {
      const sprite = this.getParticleFromPool();
      if (!sprite) break;

      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const distance = 25 + Math.random() * 35;

      sprite.setPosition(centerX, centerY);
      sprite.setVisible(true);
      sprite.setTint(colorNum);
      sprite.setDisplaySize(6, 6);
      sprite.setAlpha(1);
      sprite.setScale(1);

      this.tweens.add({
        targets: sprite,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance - 30,
        alpha: 0,
        scale: 0.3,
        duration: 700 + Math.random() * 300,
        ease: 'Cubic.Out',
        onComplete: () => {
          this.returnParticleToPool(sprite);
        }
      });
    }
  }

  private canAffordBuilding(type: BuildingType): boolean {
    if (!type) return false;
    const costs = this.getBuildingCost(type, 1);
    return this.resources.wood >= costs.wood &&
           this.resources.stone >= costs.stone &&
           this.resources.grain >= costs.grain &&
           this.resources.gold >= costs.gold;
  }

  private getBuildingCost(type: BuildingType, level: number): Resources {
    const baseCosts: Record<string, Resources> = {
      lumbermill: { wood: 20, stone: 5, grain: 0, gold: 10 },
      quarry: { wood: 10, stone: 20, grain: 0, gold: 10 },
      farm: { wood: 15, stone: 10, grain: 0, gold: 15 },
      port: { wood: 30, stone: 30, grain: 10, gold: 50 }
    };

    const base = baseCosts[type!] || { wood: 0, stone: 0, grain: 0, gold: 0 };
    const multiplier = level === 1 ? 1 : level === 2 ? 1.5 : 2;

    return {
      wood: Math.floor(base.wood * multiplier),
      stone: Math.floor(base.stone * multiplier),
      grain: Math.floor(base.grain * multiplier),
      gold: Math.floor(base.gold * multiplier)
    };
  }

  private tryBuild(x: number, y: number, type: BuildingType): void {
    if (!type) return;
    if (this.tiles[y][x].type !== 'ground') return;
    if (this.tiles[y][x].building) return;
    if (!this.tiles[y][x].explored) return;
    if (!this.canAffordBuilding(type)) return;

    const costs = this.getBuildingCost(type, 1);
    this.resources.wood -= costs.wood;
    this.resources.stone -= costs.stone;
    this.resources.grain -= costs.grain;
    this.resources.gold -= costs.gold;

    this.tiles[y][x].building = type;
    this.tiles[y][x].buildingLevel = 1;

    this.createBuildingSprite(x, y, type, 1);
    this.updateUI();
  }

  private createBuildingSprite(x: number, y: number, type: BuildingType, level: number): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    const textureKey = `${type}_${level}`;
    const sprite = this.add.sprite(
      offsetX + x * TILE_SIZE + TILE_SIZE / 2,
      offsetY + y * TILE_SIZE + TILE_SIZE / 2 + 10,
      textureKey
    );
    sprite.setDisplaySize(0, 0);
    sprite.setDepth(8);

    this.buildingSprites[y][x] = sprite;

    this.tweens.add({
      targets: sprite,
      displayWidth: 80,
      displayHeight: 80,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      duration: 450,
      ease: 'Back.Out'
    });

    if (type === 'port') {
      this.createBuildingLight(x, y);
    }
  }

  private createBuildingLight(x: number, y: number): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    const light = this.add.graphics();
    light.setPosition(
      offsetX + x * TILE_SIZE + TILE_SIZE / 2,
      offsetY + y * TILE_SIZE + TILE_SIZE / 2 - 10
    );
    light.setDepth(7);
    light.fillStyle(0xffff00, this.isNight ? 0.6 : 0);
    light.fillCircle(0, 0, 40);
    light.setVisible(true);

    this.buildingLights[y][x] = light;

    if (this.isNight) {
      this.tweens.add({
        targets: light,
        fillAlpha: 0.4,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }

  private updateBuildingLights(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const light = this.buildingLights[y][x];
        if (light) {
          this.tweens.killTweensOf(light);
          if (this.isNight) {
            light.setAlpha(1);
            this.tweens.add({
              targets: light,
              fillAlpha: 0.4,
              duration: 1000,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.InOut'
            });
          } else {
            light.setAlpha(0);
          }
        }
      }
    }
  }

  public upgradeBuilding(x: number, y: number): void {
    const tile = this.tiles[y][x];
    if (!tile.building || tile.buildingLevel >= 3) return;

    const newLevel = tile.buildingLevel + 1;
    const costs = this.getBuildingCost(tile.building, newLevel);

    if (this.resources.wood < costs.wood ||
        this.resources.stone < costs.stone ||
        this.resources.grain < costs.grain ||
        this.resources.gold < costs.gold) {
      return;
    }

    this.resources.wood -= costs.wood;
    this.resources.stone -= costs.stone;
    this.resources.grain -= costs.grain;
    this.resources.gold -= costs.gold;

    tile.buildingLevel = newLevel;

    const sprite = this.buildingSprites[y][x];
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        alpha: 0.2,
        scaleX: 0.6,
        scaleY: 0.6,
        duration: 150,
        yoyo: true,
        repeat: 4,
        ease: 'Quad.InOut',
        onComplete: () => {
          const textureKey = `${tile.building}_${newLevel}`;
          sprite.setTexture(textureKey);
          sprite.setDisplaySize(80, 80);
          sprite.setScale(1);
          sprite.setAlpha(1);
          this.spawnUpgradeParticles(x, y);
        }
      });
    }

    this.updateUI();
  }

  private spawnUpgradeParticles(gridX: number, gridY: number): void {
    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;
    const centerX = offsetX + gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = offsetY + gridY * TILE_SIZE + TILE_SIZE / 2;

    for (let i = 0; i < 20; i++) {
      const sprite = this.getParticleFromPool();
      if (!sprite) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;

      sprite.setPosition(centerX, centerY);
      sprite.setVisible(true);
      sprite.setTint(Phaser.Math.Between(0xffd700, 0xffa500));
      sprite.setDisplaySize(5, 5);
      sprite.setAlpha(1);

      this.tweens.add({
        targets: sprite,
        x: centerX + Math.cos(angle) * speed,
        y: centerY + Math.sin(angle) * speed - 40,
        alpha: 0,
        scale: 0.2,
        rotation: Math.random() * Math.PI * 2,
        duration: 900,
        ease: 'Cubic.Out',
        onComplete: () => {
          this.returnParticleToPool(sprite);
        }
      });
    }
  }

  private upgradeShip(): void {
    const portTile = this.findNearbyPort();
    if (!portTile) return;

    const costs = this.getShipUpgradeCost();
    if (this.resources.wood < costs.wood ||
        this.resources.stone < costs.stone ||
        this.resources.grain < costs.grain ||
        this.resources.gold < costs.gold) {
      return;
    }

    this.resources.wood -= costs.wood;
    this.resources.stone -= costs.stone;
    this.resources.grain -= costs.grain;
    this.resources.gold -= costs.gold;

    const oldCapacity = this.shipStats.capacity;
    const oldSpeed = this.shipStats.speed;
    const oldDefense = this.shipStats.defense;

    this.shipStats.level++;
    this.shipStats.capacity += 50;
    this.shipStats.speed += 0.2;
    this.shipStats.defense += 1;

    this.playShipUpgradeAnimation(oldCapacity, oldSpeed, oldDefense);
    this.updateUI();
  }

  private findNearbyPort(): { x: number; y: number } | null {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.tiles[y][x].building === 'port' &&
            this.isAdjacent(x, y, this.shipX, this.shipY)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  private getShipUpgradeCost(): Resources {
    const level = this.shipStats.level;
    return {
      wood: Math.floor(30 * level),
      stone: Math.floor(20 * level),
      grain: Math.floor(10 * level),
      gold: Math.floor(50 * level)
    };
  }

  private playShipUpgradeAnimation(_oldCapacity: number, _oldSpeed: number, _oldDefense: number): void {
    const originalScale = this.shipSprite.scale;

    this.tweens.add({
      targets: this.shipGlow,
      fillAlpha: 0.8,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.InOut'
    });

    this.tweens.add({
      targets: this.shipSprite,
      scaleX: originalScale * 1.4,
      scaleY: originalScale * 1.4,
      duration: 250,
      yoyo: true,
      repeat: 2,
      ease: 'Elastic.Out'
    });

    for (let i = 0; i < 25; i++) {
      const sprite = this.getParticleFromPool();
      if (!sprite) break;

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 50;

      sprite.setPosition(this.shipSprite.x, this.shipSprite.y);
      sprite.setVisible(true);
      sprite.setTint(Phaser.Math.Between(0x00ffff, 0x0088ff));
      sprite.setDisplaySize(6, 6);
      sprite.setAlpha(1);

      this.tweens.add({
        targets: sprite,
        x: this.shipSprite.x + Math.cos(angle) * distance,
        y: this.shipSprite.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 700,
        ease: 'Cubic.Out',
        onComplete: () => {
          this.returnParticleToPool(sprite);
        }
      });
    }

    this.time.delayedCall(500, () => {
      this.updateShipGlowPosition();
    });
  }

  public exploreNewIsland(): void {
    this.islandCounter++;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!this.tiles[y][x].explored) {
          if (Math.random() < 0.35) {
            this.tiles[y][x].explored = true;
            this.tiles[y][x].islandId = this.islandCounter;

            const rand = Math.random();
            if (rand < 0.25) this.tiles[y][x].type = 'forest';
            else if (rand < 0.45) this.tiles[y][x].type = 'stone';
            else if (rand < 0.65) this.tiles[y][x].type = 'farm';
            else this.tiles[y][x].type = 'ground';

            this.tiles[y][x].resourceAmount =
              this.tiles[y][x].type === 'forest' ? 50 :
              this.tiles[y][x].type === 'stone' ? 30 :
              this.tiles[y][x].type === 'farm' ? 80 : 0;
            this.tiles[y][x].maxResource = this.tiles[y][x].resourceAmount;

            this.tileSprites[y][x].setTexture(this.getTileTextureKey(this.tiles[y][x].type));

            this.fogSprites[y][x].setAlpha(1);
            this.fogSprites[y][x].setVisible(true);
            this.fogSprites[y][x].setScale(1.8);

            this.tweens.add({
              targets: this.fogSprites[y][x],
              alpha: 0,
              scale: 1,
              duration: 900,
              ease: 'Cubic.Out',
              onComplete: () => {
                this.fogSprites[y][x].setVisible(false);
              }
            });
          }
        }
      }
    }
  }

  private updateNightOverlay(): void {
    this.nightOverlay.clear();

    if (this.visionMaskSprite) {
      this.visionMaskSprite.destroy();
      this.visionMaskSprite = null;
    }

    if (!this.isNight) {
      return;
    }

    const offsetX = (1280 - GRID_SIZE * TILE_SIZE) / 2;
    const offsetY = (720 - GRID_SIZE * TILE_SIZE) / 2;

    this.nightOverlay.fillStyle(0x000020, 0.75);
    this.nightOverlay.fillRect(0, 0, 1280, 720);

    const shipPixelX = offsetX + this.shipX * TILE_SIZE + TILE_SIZE / 2;
    const shipPixelY = offsetY + this.shipY * TILE_SIZE + TILE_SIZE / 2;
    const visionRadius = TILE_SIZE * 3;

    const gradientCircle = this.make.graphics();
    for (let r = visionRadius; r > 0; r -= 3) {
      const alpha = 1 - r / visionRadius;
      gradientCircle.fillStyle(0xffffff, alpha);
      gradientCircle.fillCircle(shipPixelX, shipPixelY, r);
    }

    gradientCircle.generateTexture('vision_mask', visionRadius * 2, visionRadius * 2);
    gradientCircle.destroy();

    this.visionMaskSprite = this.add.sprite(shipPixelX, shipPixelY, 'vision_mask');
    this.visionMaskSprite.setDepth(6);

    this.nightOverlay.mask = new Phaser.Display.Masks.BitmapMask(this, this.visionMaskSprite);
  }

  private updateWeather(delta: number): void {
    this.weatherTimer += delta / 1000;

    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.changeWeather();
    }
  }

  private changeWeather(): void {
    const weathers: WeatherType[] = ['sunny', 'cloudy', 'rainy'];
    let newWeather: WeatherType;
    do {
      newWeather = weathers[Math.floor(Math.random() * weathers.length)];
    } while (newWeather === this.weather && weathers.length > 1);

    this.weather = newWeather;

    let targetColor: number;
    switch (newWeather) {
      case 'sunny':
        targetColor = 0x87ceeb;
        break;
      case 'cloudy':
        targetColor = 0x708090;
        break;
      case 'rainy':
        targetColor = 0x4a5568;
        break;
    }

    if (this.skyTween) {
      this.skyTween.stop();
    }

    const fromColor = Phaser.Display.Color.IntegerToRGB(this.skyColor);
    const toColor = Phaser.Display.Color.IntegerToRGB(targetColor);

    this.skyTween = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 2500,
      onUpdate: (tween) => {
        const progress = tween.getValue();
        const r = Math.floor(fromColor.r + (toColor.r - fromColor.r) * progress);
        const g = Math.floor(fromColor.g + (toColor.g - fromColor.g) * progress);
        const b = Math.floor(fromColor.b + (toColor.b - fromColor.b) * progress);
        this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(r, g, b));
      },
      onComplete: () => {
        this.skyColor = targetColor;
      }
    });

    if (newWeather === 'rainy') {
      this.startRain();
    } else {
      this.stopRain();
    }

    this.events.emit('weatherChanged', this.weather);
  }

  private startRain(): void {
    for (let i = 0; i < 80; i++) {
      const sprite = this.getParticleFromPool();
      if (!sprite) break;

      sprite.setPosition(
        Math.random() * 1280,
        Math.random() * 720
      );
      sprite.setVisible(true);
      sprite.setTint(0xaaccff);
      sprite.setDisplaySize(2, 12);
      sprite.setDepth(25);
      sprite.setAlpha(0.7);

      this.rainSprites.push(sprite);

      const startX = sprite.x;

      this.tweens.add({
        targets: sprite,
        y: 800,
        x: startX - 60,
        duration: 700 + Math.random() * 400,
        repeat: -1,
        delay: Math.random() * 1000,
        onRepeat: () => {
          sprite.setPosition(Math.random() * 1280, -20);
          sprite.setAlpha(0.7);
        }
      });
    }
  }

  private stopRain(): void {
    for (const sprite of this.rainSprites) {
      this.returnParticleToPool(sprite);
    }
    this.rainSprites = [];
  }

  private updateDayNight(delta: number): void {
    this.dayNightTimer += delta / 1000;

    if (this.dayNightTimer >= this.dayNightDuration) {
      this.dayNightTimer = 0;
    }

    const nightStart = this.dayNightDuration * 0.6;
    const nightEnd = this.dayNightDuration * 0.9;

    const wasNight = this.isNight;
    this.isNight = this.dayNightTimer >= nightStart && this.dayNightTimer < nightEnd;

    if (wasNight !== this.isNight) {
      this.updateNightOverlay();
      this.updateBuildingLights();
      this.events.emit('dayNightChanged', this.isNight);
    }
  }

  private updateUI(): void {
    this.events.emit('resourcesChanged', { ...this.resources });
    this.events.emit('shipStatsChanged', { ...this.shipStats });
    this.events.emit('tilesUpdated', this.tiles);
    this.events.emit('weatherChanged', this.weather);
    this.events.emit('dayNightChanged', this.isNight);
  }

  update(_time: number, delta: number): void {
    this.updateWeather(delta);
    this.updateDayNight(delta);
    this.updateResourceRegeneration(delta);
  }

  private updateResourceRegeneration(delta: number): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tiles[y][x];
        if (tile.resourceAmount < tile.maxResource && tile.type !== 'ground' && tile.type !== 'water') {
          let regenRate = tile.regenRate;

          if (tile.type === 'farm') {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                if (this.tiles[ny][nx].building === 'farm') {
                  regenRate *= 1.5;
                  break;
                }
              }
            }
          }

          tile.resourceAmount = Math.min(
            tile.maxResource,
            tile.resourceAmount + regenRate * delta / 1000
          );
        }
      }
    }
  }

  public getResources(): Resources {
    return { ...this.resources };
  }

  public getShipStats(): ShipStats {
    return { ...this.shipStats };
  }

  public getTiles(): Tile[][] {
    return this.tiles;
  }

  public getWeather(): WeatherType {
    return this.weather;
  }

  public isNightTime(): boolean {
    return this.isNight;
  }
}
