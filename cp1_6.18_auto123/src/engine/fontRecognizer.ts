import { CharGlyph, Point, RecognitionResult } from '../types';

const PREDEFINED_GLYPHS: Record<string, Point[][]> = {
  '永': generateYongOutline(),
  '和': generateHeOutline(),
  '天': generateTianOutline(),
  '下': generateXiaOutline(),
  '之': generateZhiOutline(),
  '人': generateRenOutline(),
  '大': generateDaOutline(),
  '小': generateXiaoOutline(),
  '中': generateZhongOutline(),
  '国': generateGuoOutline(),
};

function generateYongOutline(): Point[][] {
  return [
    [
      { x: 10, y: 2 }, { x: 12, y: 2 }, { x: 12, y: 6 },
      { x: 16, y: 6 }, { x: 16, y: 8 }, { x: 12, y: 8 },
      { x: 12, y: 14 }, { x: 8, y: 18 }, { x: 6, y: 18 },
      { x: 10, y: 14 }, { x: 10, y: 8 }, { x: 4, y: 8 },
      { x: 4, y: 6 }, { x: 10, y: 6 }, { x: 10, y: 2 },
    ],
  ];
}

function generateHeOutline(): Point[][] {
  return [
    [
      { x: 3, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 8 },
      { x: 3, y: 8 }, { x: 3, y: 4 },
    ],
    [
      { x: 3, y: 10 }, { x: 5, y: 10 }, { x: 5, y: 16 },
      { x: 3, y: 16 }, { x: 3, y: 10 },
    ],
    [
      { x: 8, y: 6 }, { x: 16, y: 6 }, { x: 16, y: 8 },
      { x: 10, y: 8 }, { x: 10, y: 12 }, { x: 16, y: 12 },
      { x: 16, y: 14 }, { x: 8, y: 14 }, { x: 8, y: 6 },
    ],
    [
      { x: 10, y: 16 }, { x: 12, y: 16 }, { x: 12, y: 18 },
      { x: 14, y: 18 }, { x: 14, y: 16 }, { x: 16, y: 16 },
      { x: 16, y: 18 }, { x: 10, y: 18 }, { x: 10, y: 16 },
    ],
  ];
}

function generateTianOutline(): Point[][] {
  return [
    [
      { x: 4, y: 4 }, { x: 16, y: 4 }, { x: 16, y: 6 },
      { x: 6, y: 6 }, { x: 6, y: 14 }, { x: 14, y: 14 },
      { x: 14, y: 6 }, { x: 16, y: 6 }, { x: 16, y: 16 },
      { x: 4, y: 16 }, { x: 4, y: 4 },
    ],
    [
      { x: 6, y: 10 }, { x: 14, y: 10 },
    ],
    [
      { x: 10, y: 6 }, { x: 10, y: 14 },
    ],
  ];
}

function generateXiaOutline(): Point[][] {
  return [
    [
      { x: 4, y: 4 }, { x: 16, y: 4 }, { x: 16, y: 6 },
      { x: 4, y: 6 }, { x: 4, y: 4 },
    ],
    [
      { x: 10, y: 6 }, { x: 10, y: 14 },
    ],
    [
      { x: 6, y: 16 }, { x: 8, y: 14 }, { x: 10, y: 16 },
      { x: 12, y: 14 }, { x: 14, y: 16 }, { x: 6, y: 16 },
    ],
  ];
}

function generateZhiOutline(): Point[][] {
  return [
    [
      { x: 6, y: 4 }, { x: 8, y: 4 }, { x: 10, y: 6 },
      { x: 10, y: 8 }, { x: 8, y: 10 }, { x: 6, y: 10 },
      { x: 4, y: 8 }, { x: 4, y: 6 }, { x: 6, y: 4 },
    ],
    [
      { x: 8, y: 12 }, { x: 8, y: 18 },
    ],
    [
      { x: 8, y: 18 }, { x: 4, y: 18 }, { x: 4, y: 18 },
    ],
  ];
}

