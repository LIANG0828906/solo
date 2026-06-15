import {
  TerrainType,
  ResourceType,
  WeatherType,
  HEX_SIZE,
  HEX_GAP,
  HEX_WIDTH,
  HEX_HEIGHT,
  ISLAND_MIN_RADIUS,
  ISLAND_MAX_RADIUS,
  WAVE_PERIOD,
  TERRAIN_INFO,
  WEATHER_INFO,
  WEATHER_INTERVAL_MIN,
  WEATHER_INTERVAL_MAX,
  MAX_RAINDROPS
} from './data';

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  resources: ResourceType[];
}

export interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export class Island {
  private hexGrid: Map<string, HexCell> = new Map();
  private islandRadius: number;
  private centerQ: number = 0;
  private centerR: number = 0;
  private currentWeather: WeatherType = WeatherType.SUNNY;
  private weatherTimer: number = 0;
  private weatherDuration: number = 0;
  private nextWeatherInterval: number;
  private raindrops: Raindrop[] = [];
  private time: number = 0;
  private weatherMessageTimer: number = 0;
  private currentWeatherMessage: string = '';

  constructor() {
    this.islandRadius = ISLAND_MIN_RADIUS + Math.random() * (ISLAND_MAX_RADIUS - ISLAND_MIN_RADIUS);
    this.nextWeatherInterval = WEATHER_INTERVAL_MIN + Math.random() * (WEATHER_INTERVAL_MAX - WEATHER_INTERVAL_MIN);
    this.generateIsland();
  }

  private key(q: number, r: number): string {
    return `${q},${r}`;
  }

  private hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  private generateIsland(): void {
    const radius = Math.ceil(this.islandRadius) + 3;
    for (let q = -radius; q <= radius; q++) {
      for (let r = -radius; r <= radius; r++) {
        const dist = this.hexDistance(q, r, this.centerQ, this.centerR);
        const noise = (Math.random() - 0.5) * 2.5;
        const adjustedDist = dist + noise;

        let terrain: TerrainType;

        if (adjustedDist <= this.islandRadius * 0.3) {
          terrain = TerrainType.JUNGLE;
        } else if (adjustedDist <= this.islandRadius * 0.55) {
          terrain = Math.random() < 0.7 ? TerrainType.GRASS : TerrainType.JUNGLE;
        } else if (adjustedDist <= this.islandRadius * 0.75) {
          terrain = Math.random() < 0.7 ? TerrainType.GRASS : TerrainType.ROCK;
        } else if (adjustedDist <= this.islandRadius) {
          terrain = TerrainType.SAND;
        } else {
          terrain = TerrainType.OCEAN;
        }

        const resources: ResourceType[] = [];
        if (terrain !== TerrainType.OCEAN) {
          const terrainInfo = TERRAIN_INFO[terrain];
          for (const res of terrainInfo.resources) {
            if (Math.random() < 0.35) {
              resources.push(res);
            }
          }
        }

        this.hexGrid.set(this.key(q, r), { q, r, terrain, resources });
      }
    }
  }

  getCell(q: number, r: number): HexCell | undefined {
    return this.hexGrid.get(this.key(q, r));
  }

  getAllCells(): HexCell[] {
    return Array.from(this.hexGrid.values());
  }

  getWalkableNeighbors(q: number, r: number): HexCell[] {
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    const neighbors: HexCell[] = [];
    for (const [dq, dr] of directions) {
      const cell = this.getCell(q + dq, r + dr);
      if (cell && TERRAIN_INFO[cell.terrain].walkable) {
        neighbors.push(cell);
      }
    }
    return neighbors;
  }

  isWalkable(q: number, r: number): boolean {
    const cell = this.getCell(q, r);
    return cell ? TERRAIN_INFO[cell.terrain].walkable : false;
  }

  isAdjacent(q1: number, r1: number, q2: number, r2: number): boolean {
    return this.hexDistance(q1, r1, q2, r2) === 1;
  }

  hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = HEX_WIDTH * (q + r / 2);
    const y = (HEX_HEIGHT * 3 / 4) * r;
    return { x, y };
  }

  findSandPosition(): { q: number; r: number } {
    const sandCells = Array.from(this.hexGrid.values()).filter(
      c => c.terrain === TerrainType.SAND
    );
    if (sandCells.length === 0) {
      return { q: 0, r: Math.ceil(this.islandRadius) };
    }
    const idx = Math.floor(Math.random() * sandCells.length);
    return { q: sandCells[idx].q, r: sandCells[idx].r };
  }

  drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, fillColor: string, gap: number = 0): void {
    const actualSize = size - gap / 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const px = cx + actualSize * Math.cos(angle);
      const py = cy + actualSize * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  drawOcean(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
    const cells = this.getAllCells();
    for (const cell of cells) {
      if (cell.terrain === TerrainType.OCEAN) {
        const pos = this.hexToPixel(cell.q, cell.r);
        const cx = pos.x + offsetX;
        const cy = pos.y + offsetY;

        const dist = this.hexDistance(cell.q, cell.r, this.centerQ, this.centerR);
        const t = Math.min(1, (dist - this.islandRadius) / 5);
        const r1 = parseInt('2E', 16), g1 = parseInt('5B', 16), b1 = parseInt('8A', 16);
        const r2 = parseInt('1A', 16), g2 = parseInt('3A', 16), b2 = parseInt('5C', 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        const baseColor = `rgb(${r}, ${g}, ${b})`;

        this.drawHex(ctx, cx, cy, HEX_SIZE, baseColor, HEX_GAP);

        const wavePhase = (this.time / WAVE_PERIOD + (cell.q + cell.r) * 0.3) % 1;
        const waveOffset = Math.sin(wavePhase * Math.PI * 2) * 2;
        const waveAlpha = 0.15 + Math.abs(Math.sin(wavePhase * Math.PI * 2)) * 0.2;

        ctx.save();
        ctx.globalAlpha = waveAlpha;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - HEX_SIZE * 0.5, cy + waveOffset);
        ctx.quadraticCurveTo(cx, cy + waveOffset + 3, cx + HEX_SIZE * 0.5, cy + waveOffset);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawTerrain(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
    const cells = this.getAllCells();
    for (const cell of cells) {
      if (cell.terrain !== TerrainType.OCEAN) {
        const pos = this.hexToPixel(cell.q, cell.r);
        const cx = pos.x + offsetX;
        const cy = pos.y + offsetY;
        const color = TERRAIN_INFO[cell.terrain].color;
        this.drawHex(ctx, cx, cy, HEX_SIZE, color, HEX_GAP);
      }
    }
  }

  drawResources(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, playerQ: number, playerR: number): void {
    const cell = this.getCell(playerQ, playerR);
    if (!cell || cell.resources.length === 0) return;

    const pos = this.hexToPixel(playerQ, playerR);
    const cx = pos.x + offsetX;
    const cy = pos.y + offsetY + HEX_SIZE * 0.9;
    const spacing = 32;
    const totalWidth = cell.resources.length * spacing;
    const startX = cx - totalWidth / 2 + spacing / 2;

    for (let i = 0; i < cell.resources.length; i++) {
      const res = cell.resources[i];
      const rx = startX + i * spacing;
      const ry = cy;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      switch (res) {
        case ResourceType.COCONUT:
          ctx.fillStyle = '#8B5E3C';
          ctx.beginPath();
          ctx.ellipse(rx, ry, 10, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case ResourceType.WOOD:
          ctx.fillStyle = '#5C3A21';
          ctx.fillRect(rx - 10, ry - 8, 20, 16);
          break;
        case ResourceType.STONE:
          ctx.fillStyle = '#808080';
          ctx.beginPath();
          ctx.ellipse(rx, ry, 12, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case ResourceType.BERRY:
          ctx.fillStyle = '#E63946';
          ctx.beginPath();
          ctx.arc(rx, ry, 8, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }

  collectResource(q: number, r: number, index: number): ResourceType | null {
    const cell = this.getCell(q, r);
    if (!cell || index < 0 || index >= cell.resources.length) return null;
    const resource = cell.resources[index];
    cell.resources.splice(index, 1);
    return resource;
  }

  getResourceCount(q: number, r: number): number {
    const cell = this.getCell(q, r);
    return cell ? cell.resources.length : 0;
  }

  getResourceAt(q: number, r: number, index: number): ResourceType | null {
    const cell = this.getCell(q, r);
    if (!cell || index < 0 || index >= cell.resources.length) return null;
    return cell.resources[index];
  }

  update(dt: number, canvasWidth: number, canvasHeight: number): void {
    this.time += dt;
    this.weatherTimer += dt;

    if (this.weatherMessageTimer > 0) {
      this.weatherMessageTimer -= dt;
    }

    if (this.currentWeather !== WeatherType.SUNNY) {
      this.weatherDuration -= dt;
      if (this.weatherDuration <= 0) {
        this.currentWeather = WeatherType.SUNNY;
      }
    }

    if (this.currentWeather === WeatherType.SUNNY && this.weatherTimer >= this.nextWeatherInterval) {
      this.weatherTimer = 0;
      this.nextWeatherInterval = WEATHER_INTERVAL_MIN + Math.random() * (WEATHER_INTERVAL_MAX - WEATHER_INTERVAL_MIN);
      const weathers = [WeatherType.RAIN, WeatherType.HEAT];
      this.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
      this.weatherDuration = WEATHER_INFO[this.currentWeather].duration;
      this.weatherMessageTimer = 2;
      this.currentWeatherMessage = WEATHER_INFO[this.currentWeather].message;
    }

    if (this.currentWeather === WeatherType.RAIN) {
      while (this.raindrops.length < MAX_RAINDROPS) {
        this.raindrops.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight - canvasHeight,
          speed: 300 + Math.random() * 200,
          length: 8 + Math.random() * 8
        });
      }
      for (const drop of this.raindrops) {
        drop.y += drop.speed * dt;
        if (drop.y > canvasHeight) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvasWidth;
        }
      }
    } else {
      this.raindrops = [];
    }
  }

  getWeather(): WeatherType {
    return this.currentWeather;
  }

  getWeatherMultipliers(): { hunger: number; thirst: number; moveSpeed: number } {
    const info = WEATHER_INFO[this.currentWeather];
    return {
      hunger: info.hungerMultiplier,
      thirst: info.thirstMultiplier,
      moveSpeed: info.moveSpeedMultiplier
    };
  }

  drawWeatherEffects(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (this.currentWeather === WeatherType.RAIN) {
      ctx.save();
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
      ctx.lineWidth = 1.5;
      for (const drop of this.raindrops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#4A4A4A';
      for (let i = 0; i < 5; i++) {
        const cx = canvasWidth * (0.15 + i * 0.18);
        const cy = 60;
        ctx.beginPath();
        ctx.arc(cx - 20, cy, 25, 0, Math.PI * 2);
        ctx.arc(cx, cy - 10, 30, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy, 25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.currentWeather === WeatherType.HEAT) {
      ctx.save();
      const intensity = 0.15;
      const gradient = ctx.createRadialGradient(
        canvasWidth / 2, canvasHeight / 2, Math.min(canvasWidth, canvasHeight) * 0.3,
        canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight) * 0.7
      );
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
      gradient.addColorStop(1, `rgba(255, 100, 0, ${intensity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }

    if (this.weatherMessageTimer > 0) {
      const alpha = Math.min(1, this.weatherMessageTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this.currentWeatherMessage, canvasWidth / 2, 20);
      ctx.restore();
    }
  }

  getResourceIconPosition(q: number, r: number, index: number, offsetX: number, offsetY: number): { x: number; y: number } {
    const pos = this.hexToPixel(q, r);
    const cx = pos.x + offsetX;
    const cy = pos.y + offsetY + HEX_SIZE * 0.9;
    const cell = this.getCell(q, r);
    if (!cell) return { x: cx, y: cy };
    const spacing = 32;
    const totalWidth = cell.resources.length * spacing;
    const startX = cx - totalWidth / 2 + spacing / 2;
    return { x: startX + index * spacing, y: cy };
  }

  getTime(): number {
    return this.time;
  }
}
