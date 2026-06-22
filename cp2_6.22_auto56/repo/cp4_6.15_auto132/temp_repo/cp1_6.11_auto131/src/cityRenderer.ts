import { hslToRgb, randomInt, randomFloat, perlinNoise, clamp, pickRandom, lerp } from './utils';

export const PIXEL_SCALE = 8;
export const GRID_WIDTH = 80;
export const GRID_HEIGHT = 60;
export const CANVAS_WIDTH = GRID_WIDTH * PIXEL_SCALE;
export const CANVAS_HEIGHT = GRID_HEIGHT * PIXEL_SCALE;

export type BuildingType = 'spire' | 'flat' | 'dome' | 'antenna' | 'twin';
export type NeonColor = '#FF00FF' | '#00FFFF' | '#FFFF00';

export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  type: BuildingType;
  neonColor: NeonColor;
  windows: boolean[][];
  windowBrightness: number[][];
  buildingColors: { r: number; g: number; b: number }[][];
}

export interface Star {
  x: number;
  y: number;
  opacity: number;
  blinkPeriod: number;
  blinkOffset: number;
}

export interface Billboard {
  x: number;
  y: number;
  bgColor: string;
}

export interface CityParams {
  density: number;
  neonBrightness: number;
  skyHue: number;
  heightOffset: number;
  roadBrightness: number;
  fogIntensity: number;
}

