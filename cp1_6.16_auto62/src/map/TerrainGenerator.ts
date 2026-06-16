export class TerrainGenerator {
  private width: number;
  private height: number;
  private heightMap: number[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.heightMap = this.generateHeightMap();
  }

  private noise(x: number, y: number, seed: number = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private smoothNoise(x: number, y: number, seed: number = 0): number {
    const corners = (this.noise(x - 1, y - 1, seed) + this.noise(x + 1, y - 1, seed) +
                     this.noise(x - 1, y + 1, seed) + this.noise(x + 1, y + 1, seed)) / 16;
    const sides = (this.noise(x - 1, y, seed) + this.noise(x + 1, y, seed) +
                  this.noise(x, y - 1, seed) + this.noise(x, y + 1, seed)) / 8;
    const center = this.noise(x, y, seed) / 4;
    return corners + sides + center;
  }

  private interpolatedNoise(x: number, y: number, seed: number = 0): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;

    const v1 = this.smoothNoise(intX, intY, seed);
    const v2 = this.smoothNoise(intX + 1, intY, seed);
    const v3 = this.smoothNoise(intX, intY + 1, seed);
    const v4 = this.smoothNoise(intX + 1, intY + 1, seed);

    const i1 = this.cosineInterpolate(v1, v2, fracX);
    const i2 = this.cosineInterpolate(v3, v4, fracX);

    return this.cosineInterpolate(i1, i2, fracY);
  }

  private cosineInterpolate(a: number, b: number, t: number): number {
    const ft = t * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }

  private perlinNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 0.01;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.interpolatedNoise(x * frequency, y * frequency, i) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  private generateHeightMap(): number[][] {
    const map: number[][] = [];
    const scale = 4;
    for (let y = 0; y < this.height; y += scale) {
      const row: number[] = [];
      for (let x = 0; x < this.width; x += scale) {
        const noiseVal = this.perlinNoise(x, y, 4, 0.5);
        const elevation = Math.pow(noiseVal, 1.5) * 2000;
        row.push(elevation);
      }
      map.push(row);
    }
    return map;
  }

  public getElevation(x: number, y: number): number {
    const scale = 4;
    const mapX = Math.min(Math.max(0, Math.floor(x / scale)), this.heightMap[0].length - 1);
    const mapY = Math.min(Math.max(0, Math.floor(y / scale)), this.heightMap.length - 1);
    return this.heightMap[mapY]?.[mapX] ?? 0;
  }

  public drawTerrain(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawForest(ctx);
    this.drawRivers(ctx);
    this.drawContours(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#E8DCC8');
    gradient.addColorStop(1, '#D4C4A8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawContours(ctx: CanvasRenderingContext2D): void {
    const contourInterval = 50;
    const maxElevation = 2000;
    const scale = 4;

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.6;

    for (let elevation = 0; elevation <= maxElevation; elevation += contourInterval) {
      ctx.beginPath();
      let isDrawing = false;

      for (let y = 0; y < this.heightMap.length; y++) {
        for (let x = 0; x < this.heightMap[y].length; x++) {
          const h = this.heightMap[y][x];
          
          if (h >= elevation && h < elevation + contourInterval) {
            const px = x * scale;
            const py = y * scale;

            if (!isDrawing) {
              ctx.moveTo(px, py);
              isDrawing = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else if (isDrawing) {
            isDrawing = false;
          }
        }
        if (isDrawing) {
          isDrawing = false;
        }
      }

      for (let x = 0; x < (this.heightMap[0]?.length || 0); x++) {
        for (let y = 0; y < this.heightMap.length; y++) {
          const h = this.heightMap[y][x];
          
          if (h >= elevation && h < elevation + contourInterval) {
            const px = x * scale;
            const py = y * scale;

            if (!isDrawing) {
              ctx.moveTo(px, py);
              isDrawing = true;
            } else {
              ctx.lineTo(px, py);
            }
          } else if (isDrawing) {
            isDrawing = false;
          }
        }
        if (isDrawing) {
          isDrawing = false;
        }
      }

      ctx.stroke();

      if (elevation % 200 === 0) {
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.6;
      }
    }

    ctx.globalAlpha = 1;
  }

  private drawRivers(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rivers = this.generateRivers();

    rivers.forEach(river => {
      ctx.beginPath();
      river.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      ctx.strokeStyle = 'rgba(74, 144, 217, 0.3)';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = '#4A90D9';
      ctx.lineWidth = 3;
    });
  }

  private generateRivers(): { x: number; y: number }[][] {
    const rivers: { x: number; y: number }[][] = [];
    
    const river1: { x: number; y: number }[] = [];
    let x = 50;
    let y = 100;

    while (x < this.width - 50) {
      river1.push({ x, y });
      x += 15 + Math.random() * 25;
      y += (Math.random() - 0.5) * 40;
      y = Math.max(80, Math.min(this.height - 80, y));
    }
    rivers.push(river1);

    const river2: { x: number; y: number }[] = [];
    x = 100;
    y = this.height - 120;

    while (x < this.width - 100) {
      river2.push({ x, y });
      x += 12 + Math.random() * 20;
      y += (Math.random() - 0.3) * 30;
      y = Math.max(60, Math.min(this.height - 60, y));
    }
    rivers.push(river2);

    return rivers;
  }

  private drawForest(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(46, 107, 46, 0.4)';

    const forestAreas = this.generateForestAreas();

    forestAreas.forEach(area => {
      const gradient = ctx.createRadialGradient(
        area.x, area.y, 0,
        area.x, area.y, area.radius
      );
      gradient.addColorStop(0, 'rgba(46, 107, 46, 0.5)');
      gradient.addColorStop(0.7, 'rgba(46, 107, 46, 0.3)');
      gradient.addColorStop(1, 'rgba(46, 107, 46, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(34, 85, 34, 0.6)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const elevation = this.getElevation(x, y);

      if (elevation > 300 && elevation < 1500) {
        const size = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private generateForestAreas(): { x: number; y: number; radius: number }[] {
    const areas: { x: number; y: number; radius: number }[] = [];

    for (let i = 0; i < 8; i++) {
      areas.push({
        x: 100 + Math.random() * (this.width - 200),
        y: 100 + Math.random() * (this.height - 200),
        radius: 60 + Math.random() * 100
      });
    }

    return areas;
  }

  public drawScale(ctx: CanvasRenderingContext2D): void {
    const scaleX = this.width - 80;
    const scaleY = this.height - 40;
    const scaleLength = 100;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(scaleX - 10, scaleY - 25, 120, 35);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleLength, scaleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 5);
    ctx.lineTo(scaleX, scaleY + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(scaleX + scaleLength, scaleY - 5);
    ctx.lineTo(scaleX + scaleLength, scaleY + 5);
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = '11px sans-serif';
    ctx.fillText('1:50000', scaleX + 20, scaleY - 8);
    ctx.fillText('5km', scaleX + 35, scaleY + 18);
  }
}
