import * as PIXI from 'pixi.js';
import {
  TileType,
  Tile,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  VISION_RADIUS,
  TRAP_VISION_RADIUS,
  Position
} from './types';
import { ParticleSystem } from './ParticleSystem';
import { PlayerController } from './player/PlayerController';

export class GameRenderer {
  private app: PIXI.Application;
  private mapContainer: PIXI.Container;
  private fogContainer: PIXI.Container;
  private particleContainer: PIXI.Container;
  private playerContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  private trapOverlayContainer: PIXI.Container;

  private tileSprites: PIXI.Sprite[][] = [];
  private fogSprites: PIXI.Graphics[][] = [];
  private trapOverlays: Map<string, PIXI.Graphics> = new Map();
  private particleSprites: Map<number, PIXI.Graphics> = new Map();
  private playerSprite: PIXI.Container;
  private playerBody: PIXI.Graphics;

  private screenShake: { x: number; y: number; intensity: number; duration: number } = {
    x: 0,
    y: 0,
    intensity: 0,
    duration: 0
  };

  private damageFlash: { alpha: number; duration: number } = { alpha: 0, duration: 0 };
  private damageVignette: PIXI.Graphics;

  private trapFlashTimers: Map<string, { timer: number; cracks: boolean }> = new Map();

  private camera: { x: number; y: number } = { x: 0, y: 0 };
  private scale: number = 2;

  private wallTextures: PIXI.Texture[] = [];
  private floorTextures: PIXI.Texture[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;

    this.mapContainer = new PIXI.Container();
    this.fogContainer = new PIXI.Container();
    this.trapOverlayContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();
    this.playerContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();

    this.app.stage.addChild(this.mapContainer);
    this.app.stage.addChild(this.trapOverlayContainer);
    this.app.stage.addChild(this.fogContainer);
    this.app.stage.addChild(this.particleContainer);
    this.app.stage.addChild(this.playerContainer);
    this.app.stage.addChild(this.effectsContainer);

    this.playerSprite = new PIXI.Container();
    this.playerBody = new PIXI.Graphics();
    this.playerSprite.addChild(this.playerBody);
    this.playerContainer.addChild(this.playerSprite);

    this.damageVignette = new PIXI.Graphics();
    this.effectsContainer.addChild(this.damageVignette);

    this.createTextures();
    this.resize();
  }