export class CityRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private params: CityParams;
  private buildings: Building[] = [];
  private stars: Star[] = [];
  private billboards: Billboard[] = [];
  private seed: number = 0;
  private animationTime: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private fpsCallback: ((fps: number) => void) | null = null;
  private selectionRect: { x: number; y: number; visible: boolean } | null = null;
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number } | null = null;
  private showSelection: boolean = true;

  private readonly NEON_COLORS: NeonColor[] = ['#FF00FF', '#00FFFF', '#FFFF00'];
  private readonly BUILDING_TYPES: BuildingType[] = ['spire', 'flat', 'dome', 'antenna', 'twin'];

  constructor(canvas: HTMLCanvasElement, params: CityParams) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.imageData = this.ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.params = params;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.selectionRect = null;
      this.isDragging = false;
      this.dragStart = null;
    });
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SCALE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SCALE);
    
    if (this.isDragging) {
      this.selectionRect = { x, y, visible: true };
    } else {
      this.selectionRect = { x, y, visible: true };
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SCALE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SCALE);
    this.isDragging = true;
    this.dragStart = { x, y };
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.isDragging && this.dragStart) {
      this.addBillboard(this.dragStart.x, this.dragStart.y);
    }
    this.isDragging = false;
    this.dragStart = null;
  }

  private addBillboard(gridX: number, gridY: number): void {
    const x = clamp(gridX - 2, 0, GRID_WIDTH - 4);
    const y = clamp(gridY - 3, 0, GRID_HEIGHT - 6);
    
    const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF6600', '#00FF66', '#FF3366'];
    const bgColor = pickRandom(colors);
    
    this.billboards.push({ x, y, bgColor });
  }

  public setParams(params: Partial<CityParams>): void {
    this.params = { ...this.params, ...params };
  }

  public getParams(): CityParams {
    return { ...this.params };
  }

  public regenerate(): void {
    this.seed = randomInt(0, 100000);
    this.billboards = [];
    this.generateCity();
  }

  public generateCity(): void {
    this.buildings = [];
    this.stars = [];

    const densityThreshold = 0.3 + (this.params.density / 100) * 0.4;
    let x = 0;

    while (x < GRID_WIDTH) {
      const noiseVal = perlinNoise(x * 0.1, 0, 3, this.seed);
      
      if (noiseVal < densityThreshold) {
        const width = randomInt(1, 3);
        const baseHeight = randomInt(5, 15);
        const height = clamp(baseHeight + this.params.heightOffset, 2, GRID_HEIGHT - 10);
        const groundY = GRID_HEIGHT - 5;
        const buildingY = groundY - height;

        const type = pickRandom(this.BUILDING_TYPES);
        const neonColor = pickRandom(this.NEON_COLORS);

        const windows: boolean[][] = [];
        const windowBrightness: number[][] = [];
        const buildingColors: { r: number; g: number; b: number }[][] = [];

        for (let wy = 0; wy < height; wy++) {
          const colorRow: { r: number; g: number; b: number }[] = [];
          for (let wx = 0; wx < width; wx++) {
            const shade = 20 + Math.floor((wy / height) * 30);
            const br = shade + randomInt(-5, 5);
            const bg = Math.floor(shade * 0.8);
            const bb = shade + 10;
            colorRow.push({ r: br, g: bg, b: bb });
          }
          buildingColors.push(colorRow);
        }

        for (let wy = 1; wy < height - 1; wy++) {
          const row: boolean[] = [];
          const brightnessRow: number[] = [];
          for (let wx = 0; wx < width; wx++) {
            const hasWindow = Math.random() > 0.4;
            row.push(hasWindow);
            brightnessRow.push(hasWindow ? randomInt(100, 200) : 0);
          }
          windows.push(row);
          windowBrightness.push(brightnessRow);
        }

        this.buildings.push({
          x,
          y: buildingY,
          width,
          height,
          type,
          neonColor,
          windows,
          windowBrightness,
          buildingColors
        });

        x += width + randomInt(0, 2);
      } else {
        x += 1;
      }
    }

    const starCount = randomInt(10, 20);
    const maxBuildingY = this.buildings.length > 0 
      ? Math.min(...this.buildings.map(b => b.y)) 
      : GRID_HEIGHT / 2;

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: randomInt(0, GRID_WIDTH - 1),
        y: randomInt(0, Math.floor(maxBuildingY - 2)),
        opacity: randomFloat(0.3, 1.0),
        blinkPeriod: randomFloat(1.0, 3.0),
        blinkOffset: randomFloat(0, Math.PI * 2)
      });
    }
  }

  private setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;
    
    for (let py = 0; py < PIXEL_SCALE; py++) {
      for (let px = 0; px < PIXEL_SCALE; px++) {
        const canvasX = x * PIXEL_SCALE + px;
        const canvasY = y * PIXEL_SCALE + py;
        const idx = (canvasY * CANVAS_WIDTH + canvasX) * 4;
        
        if (a < 255) {
          const oldR = this.imageData.data[idx];
          const oldG = this.imageData.data[idx + 1];
          const oldB = this.imageData.data[idx + 2];
          
          const alpha = a / 255;
          const invAlpha = 1 - alpha;
          
          this.imageData.data[idx] = r * alpha + oldR * invAlpha;
          this.imageData.data[idx + 1] = g * alpha + oldG * invAlpha;
          this.imageData.data[idx + 2] = b * alpha + oldB * invAlpha;
          this.imageData.data[idx + 3] = 255;
        } else {
          this.imageData.data[idx] = r;
          this.imageData.data[idx + 1] = g;
          this.imageData.data[idx + 2] = b;
          this.imageData.data[idx + 3] = 255;
        }
      }
    }
  }

  private clearCanvas(): void {
    for (let i = 0; i < this.imageData.data.length; i += 4) {
      this.imageData.data[i] = 0;
      this.imageData.data[i + 1] = 0;
      this.imageData.data[i + 2] = 0;
      this.imageData.data[i + 3] = 255;
    }
  }

  private drawSky(): void {
    const maxBuildingY = this.buildings.length > 0
      ? Math.min(...this.buildings.map(b => b.y))
      : Math.floor(GRID_HEIGHT / 2);

    for (let y = 0; y < maxBuildingY; y++) {
      const t = y / maxBuildingY;
      const saturation = 80;
      const lightness = lerp(40, 0, t);
      const [r, g, b] = hslToRgb(this.params.skyHue, saturation, lightness);
      
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.setPixel(x, y, r, g, b);
      }
    }

    for (const star of this.stars) {
      const blink = 0.5 + 0.5 * Math.sin(this.animationTime * (2 * Math.PI / star.blinkPeriod) + star.blinkOffset);
      const opacity = Math.floor(star.opacity * blink * 255);
      this.setPixel(star.x, star.y, 255, 255, 255, opacity);
    }
  }

  private drawBuilding(building: Building): void {
    const { x, y, width, height, type, neonColor, windows, windowBrightness, buildingColors } = building;
    const neonAlpha = 0.3 + (this.params.neonBrightness / 100) * 0.7;
    const neonA = Math.floor(neonAlpha * 255);
    
    const [nr, ng, nb] = this.hexToRgb(neonColor);

    for (let wy = 0; wy < height; wy++) {
      for (let wx = 0; wx < width; wx++) {
        const px = x + wx;
        const py = y + wy;
        const color = buildingColors[wy][wx];
        this.setPixel(px, py, color.r, color.g, color.b);
      }
    }

    for (let wy = 1; wy < height - 1; wy++) {
      for (let wx = 0; wx < width; wx++) {
        if (windows[wy - 1] && windows[wy - 1][wx]) {
          const px = x + wx;
          const py = y + wy;
          const brightness = windowBrightness[wy - 1][wx];
          this.setPixel(px, py, brightness, brightness, Math.floor(brightness * 0.8), 200);
        }
      }
    }

    for (let wx = 0; wx < width; wx++) {
      this.setPixel(x + wx, y, nr, ng, nb, neonA);
    }

    for (let wy = 0; wy < height; wy++) {
      this.setPixel(x, y + wy, nr, ng, nb, neonA);
      this.setPixel(x + width - 1, y + wy, nr, ng, nb, neonA);
    }

    this.drawBuildingTop(x, y, width, type, neonColor, neonA);
  }

  private drawBuildingTop(x: number, y: number, width: number, type: BuildingType, neonColor: NeonColor, neonA: number): void {
    const [nr, ng, nb] = this.hexToRgb(neonColor);

    switch (type) {
      case 'spire':
        for (let i = 0; i < 3; i++) {
          const spireWidth = width - i * 2;
          if (spireWidth > 0) {
            const offset = Math.floor((width - spireWidth) / 2);
            for (let wx = 0; wx < spireWidth; wx++) {
              this.setPixel(x + offset + wx, y - 1 - i, nr, ng, nb, neonA);
            }
          }
        }
        break;

      case 'flat':
        for (let wx = 0; wx < width; wx++) {
          this.setPixel(x + wx, y - 1, nr, ng, nb, neonA);
        }
        break;

      case 'dome':
        const domeHeight = Math.min(3, Math.ceil(width / 2));
        for (let dy = 1; dy <= domeHeight; dy++) {
          const domeWidth = width - (dy - 1) * 2;
          if (domeWidth > 0) {
            const offset = Math.floor((width - domeWidth) / 2);
            for (let wx = 0; wx < domeWidth; wx++) {
              this.setPixel(x + offset + wx, y - dy, nr, ng, nb, neonA);
            }
          }
        }
        break;

      case 'antenna':
        const antennaX = x + Math.floor(width / 2);
        for (let ay = 1; ay <= 4; ay++) {
          this.setPixel(antennaX, y - ay, nr, ng, nb, neonA);
        }
        this.setPixel(antennaX, y - 5, 255, 255, 255, neonA);
        break;

      case 'twin':
        for (let wx = 0; wx < width; wx++) {
          this.setPixel(x + wx, y - 1, nr, ng, nb, neonA);
        }
        for (let ty = 2; ty <= 4; ty++) {
          this.setPixel(x, y - ty, nr, ng, nb, neonA);
          this.setPixel(x + width - 1, y - ty, nr, ng, nb, neonA);
        }
        break;
    }
  }

  private drawRoads(): void {
    const roadGray = Math.floor(30 + (this.params.roadBrightness / 100) * 170);
    const groundY = GRID_HEIGHT - 5;

    for (let y = groundY; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const roadAlpha = 150;
        this.setPixel(x, y, roadGray, roadGray, roadGray, roadAlpha);
      }
    }

    const lineGray = Math.min(255, roadGray + 50);
    for (let y = groundY; y < GRID_HEIGHT; y += 6) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.setPixel(x, y, lineGray, lineGray, lineGray, 200);
      }
    }

    for (let x = 0; x < GRID_WIDTH; x += 8) {
      for (let y = groundY; y < GRID_HEIGHT; y++) {
        this.setPixel(x, y, lineGray, lineGray, lineGray, 180);
      }
    }
  }

  private drawFog(): void {
    if (this.params.fogIntensity <= 0) return;
    
    const fogStartY = Math.floor(GRID_HEIGHT * 0.75);
    const fogAlpha = (this.params.fogIntensity / 100) * 0.6;

    for (let y = fogStartY; y < GRID_HEIGHT; y++) {
      const t = (y - fogStartY) / (GRID_HEIGHT - fogStartY);
      const alpha = Math.floor(fogAlpha * t * 255);
      
      for (let x = 0; x < GRID_WIDTH; x++) {
        this.setPixel(x, y, 100, 50, 150, alpha);
      }
    }
  }

  private drawBillboards(): void {
    const neonAlpha = 0.3 + (this.params.neonBrightness / 100) * 0.7;
    
    for (const bb of this.billboards) {
      const [br, bg, bb_] = this.hexToRgb(bb.bgColor);
      
      for (let wy = 0; wy < 6; wy++) {
        for (let wx = 0; wx < 4; wx++) {
          this.setPixel(bb.x + wx, bb.y + wy, br, bg, bb_, Math.floor(neonAlpha * 255));
        }
      }
      
      this.drawText('GB', bb.x + 1, bb.y + 1, 255, 255, 255, Math.floor(neonAlpha * 255));
    }
  }

  private drawText(text: string, x: number, y: number, r: number, g: number, b: number, a: number): void {
    const font: { [key: string]: number[][] } = {
      'G': [
        [1, 1, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 1],
      ],
      'B': [
        [1, 1, 0],
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 0],
      ]
    };

    let offsetX = 0;
    for (const char of text) {
      const charData = font[char];
      if (charData) {
        for (let cy = 0; cy < charData.length; cy++) {
          for (let cx = 0; cx < charData[cy].length; cx++) {
            if (charData[cy][cx]) {
              this.setPixel(x + offsetX + cx, y + cy, r, g, b, a);
            }
          }
        }
        offsetX += charData[0].length + 1;
      }
    }
  }

  private drawSelection(): void {
    if (!this.showSelection || !this.selectionRect || !this.selectionRect.visible) return;

    const { x, y } = this.selectionRect;
    const selWidth = 4;
    const selHeight = 4;
    const startX = x - 2;
    const startY = y - 2;

    for (let wy = 0; wy < selHeight; wy++) {
      for (let wx = 0; wx < selWidth; wx++) {
        const px = startX + wx;
        const py = startY + wy;
        
        const isBorder = wx === 0 || wx === selWidth - 1 || wy === 0 || wy === selHeight - 1;
        
        if (isBorder) {
          this.setPixel(px, py, 255, 0, 255, 200);
        } else {
          this.setPixel(px, py, 255, 0, 255, 25);
        }
      }
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

  public render(timestamp: number): void {
    const deltaTime = timestamp - this.lastFrameTime;
    this.frameCount++;
    
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastFrameTime = timestamp;
      if (this.fpsCallback) {
        this.fpsCallback(this.fps);
      }
    }

    this.animationTime = timestamp / 1000;

    this.clearCanvas();
    this.drawSky();
    
    for (const building of this.buildings) {
      this.drawBuilding(building);
    }
    
    this.drawRoads();
    this.drawFog();
    this.drawBillboards();
    this.drawSelection();
    
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  public exportPNG(): void {
    this.showSelection = false;
    this.render(performance.now());
    
    const link = document.createElement('a');
    link.download = `cyberpunk-city-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    
    this.showSelection = true;
  }

  public setFpsCallback(callback: (fps: number) => void): void {
    this.fpsCallback = callback;
  }

  public startAnimation(): void {
    this.lastFrameTime = performance.now();
    const animate = (timestamp: number) => {
      this.render(timestamp);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}
