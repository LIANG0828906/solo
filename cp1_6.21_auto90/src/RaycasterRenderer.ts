import { Room, Player, Enemy, Fireball, EnemyType } from './types';

const RENDER_WIDTH = 160;
const RENDER_HEIGHT = 120;
const FOV = Math.PI / 2;
const MAX_DEPTH = 20;
const TEXTURE_SIZE = 64;

export class RaycasterRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stoneTexture: ImageData;
  private zBuffer: number[];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.stoneTexture = this.generateStoneTexture();
    this.zBuffer = new Array(RENDER_WIDTH);
  }

  private generateStoneTexture(): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE);
    const data = imageData.data;

    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const idx = (y * TEXTURE_SIZE + x) * 4;
        const noise = Math.random();
        const brickY = Math.floor(y / 16);
        const isMortar = (y % 16 === 0 || y % 16 === 15) ||
                        ((x + (brickY % 2) * 32) % 32 === 0 || (x + (brickY % 2) * 32) % 32 === 31);

        let base: number;
        if (isMortar) {
          base = 70 + noise * 10;
        } else {
          base = 96 + noise * 32;
        }

        const variation = (Math.sin(x * 0.3) * Math.cos(y * 0.2) * 5);
        const color = Math.min(255, Math.max(0, base + variation));

        data[idx] = color;
        data[idx + 1] = color;
        data[idx + 2] = color;
        data[idx + 3] = 255;
      }
    }

    return imageData;
  }

  render(room: Room, player: Player, enemies: Enemy[], fireballs: Fireball[], _scaleX: number, _scaleY: number): void {
    const imageData = this.ctx.createImageData(RENDER_WIDTH, RENDER_HEIGHT);
    const data = imageData.data;
    const wallMap = room.wallMap;
    const mapSize = wallMap.length;

    const bobOffset = player.bobOffset;

    for (let x = 0; x < RENDER_WIDTH; x++) {
      const rayAngle = player.angle - FOV / 2 + (x / RENDER_WIDTH) * FOV;
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const deltaDistX = Math.abs(1 / rayDirX);
      const deltaDistY = Math.abs(1 / rayDirY);

      let stepX: number, stepY: number;
      let sideDistX: number, sideDistY: number;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1 - player.x) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1 - player.y) * deltaDistY;
      }

      let hit = false;
      let side = 0;
      let perpWallDist = 0;

      while (!hit && perpWallDist < MAX_DEPTH) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        if (mapX < 0 || mapX >= mapSize || mapY < 0 || mapY >= mapSize) {
          hit = true;
          perpWallDist = MAX_DEPTH;
        } else if (wallMap[mapY][mapX] === 1) {
          hit = true;
          if (side === 0) {
            perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
          } else {
            perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
          }
        }
      }

      this.zBuffer[x] = perpWallDist;

      const correctedDist = perpWallDist * Math.cos(rayAngle - player.angle);
      const lineHeight = Math.floor(RENDER_HEIGHT / correctedDist);
      const drawStart = Math.floor((RENDER_HEIGHT - lineHeight) / 2 + bobOffset);
      const drawEnd = Math.floor(drawStart + lineHeight);

      let wallX: number;
      if (side === 0) {
        wallX = player.y + perpWallDist * rayDirY;
      } else {
        wallX = player.x + perpWallDist * rayDirX;
      }
      wallX -= Math.floor(wallX);

      const texX = Math.floor(wallX * TEXTURE_SIZE);
      if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
        // texX = TEXTURE_SIZE - texX - 1;
      }

      for (let y = 0; y < RENDER_HEIGHT; y++) {
        const idx = (y * RENDER_WIDTH + x) * 4;

        if (y < drawStart) {
          data[idx] = 34;
          data[idx + 1] = 34;
          data[idx + 2] = 34;
          data[idx + 3] = 255;
        } else if (y >= drawStart && y < drawEnd) {
          const d = y * 256 - RENDER_HEIGHT * 128 + lineHeight * 128 - bobOffset * 256;
          const texY = ((d * TEXTURE_SIZE) / lineHeight) / 256;
          const clampedTexY = Math.max(0, Math.min(TEXTURE_SIZE - 1, Math.floor(texY)));
          const texIdx = (clampedTexY * TEXTURE_SIZE + texX) * 4;

          let r = this.stoneTexture.data[texIdx];
          let g = this.stoneTexture.data[texIdx + 1];
          let b = this.stoneTexture.data[texIdx + 2];

          if (side === 1) {
            r = Math.floor(r * 0.7);
            g = Math.floor(g * 0.7);
            b = Math.floor(b * 0.7);
          }

          const fogFactor = Math.min(1, correctedDist / 15);
          r = Math.floor(r * (1 - fogFactor) + 20 * fogFactor);
          g = Math.floor(g * (1 - fogFactor) + 20 * fogFactor);
          b = Math.floor(b * (1 - fogFactor) + 20 * fogFactor);

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        } else {
          const floorDist = RENDER_HEIGHT / (2 * (y - RENDER_HEIGHT / 2 - bobOffset));
          const fogFactor = Math.min(1, floorDist / 10);
          const baseGray = 136;
          const gray = Math.floor(baseGray * (1 - fogFactor) + 20 * fogFactor);

          data[idx] = gray;
          data[idx + 1] = gray;
          data[idx + 2] = gray;
          data[idx + 3] = 255;
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);

    this.renderEnemies(enemies, player);
    this.renderFireballs(fireballs, player);

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.canvas, 0, 0, RENDER_WIDTH, RENDER_HEIGHT, 0, 0, this.canvas.width, this.canvas.height);
  }

  private renderEnemies(enemies: Enemy[], player: Player): void {
    const sortedEnemies = [...enemies]
      .filter(e => e.alive || e.deathTimer > 0)
      .map(e => ({
        enemy: e,
        dist: Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2)
      }))
      .sort((a, b) => b.dist - a.dist);

    for (const { enemy, dist } of sortedEnemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;

      const cos = Math.cos(-player.angle);
      const sin = Math.sin(-player.angle);
      const tx = dx * cos - dy * sin;
      const ty = dx * sin + dy * cos;

      if (ty <= 0) continue;

      const screenX = (RENDER_WIDTH / 2) * (1 + tx / ty / Math.tan(FOV / 2));
      const spriteHeight = Math.abs(RENDER_HEIGHT / ty);
      const spriteWidth = spriteHeight * 0.8;

      const drawStartY = Math.floor((RENDER_HEIGHT - spriteHeight) / 2 + player.bobOffset);
      const drawStartX = Math.floor(screenX - spriteWidth / 2);
      const drawEndX = Math.floor(drawStartX + spriteWidth);
      const drawEndY = Math.floor(drawStartY + spriteHeight);

      for (let x = drawStartX; x < drawEndX; x++) {
        if (x < 0 || x >= RENDER_WIDTH) continue;
        if (ty >= this.zBuffer[x]) continue;

        const texX = Math.floor((x - drawStartX) / spriteWidth * 16);

        for (let y = drawStartY; y < drawEndY; y++) {
          if (y < 0 || y >= RENDER_HEIGHT) continue;

          const texY = Math.floor((y - drawStartY) / spriteHeight * 16);

          let color: { r: number; g: number; b: number } | null = null;

          if (enemy.type === EnemyType.SKELETON) {
            color = this.getSkeletonPixel(texX, texY);
          } else {
            color = this.getSlimePixel(texX, texY);
          }

          if (color) {
            const idx = (y * RENDER_WIDTH + x) * 4;
            const imageData = this.ctx.getImageData(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
            const data = imageData.data;

            let r = color.r;
            let g = color.g;
            let b = color.b;

            if (!enemy.alive) {
              const darkenFactor = 1 - (enemy.deathTimer / 0.3) * 0.7;
              r = Math.floor(r * darkenFactor);
              g = Math.floor(g * darkenFactor);
              b = Math.floor(b * darkenFactor);
            }

            const fogFactor = Math.min(1, dist / 15);
            r = Math.floor(r * (1 - fogFactor) + 20 * fogFactor);
            g = Math.floor(g * (1 - fogFactor) + 20 * fogFactor);
            b = Math.floor(b * (1 - fogFactor) + 20 * fogFactor);

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;

            this.ctx.putImageData(imageData, 0, 0);
          }
        }
      }
    }
  }

  private getSkeletonPixel(x: number, y: number): { r: number; g: number; b: number } | null {
    if (x < 0 || x >= 16 || y < 0 || y >= 16) return null;

    const head = (x >= 5 && x <= 10 && y >= 2 && y <= 7);
    const eyes = (x === 6 && y === 4) || (x === 9 && y === 4);
    const body = (x >= 6 && x <= 9 && y >= 8 && y <= 12);
    const arms = (y >= 7 && y <= 11 && (x === 4 || x === 11));
    const legs = (y >= 13 && y <= 15 && (x === 6 || x === 9));

    if (eyes) {
      return { r: 255, g: 0, b: 0 };
    } else if (head || body || arms || legs) {
      return { r: 230, g: 230, b: 230 };
    }

    return null;
  }

  private getSlimePixel(x: number, y: number): { r: number; g: number; b: number } | null {
    if (x < 0 || x >= 16 || y < 0 || y >= 16) return null;

    const cx = 8, cy = 10;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const inSlime = dist <= 5 && y >= 5;
    const eyes = (x === 6 && y === 8) || (x === 10 && y === 8);

    if (eyes) {
      return { r: 0, g: 0, b: 0 };
    } else if (inSlime) {
      const brightness = 1 - dist / 7;
      return {
        r: Math.floor(50 + 80 * brightness),
        g: Math.floor(180 + 50 * brightness),
        b: Math.floor(50 + 80 * brightness)
      };
    }

    return null;
  }

  private renderFireballs(fireballs: Fireball[], player: Player): void {
    for (const fireball of fireballs) {
      if (!fireball.active) continue;

      const dx = fireball.x - player.x;
      const dy = fireball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const cos = Math.cos(-player.angle);
      const sin = Math.sin(-player.angle);
      const tx = dx * cos - dy * sin;
      const ty = dx * sin + dy * cos;

      if (ty <= 0) continue;

      const screenX = (RENDER_WIDTH / 2) * (1 + tx / ty / Math.tan(FOV / 2));
      const size = Math.max(2, Math.min(20, 30 / dist));
      const screenY = RENDER_HEIGHT / 2 + player.bobOffset;

      const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
      gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  getRenderWidth(): number { return RENDER_WIDTH; }
  getRenderHeight(): number { return RENDER_HEIGHT; }
}