  private createTextures(): void {
    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      for (let j = 0; j < 20; j++) {
        const px = Math.floor(Math.random() * TILE_SIZE);
        const py = Math.floor(Math.random() * TILE_SIZE);
        const shade = 20 + Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${shade + 10}, ${shade + 15}, ${shade + 25})`;
        ctx.fillRect(px, py, 2, 2);
      }

      const texture = PIXI.Texture.from(canvas);
      this.wallTextures.push(texture);
    }

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#2d3548';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      for (let j = 0; j < 15; j++) {
        const px = Math.floor(Math.random() * TILE_SIZE);
        const py = Math.floor(Math.random() * TILE_SIZE);
        const mossAlpha = 0.1 + Math.random() * 0.3;
        ctx.fillStyle = `rgba(80, 180, 200, ${mossAlpha})`;
        ctx.fillRect(px, py, 2, 1);
      }

      const texture = PIXI.Texture.from(canvas);
      this.floorTextures.push(texture);
    }
  }

  initMap(map: Tile[][]): void {
    this.mapContainer.removeChildren();
    this.fogContainer.removeChildren();
    this.trapOverlayContainer.removeChildren();
    this.tileSprites = [];
    this.fogSprites = [];
    this.trapOverlays.clear();
    this.trapFlashTimers.clear();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.tileSprites[y] = [];
      this.fogSprites[y] = [];

      for (let x = 0; x < MAP_WIDTH; x++) {
        const sprite = new PIXI.Sprite();
        sprite.x = x * TILE_SIZE;
        sprite.y = y * TILE_SIZE;
        this.mapContainer.addChild(sprite);
        this.tileSprites[y][x] = sprite;

        const fog = new PIXI.Graphics();
        fog.x = x * TILE_SIZE;
        fog.y = y * TILE_SIZE;
        this.fogContainer.addChild(fog);
        this.fogSprites[y][x] = fog;
      }
    }

    this.updateMapTiles(map);
    this.updateFog(map);
  }

  updateMapTiles(map: Tile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const sprite = this.tileSprites[y][x];

        if (tile.type === TileType.WALL) {
          const texIndex = (x * 7 + y * 13) % this.wallTextures.length;
          sprite.texture = this.wallTextures[texIndex];
          sprite.tint = 0xffffff;
        } else {
          const texIndex = (x * 5 + y * 11) % this.floorTextures.length;
          sprite.texture = this.floorTextures[texIndex];
          sprite.tint = 0xffffff;
        }
      }
    }
  }

  updateFog(map: Tile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const fog = this.fogSprites[y][x];

        fog.clear();

        if (!tile.explored) {
          fog.beginFill(0x000000, 1);
          fog.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
          fog.endFill();
        } else if (!tile.visible) {
          fog.beginFill(0x000000, 0.55);
          fog.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
          fog.endFill();
        } else {
          const distFactor = this.getVisibilityFactor(x, y);
          if (distFactor < 1) {
            fog.beginFill(0x000000, (1 - distFactor) * 0.3);
            fog.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            fog.endFill();
          }
        }
      }
    }
  }

  private getVisibilityFactor(x: number, y: number): number {
    const centerX = MAP_WIDTH / 2;
    const centerY = MAP_HEIGHT / 2;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
    return Math.max(0, 1 - dist / maxDist * 0.3);
  }

  updatePlayer(player: PlayerController): void {
    const pixelPos = player.getPixelPosition();
    const bobOffset = player.getBobOffset();

    this.playerSprite.x = pixelPos.x + TILE_SIZE / 2;
    this.playerSprite.y = pixelPos.y + TILE_SIZE / 2 + bobOffset;

    this.playerBody.clear();
    this.playerBody.beginFill(0x44cc88);
    this.playerBody.drawRect(-5, -6, 10, 12);
    this.playerBody.endFill();

    this.playerBody.beginFill(0x88eebb);
    this.playerBody.drawRect(-4, -8, 8, 4);
    this.playerBody.endFill();

    this.playerBody.beginFill(0xffffff);
    this.playerBody.drawRect(-3, -7, 2, 2);
    this.playerBody.drawRect(1, -7, 2, 2);
    this.playerBody.endFill();
  }

  updateParticles(particleSystem: ParticleSystem): void {
    const particles = particleSystem.getParticles();
    const usedIds = new Set<number>();

    for (let i = 0; i < particles.length; i++) {
      usedIds.add(i);

      let sprite = this.particleSprites.get(i);
      if (!sprite) {
        sprite = new PIXI.Graphics();
        this.particleContainer.addChild(sprite);
        this.particleSprites.set(i, sprite);
      }

      const p = particles[i];
      const alpha = p.life / p.maxLife;

      sprite.clear();
      sprite.beginFill(p.color, alpha);
      sprite.drawRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      sprite.endFill();
    }

    for (const [id, sprite] of this.particleSprites) {
      if (!usedIds.has(id)) {
        this.particleContainer.removeChild(sprite);
        this.particleSprites.delete(id);
      }
    }
  }

  updateCamera(playerPos: Position): void {
    const viewWidth = this.app.screen.width;
    const viewHeight = this.app.screen.height;

    const targetX = playerPos.x * TILE_SIZE + TILE_SIZE / 2 - viewWidth / (2 * this.scale);
    const targetY = playerPos.y * TILE_SIZE + TILE_SIZE / 2 - viewHeight / (2 * this.scale);

    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;

    const maxX = MAP_WIDTH * TILE_SIZE - viewWidth / this.scale;
    const maxY = MAP_HEIGHT * TILE_SIZE - viewHeight / this.scale;
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));

    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake.duration > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
      shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
    }

    this.mapContainer.x = -this.camera.x * this.scale + shakeX;
    this.mapContainer.y = -this.camera.y * this.scale + shakeY;
    this.mapContainer.scale.set(this.scale);

    this.trapOverlayContainer.x = -this.camera.x * this.scale + shakeX;
    this.trapOverlayContainer.y = -this.camera.y * this.scale + shakeY;
    this.trapOverlayContainer.scale.set(this.scale);

    this.fogContainer.x = -this.camera.x * this.scale + shakeX;
    this.fogContainer.y = -this.camera.y * this.scale + shakeY;
    this.fogContainer.scale.set(this.scale);

    this.particleContainer.x = -this.camera.x * this.scale + shakeX;
    this.particleContainer.y = -this.camera.y * this.scale + shakeY;
    this.particleContainer.scale.set(this.scale);

    this.playerContainer.x = -this.camera.x * this.scale + shakeX;
    this.playerContainer.y = -this.camera.y * this.scale + shakeY;
    this.playerContainer.scale.set(this.scale);
  }

  triggerScreenShake(intensity: number, duration: number): void {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
  }

  triggerDamageFlash(duration: number = 0.3): void {
    this.damageFlash.alpha = 0.8;
    this.damageFlash.duration = duration;
  }

  addTrapFlash(x: number, y: number): void {
    this.trapFlashTimers.set(`${x},${y}`, { timer: 0.8, cracks: true });

    const overlay = new PIXI.Graphics();
    overlay.x = x * TILE_SIZE;
    overlay.y = y * TILE_SIZE;
    this.trapOverlayContainer.addChild(overlay);
    this.trapOverlays.set(`${x},${y}`, overlay);
  }

  update(deltaTime: number, map: Tile[][], playerPos: Position): void {
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      this.screenShake.intensity *= 0.92;
    }

    if (this.damageFlash.duration > 0) {
      this.damageFlash.duration -= deltaTime;
      this.damageFlash.alpha = Math.max(0, this.damageFlash.alpha - deltaTime * 2);
      this.updateDamageVignette();
    }

    for (const [key, data] of this.trapFlashTimers) {
      data.timer -= deltaTime;
      if (data.timer <= 0) {
        this.trapFlashTimers.delete(key);
        const overlay = this.trapOverlays.get(key);
        if (overlay) {
          this.trapOverlayContainer.removeChild(overlay);
          this.trapOverlays.delete(key);
        }
      } else {
        const [sx, sy] = key.split(',').map(Number);
        const overlay = this.trapOverlays.get(key);
        if (overlay) {
          this.drawTrapCracks(overlay, data.timer);
        }
      }
    }

    this.updateTrapHighlights(map, playerPos);
    this.updateExitGlow(map);
    this.updateResourceGlow(map);
  }

  private updateDamageVignette(): void {
    this.damageVignette.clear();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    const gradient = this.damageVignette;

    const alpha = this.damageFlash.alpha;
    const borderSize = Math.min(w, h) * 0.18;

    gradient.beginFill(0xff0000, 0);
    gradient.drawRect(0, 0, w, h);
    gradient.endFill();

    gradient.lineStyle(0);
    gradient.beginFill(0xff0000, alpha * 0.6);
    gradient.drawRect(0, 0, w, borderSize);
    gradient.drawRect(0, h - borderSize, w, borderSize);
    gradient.drawRect(0, 0, borderSize, h);
    gradient.drawRect(w - borderSize, 0, borderSize, h);
    gradient.endFill();

    if (alpha > 0.3) {
      gradient.beginFill(0xff3333, (alpha - 0.3) * 0.3);
      gradient.drawRect(0, 0, w, h);
      gradient.endFill();
    }
  }

  private drawTrapCracks(graphics: PIXI.Graphics, timer: number): void {
    graphics.clear();

    const progress = 1 - timer / 0.8;
    const flashIntensity = Math.sin(timer * 25) * 0.5 + 0.5;

    graphics.beginFill(0xff3333, flashIntensity * 0.7);
    graphics.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.endFill();

    if (progress > 0.1) {
      const crackAlpha = Math.min(1, progress * 2);
      graphics.lineStyle(1.5, 0x000000, crackAlpha);

      graphics.moveTo(TILE_SIZE * 0.2, 0);
      graphics.lineTo(TILE_SIZE * 0.35, TILE_SIZE * 0.4);
      graphics.lineTo(TILE_SIZE * 0.25, TILE_SIZE * 0.6);
      graphics.lineTo(TILE_SIZE * 0.45, TILE_SIZE);

      graphics.moveTo(TILE_SIZE * 0.8, 0);
      graphics.lineTo(TILE_SIZE * 0.65, TILE_SIZE * 0.3);
      graphics.lineTo(TILE_SIZE * 0.85, TILE_SIZE * 0.55);
      graphics.lineTo(TILE_SIZE * 0.55, TILE_SIZE);

      graphics.moveTo(0, TILE_SIZE * 0.7);
      graphics.lineTo(TILE_SIZE * 0.4, TILE_SIZE * 0.5);
      graphics.lineTo(TILE_SIZE, TILE_SIZE * 0.65);

      graphics.moveTo(TILE_SIZE * 0.1, TILE_SIZE * 0.1);
      graphics.lineTo(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
    }

    if (progress > 0.5) {
      const pieceAlpha = (progress - 0.5) * 2;
      graphics.lineStyle(0);
      graphics.beginFill(0x1a1a2e, pieceAlpha * 0.8);
      graphics.drawRect(TILE_SIZE * 0.1, TILE_SIZE * 0.1, TILE_SIZE * 0.25, TILE_SIZE * 0.2);
      graphics.drawRect(TILE_SIZE * 0.6, TILE_SIZE * 0.3, TILE_SIZE * 0.25, TILE_SIZE * 0.25);
      graphics.drawRect(TILE_SIZE * 0.2, TILE_SIZE * 0.6, TILE_SIZE * 0.3, TILE_SIZE * 0.2);
      graphics.endFill();
    }
  }

  private updateTrapHighlights(map: Tile[][], playerPos: Position): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const sprite = this.tileSprites[y][x];

        if (tile.type === TileType.TRAP && tile.visible && !tile.trapTriggered) {
          const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);

          if (dist <= TRAP_VISION_RADIUS) {
            const flashTimer = this.trapFlashTimers.get(`${x},${y}`);
            if (flashTimer !== undefined) {
              const flashIntensity = Math.sin(flashTimer.timer * 25) * 0.5 + 0.5;
              const r = 1;
              const g = flashIntensity * 0.3;
              const b = flashIntensity * 0.3;
              sprite.tint = PIXI.utils.rgb2hex([r, g, b]);
            } else {
              const distFactor = 1 - dist / (TRAP_VISION_RADIUS + 1);
              sprite.tint = PIXI.utils.rgb2hex([1, 0.4 + distFactor * 0.2, 0.4 + distFactor * 0.2]);
            }
          } else {
            sprite.tint = 0xffffff;
          }
        } else if (tile.type === TileType.TRAP && tile.trapTriggered) {
          sprite.tint = 0x553333;
        } else if (tile.type !== TileType.WALL) {
          sprite.tint = 0xffffff;
        }
      }
    }
  }

  private updateExitGlow(map: Tile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        if (tile.type === TileType.EXIT && tile.visible) {
          const sprite = this.tileSprites[y][x];
          const time = performance.now() / 500;
          const glow = Math.sin(time) * 0.3 + 0.7;
          sprite.tint = PIXI.utils.rgb2hex([glow * 0.5, glow, glow * 1.2]);
        }
      }
    }
  }

  private updateResourceGlow(map: Tile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        if (tile.visible && (tile.type === TileType.CRYSTAL || tile.type === TileType.ORE)) {
          const sprite = this.tileSprites[y][x];
          const time = performance.now() / 400 + x * 0.5 + y * 0.3;
          const glow = Math.sin(time) * 0.2 + 0.8;

          if (tile.type === TileType.CRYSTAL) {
            sprite.tint = PIXI.utils.rgb2hex([glow * 0.6, glow, glow * 1.2]);
          } else {
            sprite.tint = PIXI.utils.rgb2hex([glow * 1.2, glow * 0.8, glow * 0.4]);
          }
        }
      }
    }
  }

  resize(): void {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    if (containerWidth < 1024) {
      const mapPixelWidth = MAP_WIDTH * TILE_SIZE;
      const mapPixelHeight = MAP_HEIGHT * TILE_SIZE;

      const scaleX = containerWidth / mapPixelWidth;
      const scaleY = containerHeight / mapPixelHeight;

      this.scale = Math.min(scaleX, scaleY);
    } else {
      this.scale = 2;
    }

    this.updateDamageVignette();
  }

  getScale(): number {
    return this.scale;
  }

  getPlayerContainer(): PIXI.Container {
    return this.playerContainer;
  }

  getEffectsContainer(): PIXI.Container {
    return this.effectsContainer;
  }
}