function generateRenOutline(): Point[][] {
  return [
    [
      { x: 10, y: 4 }, { x: 4, y: 18 }, { x: 6, y: 18 },
      { x: 10, y: 8 }, { x: 14, y: 18 }, { x: 16, y: 18 },
      { x: 10, y: 4 },
    ],
  ];
}

function generateDaOutline(): Point[][] {
  return [
    [
      { x: 4, y: 6 }, { x: 16, y: 6 }, { x: 16, y: 8 },
      { x: 4, y: 8 }, { x: 4, y: 6 },
    ],
    [
      { x: 10, y: 4 }, { x: 10, y: 8 },
    ],
    [
      { x: 10, y: 8 }, { x: 4, y: 18 }, { x: 6, y: 18 },
      { x: 10, y: 12 }, { x: 14, y: 18 }, { x: 16, y: 18 },
      { x: 10, y: 8 },
    ],
  ];
}

function generateXiaoOutline(): Point[][] {
  return [
    [
      { x: 10, y: 4 }, { x: 10, y: 14 },
    ],
    [
      { x: 4, y: 8 }, { x: 6, y: 8 }, { x: 6, y: 10 },
      { x: 4, y: 10 }, { x: 4, y: 8 },
    ],
    [
      { x: 14, y: 8 }, { x: 16, y: 8 }, { x: 16, y: 10 },
      { x: 14, y: 10 }, { x: 14, y: 8 },
    ],
    [
      { x: 6, y: 16 }, { x: 8, y: 14 }, { x: 10, y: 16 },
      { x: 12, y: 14 }, { x: 14, y: 16 }, { x: 6, y: 16 },
    ],
  ];
}

function generateZhongOutline(): Point[][] {
  return [
    [
      { x: 6, y: 4 }, { x: 14, y: 4 }, { x: 14, y: 6 },
      { x: 12, y: 6 }, { x: 12, y: 14 }, { x: 14, y: 14 },
      { x: 14, y: 16 }, { x: 6, y: 16 }, { x: 6, y: 14 },
      { x: 8, y: 14 }, { x: 8, y: 6 }, { x: 6, y: 6 },
      { x: 6, y: 4 },
    ],
    [
      { x: 10, y: 2 }, { x: 10, y: 18 },
    ],
  ];
}

function generateGuoOutline(): Point[][] {
  return [
    [
      { x: 4, y: 4 }, { x: 16, y: 4 }, { x: 16, y: 16 },
      { x: 4, y: 16 }, { x: 4, y: 4 },
    ],
    [
      { x: 6, y: 6 }, { x: 14, y: 6 }, { x: 14, y: 8 },
      { x: 6, y: 8 }, { x: 6, y: 6 },
    ],
    [
      { x: 10, y: 8 }, { x: 10, y: 12 },
    ],
    [
      { x: 6, y: 10 }, { x: 14, y: 10 },
    ],
    [
      { x: 6, y: 12 }, { x: 8, y: 12 }, { x: 8, y: 14 },
      { x: 12, y: 14 }, { x: 12, y: 12 }, { x: 14, y: 12 },
      { x: 14, y: 14 }, { x: 6, y: 14 }, { x: 6, y: 12 },
    ],
  ];
}

