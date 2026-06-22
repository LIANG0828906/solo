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

  private trapFlashTimers: Map<string, { timer: number; cracks: boolean; phase: number }> = new Map();

  private camera: { x: number; y: number } = { x: 0, y: 0 };
  private scale: number = 2;

  private wallTextures: PIXI.Texture[] = [];
  private floorTextures: PIXI.Texture[] = [];

  private readonly EXPLORED_DIM = 0.28;

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
        } else {
          const texIndex = (x * 5 + y * 11) % this.floorTextures.length;
          sprite.texture = this.floorTextures[texIndex];
        }
      }
    }
  }

  updateFog(map: Tile[][]): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const fog = this.fogSprites[y][x];
        const sprite = this.tileSprites[y][x];

        fog.clear();

        if (!tile.explored) {
          sprite.tint = 0x000000;
          fog.beginFill(0x000000, 1);
          fog.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
          fog.endFill();
        } else if (!tile.visible) {
          this.applyExploredTint(tile, sprite);
          fog.beginFill(0x000000, 0.22);
          fog.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
          fog.endFill();
        } else {
          const visFactor = this.getVisibilityFalloff(x, y, map);
          if (visFactor < 1) {
            this.applyVisibleTint(tile, sprite, visFactor);
            fog.beginFill(0x000000, (1 - visFactor) * 0.35);
            fog.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            fog.endFill();
          } else {
            this.applyVisibleTint(tile, sprite, 1);
          }
        }
      }
    }
  }

  private applyExploredTint(tile: Tile, sprite: PIXI.Sprite): void {
    const dim = this.EXPLORED_DIM;

    if (tile.type === TileType.WALL) {
      sprite.tint = PIXI.utils.rgb2hex([0x2a * dim, 0x2a * dim, 0x3e * dim]);
    } else if (tile.type === TileType.TRAP) {
      if (tile.trapTriggered) {
        sprite.tint = PIXI.utils.rgb2hex([0x44 * dim, 0x22 * dim, 0x22 * dim]);
      } else {
        sprite.tint = PIXI.utils.rgb2hex([0x4a * dim, 0x3a * dim, 0x3e * dim]);
      }
    } else if (tile.type === TileType.CRYSTAL && !tile.collected) {
      sprite.tint = PIXI.utils.rgb2hex([0x22 * dim, 0x44 * dim, 0x5a * dim]);
    } else if (tile.type === TileType.ORE && !tile.collected) {
      sprite.tint = PIXI.utils.rgb2hex([0x5a * dim, 0x44 * dim, 0x22 * dim]);
    } else if (tile.type === TileType.EXIT) {
      sprite.tint = PIXI.utils.rgb2hex([0x22 * dim, 0x3a * dim, 0x5a * dim]);
    } else {
      sprite.tint = PIXI.utils.rgb2hex([0x33 * dim, 0x3a * dim, 0x50 * dim]);
    }
  }

  private applyVisibleTint(tile: Tile, sprite: PIXI.Sprite, brightness: number): void {
    const b = Math.max(0.45, brightness);

    if (tile.type === TileType.WALL) {
      sprite.tint = PIXI.utils.rgb2hex([b, b, b]);
    } else if (tile.type === TileType.TRAP && tile.trapTriggered) {
      sprite.tint = 0x553333;
    } else if (tile.type === TileType.CRYSTAL && !tile.collected) {
      const time = performance.now() / 400;
      const glow = (Math.sin(time) * 0.2 + 0.8) * b;
      sprite.tint = PIXI.utils.rgb2hex([glow * 0.6, glow, glow * 1.2]);
    } else if (tile.type === TileType.ORE && !tile.collected) {
      const time = performance.now() / 400;
      const glow = (Math.sin(time) * 0.2 + 0.8) * b;
      sprite.tint = PIXI.utils.rgb2hex([glow * 1.2, glow * 0.8, glow * 0.4]);
    } else if (tile.type === TileType.EXIT) {
      const time = performance.now() / 500;
      const glow = (Math.sin(time) * 0.3 + 0.7) * b;
      sprite.tint = PIXI.utils.rgb2hex([glow * 0.5, glow, glow * 1.2]);
    } else {
      sprite.tint = PIXI.utils.rgb2hex([b, b, b]);
    }
  }

  private getVisibilityFalloff(x: number, y: number, map: Tile[][]): number {
    const playerX = this.findPlayerX(map);
    const playerY = this.findPlayerY(map);
    if (playerX < 0) return 1;

    const dist = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
    if (dist <= VISION_RADIUS * 0.6) return 1;

    const outer = VISION_RADIUS;
    const inner = VISION_RADIUS * 0.6;
    const t = (dist - inner) / (outer - inner);
    return Math.max(0, 1 - t * 0.7);
  }

  private cachedPlayerPos: { x: number; y: number } = { x: -1, y: -1 };

  setCachedPlayerPos(x: number, y: number): void {
    this.cachedPlayerPos = { x, y };
  }

  private findPlayerX(_map: Tile[][]): number {
    return this.cachedPlayerPos.x;
  }

  private findPlayerY(_map: Tile[][]): number {
    return this.cachedPlayerPos.y;
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

    this.camera.x += (targetX - this.camera.x) * 0.15;
    this.camera.y += (targetY - this.camera.y) * 0.15;

    const maxX = MAP_WIDTH * TILE_SIZE - viewWidth / this.scale;
    const maxY = MAP_HEIGHT * TILE_SIZE - viewHeight / this.scale;
    this.camera.x = Math.max(0, Math.min(Math.max(0, maxX), this.camera.x));
    this.camera.y = Math.max(0, Math.min(Math.max(0, maxY), this.camera.y));

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

  triggerDamageFlash(duration: number = 0.4): void {
    this.damageFlash.alpha = 1;
    this.damageFlash.duration = duration;
  }

  addTrapFlash(x: number, y: number): void {
    this.trapFlashTimers.set(`${x},${y}`, { timer: 1.0, cracks: true, phase: 0 });

    const overlay = new PIXI.Graphics();
    overlay.x = x * TILE_SIZE;
    overlay.y = y * TILE_SIZE;
    this.trapOverlayContainer.addChild(overlay);
    this.trapOverlays.set(`${x},${y}`, overlay);
  }

  update(deltaTime: number, map: Tile[][], playerPos: Position): void {
    this.setCachedPlayerPos(playerPos.x, playerPos.y);

    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      this.screenShake.intensity *= 0.9;
    }

    if (this.damageFlash.duration > 0) {
      this.damageFlash.duration -= deltaTime;
      this.damageFlash.alpha = Math.max(0, this.damageFlash.alpha - deltaTime * 2.5);
      this.updateDamageVignette();
    }

    for (const [key, data] of this.trapFlashTimers) {
      data.timer -= deltaTime;
      data.phase = 1 - data.timer / 1.0;
      if (data.timer <= 0) {
        this.trapFlashTimers.delete(key);
        const overlay = this.trapOverlays.get(key);
        if (overlay) {
          this.trapOverlayContainer.removeChild(overlay);
          this.trapOverlays.delete(key);
        }
      } else {
        const overlay = this.trapOverlays.get(key);
        if (overlay) {
          this.drawTrapCracks(overlay, data.timer, data.phase);
        }
      }
    }

    this.updateTrapHighlights(map, playerPos);
  }

  private updateDamageVignette(): void {
    this.damageVignette.clear();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    const alpha = this.damageFlash.alpha;
    const borderSize = Math.min(w, h) * 0.22;

    this.damageVignette.lineStyle(0);
    this.damageVignette.beginFill(0xff1111, alpha * 0.75);
    this.damageVignette.drawRect(0, 0, w, borderSize);
    this.damageVignette.drawRect(0, h - borderSize, w, borderSize);
    this.damageVignette.drawRect(0, 0, borderSize, h);
    this.damageVignette.drawRect(w - borderSize, 0, borderSize, h);
    this.damageVignette.endFill();

    if (alpha > 0.25) {
      const innerAlpha = (alpha - 0.25) * 0.5;
      this.damageVignette.beginFill(0xff2222, innerAlpha);
      this.damageVignette.drawRect(0, 0, w, h);
      this.damageVignette.endFill();
    }
  }

  private drawTrapCracks(graphics: PIXI.Graphics, timer: number, phase: number): void {
    graphics.clear();

    const flashWave = Math.sin(timer * 30) * 0.5 + 0.5;
    const flashAlpha = Math.max(0, Math.min(1, timer * 1.5)) * (0.5 + flashWave * 0.5);

    graphics.beginFill(0xff2222, flashAlpha * 0.8);
    graphics.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.endFill();

    const cx = TILE_SIZE / 2;
    const cy = TILE_SIZE / 2;

    const crackProgress = Math.min(1, phase * 1.6);

    if (crackProgress > 0) {
      const lines: Array<Array<{ x: number; y: number }>> = [
        [
          { x: cx, y: cy },
          { x: cx + 1.5, y: cy - 2 },
          { x: cx - 0.5, y: cy - 5 },
          { x: cx + 2, y: 0 }
        ],
        [
          { x: cx, y: cy },
          { x: cx + 3, y: cy + 1.5 },
          { x: cx + 6, y: cy + 4 },
          { x: TILE_SIZE, y: cy + 6 }
        ],
        [
          { x: cx, y: cy },
          { x: cx - 2, y: cy + 2.5 },
          { x: cx - 5, y: cy + 1 },
          { x: 0, y: cy + 3 }
        ],
        [
          { x: cx, y: cy },
          { x: cx + 0.5, y: cy + 3 },
          { x: cx - 2, y: cy + 6 },
          { x: cx + 1, y: TILE_SIZE }
        ],
        [
          { x: cx - 3, y: cy - 2 },
          { x: cx, y: cy },
          { x: cx + 4, y: cy - 3 },
          { x: TILE_SIZE - 1, y: cy - 6 }
        ],
        [
          { x: cx - 1, y: cy + 5 },
          { x: cx, y: cy },
          { x: cx - 5, y: cy - 4 },
          { x: cx - 7, y: 2 }
        ]
      ];

      const numLines = Math.min(lines.length, Math.ceil(crackProgress * lines.length));
      for (let i = 0; i < numLines; i++) {
        const line = lines[i];
        const lineProgress = Math.min(1, (crackProgress * lines.length - i) * 1.5);

        let alpha: number;
        if (i === 0) alpha = 1;
        else if (i <= 2) alpha = 0.9;
        else alpha = 0.75;

        alpha *= Math.max(0.3, 1 - phase * 0.6);

        graphics.lineStyle(1.5 + i * 0.15, 0x000000, alpha);

        const numPts = Math.min(line.length, Math.max(2, Math.ceil(lineProgress * line.length)));
        if (numPts < 2) continue;

        graphics.moveTo(line[0].x, line[0].y);
        for (let j = 1; j < numPts; j++) {
          let endPt: { x: number; y: number };
          if (j === numPts - 1 && lineProgress < 1) {
            const t = lineProgress * line.length - Math.floor(lineProgress * line.length);
            const prev = line[j - 1];
            const next = line[j];
            endPt = {
              x: prev.x + (next.x - prev.x) * t,
              y: prev.y + (next.y - prev.y) * t
            };
          } else {
            endPt = line[j];
          }
          graphics.lineTo(endPt.x, endPt.y);
        }
      }
    }

    if (phase > 0.45) {
      const piecePhase = (phase - 0.45) / 0.55;
      const fall = piecePhase * TILE_SIZE * 0.8;
      const rot = piecePhase * 0.6;

      const drawPiece = (px: number, py: number, pw: number, ph: number, offsetX: number, offsetY: number) => {
        const pcx = px + pw / 2;
        const pcy = py + ph / 2;
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);
        const rx = (x: number, y: number) => pcx + (x - pcx) * cosR - (y - pcy) * sinR;
        const ry = (x: number, y: number) => pcy + (x - pcx) * sinR + (y - pcy) * cosR;

        const corners = [
          { x: px, y: py },
          { x: px + pw, y: py },
          { x: px + pw, y: py + ph },
          { x: px, y: py + ph }
        ].map(c => ({ x: rx(c.x, c.y) + offsetX, y: ry(c.y, c.y) + offsetY + fall }));

        const alpha = Math.max(0, 1 - piecePhase * 0.7);
        graphics.lineStyle(0);
        graphics.beginFill(0x1a1a2e, alpha);
        graphics.moveTo(corners[0].x, corners[0].y);
        for (let k = 1; k < corners.length; k++) {
          graphics.lineTo(corners[k].x, corners[k].y);
        }
        graphics.closePath();
        graphics.endFill();

        graphics.lineStyle(1, 0x000000, alpha * 0.7);
        graphics.moveTo(corners[0].x, corners[0].y);
        for (let k = 1; k < corners.length; k++) {
          graphics.lineTo(corners[k].x, corners[k].y);
        }
        graphics.closePath();
      };

      drawPiece(TILE_SIZE * 0.08, TILE_SIZE * 0.12, TILE_SIZE * 0.22, TILE_SIZE * 0.18, -piecePhase * 4, piecePhase * 2);
      drawPiece(TILE_SIZE * 0.58, TILE_SIZE * 0.30, TILE_SIZE * 0.24, TILE_SIZE * 0.22, piecePhase * 5, piecePhase * 1);
      drawPiece(TILE_SIZE * 0.18, TILE_SIZE * 0.62, TILE_SIZE * 0.28, TILE_SIZE * 0.20, -piecePhase * 2, piecePhase * 6);
      drawPiece(TILE_SIZE * 0.60, TILE_SIZE * 0.65, TILE_SIZE * 0.20, TILE_SIZE * 0.18, piecePhase * 3, piecePhase * 4);
    }

    if (phase > 0.25 && phase < 0.9) {
      const dustPhase = (phase - 0.25) / 0.65;
      const dustAlpha = Math.sin(dustPhase * Math.PI) * 0.5;
      for (let i = 0; i < 5; i++) {
        const dustX = cx + Math.cos(i * 1.3 + phase * 4) * (TILE_SIZE * 0.3 * dustPhase);
        const dustY = cy + Math.sin(i * 1.3 + phase * 4) * (TILE_SIZE * 0.25 * dustPhase) - dustPhase * TILE_SIZE * 0.2;
        const dustSize = 1.5 + Math.sin(i * 2.7) * 1;
        graphics.lineStyle(0);
        graphics.beginFill(0x5a4a3a, dustAlpha);
        graphics.drawRect(dustX - dustSize / 2, dustY - dustSize / 2, dustSize, dustSize);
        graphics.endFill();
      }
    }
  }

  private updateTrapHighlights(map: Tile[][], playerPos: Position): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y][x];
        const sprite = this.tileSprites[y][x];

        if (!tile.visible && tile.explored) {
          continue;
        }
        if (!tile.visible) continue;

        if (tile.type === TileType.TRAP && !tile.trapTriggered) {
          const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);

          if (dist <= TRAP_VISION_RADIUS) {
            const flashData = this.trapFlashTimers.get(`${x},${y}`);
            if (flashData !== undefined) {
              const fi = Math.sin(flashData.timer * 30) * 0.5 + 0.5;
              sprite.tint = PIXI.utils.rgb2hex([1, 0.15 + fi * 0.3, 0.15 + fi * 0.3]);
            } else {
              const distFactor = 1 - dist / (TRAP_VISION_RADIUS + 1);
              const r = 1;
              const g = 0.35 + distFactor * 0.2;
              const b = 0.35 + distFactor * 0.2;
              sprite.tint = PIXI.utils.rgb2hex([r, g, b]);
            }
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