function createGlyph(char: string, outline: Point[][]): CharGlyph {
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  for (const path of outline) {
    for (const p of path) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  return {
    char,
    unicode: char.charCodeAt(0),
    outline,
    boundingBox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    advanceWidth: 20,
  };
}

export class FontRecognizer {
  static async recognizeFromImage(
    imageDataUrl: string
  ): Promise<RecognitionResult> {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));
        
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const glyphs = this.extractGlyphs(imageData);
        
        const processingTime = performance.now() - startTime;
        resolve({ glyphs, processingTime });
      };
      img.src = imageDataUrl;
    });
  }

  static async recognizeFromCanvas(
    canvas: HTMLCanvasElement
  ): Promise<RecognitionResult> {
    const startTime = performance.now();
    
    const maxSize = 100;
    const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, Math.floor(canvas.width * scale));
    offscreen.height = Math.max(1, Math.floor(canvas.height * scale));
    
    const ctx = offscreen.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
    
    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const glyphs = this.extractGlyphs(imageData);
    
    const processingTime = performance.now() - startTime;
    return { glyphs, processingTime };
  }

  private static extractGlyphs(imageData: ImageData): CharGlyph[] {
    const hasContent = this.hasDrawingContent(imageData);
    
    if (!hasContent) {
      return Object.entries(PREDEFINED_GLYPHS).map(([char, outline]) =>
        createGlyph(char, outline)
      );
    }

    const outline = this.extractOutline(imageData);
    const glyphs: CharGlyph[] = [];
    
    if (outline.length > 0 && outline[0].length > 0) {
      const normalizedOutline = this.normalizeOutline(outline);
      const chars = Object.keys(PREDEFINED_GLYPHS);
      const randomChar = chars[Math.floor(Math.random() * chars.length)];
      glyphs.push(createGlyph(randomChar, normalizedOutline));
    }
    
    const defaultGlyphs = Object.entries(PREDEFINED_GLYPHS)
      .filter(([char]) => glyphs.length === 0 || glyphs[0].char !== char)
      .slice(0, 9)
      .map(([char, o]) => createGlyph(char, o));
    
    return [...glyphs, ...defaultGlyphs];
  }

  private static hasDrawingContent(imageData: ImageData): boolean {
    const data = imageData.data;
    let darkPixels = 0;
    const threshold = 200;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < threshold) {
        darkPixels++;
      }
    }

    const totalPixels = imageData.width * imageData.height;
    return darkPixels > totalPixels * 0.01;
  }

  private static extractOutline(imageData: ImageData): Point[][] {
    const { width, height, data } = imageData;
    const threshold = 200;
    const visited = new Set<string>();
    const outlines: Point[][] = [];

    const isDark = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      return brightness < threshold;
    };

    const isEdge = (x: number, y: number) => {
      if (!isDark(x, y)) return false;
      return (
        !isDark(x - 1, y) ||
        !isDark(x + 1, y) ||
        !isDark(x, y - 1) ||
        !isDark(x, y + 1)
      );
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        if (isEdge(x, y) && !visited.has(key)) {
          const outline: Point[] = [];
          let cx = x, cy = y;
          let dir = 0;
          const directions = [
            [0, -1], [1, -1], [1, 0], [1, 1],
            [0, 1], [-1, 1], [-1, 0], [-1, -1],
          ];

          while (!visited.has(`${cx},${cy}`) && outline.length < 200) {
            visited.add(`${cx},${cy}`);
            outline.push({ x: cx, y: cy });
            
            let found = false;
            for (let d = 0; d < 8; d++) {
              const nd = (dir + d + 6) % 8;
              const [dx, dy] = directions[nd];
              const nx = cx + dx, ny = cy + dy;
              if (isEdge(nx, ny) && !visited.has(`${nx},${ny}`)) {
                cx = nx;
                cy = ny;
                dir = nd;
                found = true;
                break;
              }
            }
            if (!found) break;
          }

          if (outline.length >= 5) {
            outlines.push(outline);
          }
        }
      }
    }

    return outlines;
  }

  private static normalizeOutline(outlines: Point[][]): Point[][] {
    if (outlines.length === 0) return outlines;

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    for (const outline of outlines) {
      for (const p of outline) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }

    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = Math.min(16 / w, 12 / h);
    const offsetX = (20 - w * scale) / 2;
    const offsetY = (20 - h * scale) / 2;

    return outlines.map((outline) =>
      outline.map((p) => ({
        x: Math.round((p.x - minX) * scale + offsetX),
        y: Math.round((p.y - minY) * scale + offsetY),
      }))
    );
  }

  public static getPredefinedGlyphs(): CharGlyph[] {
    return Object.entries(PREDEFINED_GLYPHS).map(([char, outline]) =>
      createGlyph(char, outline)
    );
  }
}
