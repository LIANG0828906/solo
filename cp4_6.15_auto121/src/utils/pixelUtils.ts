export type PixelArray = (string | null)[][];

export const CANVAS_SIZE = 25;

export const DEFAULT_PALETTE: string[] = [
  '#000000', '#ffffff', '#7f7f7f', '#c0c0c0',
  '#ff0000', '#ff7f00', '#ffff00', '#00ff00',
  '#00ffff', '#007fff', '#0000ff', '#7f00ff',
  '#ff00ff', '#7f3f00', '#8b4513', '#ffc0cb'
];

export function createEmptyPixelArray(size: number = CANVAS_SIZE): PixelArray {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function renderPixelsToCanvas(
  ctx: CanvasRenderingContext2D,
  pixels: PixelArray,
  cellSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): void {
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const color = pixels[y][x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + x * cellSize,
          offsetY + y * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
}

export function renderPixelsToImageCanvas(
  ctx: CanvasRenderingContext2D,
  pixels: PixelArray,
  pixelSize: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
): void {
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const color = pixels[y][x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + x * pixelSize,
          offsetY + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

export function generateSpriteSheet(
  frames: PixelArray[],
  separatorWidth: number = 1
): {
  canvas: HTMLCanvasElement;
  frameInfo: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
} {
  const frameSize = CANVAS_SIZE;
  const totalWidth = frames.length * frameSize + (frames.length - 1) * separatorWidth;
  const totalHeight = frameSize;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.clearRect(0, 0, totalWidth, totalHeight);

  const frameInfo: { x: number; y: number; width: number; height: number }[] = [];

  for (let i = 0; i < frames.length; i++) {
    const x = i * (frameSize + separatorWidth);
    const y = 0;

    if (i > 0 && separatorWidth > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - separatorWidth, 0, separatorWidth, totalHeight);
    }

    renderPixelsToImageCanvas(ctx, frames[i], 1, x, y);
    frameInfo.push({ x, y, width: frameSize, height: frameSize });
  }

  return { canvas, frameInfo };
}

export function deepClonePixels(pixels: PixelArray): PixelArray {
  return pixels.map((row) => [...row]);
}

export function getMirrorX(x: number, size: number = CANVAS_SIZE): number {
  return size - 1 - x;
}

export function createDefaultWalkFrames(): PixelArray[] {
  const frames: PixelArray[] = [
    createStandingFrame(),
    createLeftLegUpFrame(),
    createStrideFrame(),
    createRightLegUpFrame(),
  ];
  return frames;
}

function createStandingFrame(): PixelArray {
  const pixels = createEmptyPixelArray();
  const skin = '#f4c2a1';
  const hair = '#4a3728';
  const shirt = '#3498db';
  const pants = '#2c3e50';
  const shoe = '#1a1a1a';
  const eye = '#1a1a1a';

  for (let x = 9; x <= 15; x++) {
    for (let y = 3; y <= 5; y++) {
      pixels[y][x] = hair;
    }
  }
  for (let x = 8; x <= 16; x++) {
    pixels[6][x] = hair;
  }

  for (let x = 9; x <= 15; x++) {
    for (let y = 7; y <= 11; y++) {
      pixels[y][x] = skin;
    }
  }
  pixels[8][10] = eye;
  pixels[8][14] = eye;
  pixels[10][12] = '#c0392b';

  for (let x = 8; x <= 16; x++) {
    for (let y = 12; y <= 17; y++) {
      pixels[y][x] = shirt;
    }
  }
  for (let y = 12; y <= 17; y++) {
    pixels[y][7] = skin;
    pixels[y][17] = skin;
  }
  for (let x = 6; x <= 7; x++) {
    for (let y = 13; y <= 16; y++) {
      pixels[y][x] = skin;
    }
  }
  for (let x = 17; x <= 18; x++) {
    for (let y = 13; y <= 16; y++) {
      pixels[y][x] = skin;
    }
  }

  for (let x = 9; x <= 11; x++) {
    for (let y = 18; y <= 21; y++) {
      pixels[y][x] = pants;
    }
  }
  for (let x = 13; x <= 15; x++) {
    for (let y = 18; y <= 21; y++) {
      pixels[y][x] = pants;
    }
  }

  for (let x = 8; x <= 12; x++) {
    for (let y = 22; y <= 23; y++) {
      pixels[y][x] = shoe;
    }
  }
  for (let x = 12; x <= 16; x++) {
    for (let y = 22; y <= 23; y++) {
      pixels[y][x] = shoe;
    }
  }

  return pixels;
}

function createLeftLegUpFrame(): PixelArray {
  const pixels = createStandingFrame();
  const pants = '#2c3e50';
  const shoe = '#1a1a1a';

  for (let x = 9; x <= 11; x++) {
    for (let y = 18; y <= 23; y++) {
      pixels[y][x] = null;
    }
  }

  for (let x = 9; x <= 11; x++) {
    for (let y = 18; y <= 20; y++) {
      pixels[y][x] = pants;
    }
  }
  for (let x = 8; x <= 11; x++) {
    pixels[21][x] = pants;
  }
  for (let x = 7; x <= 10; x++) {
    pixels[22][x] = shoe;
  }

  return pixels;
}

function createStrideFrame(): PixelArray {
  const pixels = createStandingFrame();
  const pants = '#2c3e50';
  const shoe = '#1a1a1a';
  const shirt = '#3498db';
  const skin = '#f4c2a1';

  for (let x = 9; x <= 11; x++) {
    for (let y = 18; y <= 23; y++) {
      pixels[y][x] = null;
    }
  }
  for (let x = 13; x <= 15; x++) {
    for (let y = 18; y <= 23; y++) {
      pixels[y][x] = null;
    }
  }

  for (let x = 7; x <= 9; x++) {
    for (let y = 18; y <= 20; y++) {
      pixels[y][x] = pants;
    }
  }
  for (let x = 6; x <= 8; x++) {
    pixels[21][x] = pants;
  }
  for (let x = 5; x <= 8; x++) {
    pixels[22][x] = shoe;
  }

  for (let x = 15; x <= 17; x++) {
    for (let y = 18; y <= 20; y++) {
      pixels[y][x] = pants;
    }
  }
  for (let x = 16; x <= 18; x++) {
    pixels[21][x] = pants;
  }
  for (let x = 16; x <= 19; x++) {
    pixels[22][x] = shoe;
  }

  for (let y = 12; y <= 17; y++) {
    pixels[y][7] = shirt;
    pixels[y][17] = shirt;
  }
  for (let x = 5; x <= 6; x++) {
    for (let y = 13; y <= 15; y++) {
      pixels[y][x] = skin;
    }
  }
  for (let x = 18; x <= 19; x++) {
    for (let y = 13; y <= 15; y++) {
      pixels[y][x] = skin;
    }
  }

  return pixels;
}

function createRightLegUpFrame(): PixelArray {
  const pixels = createStandingFrame();
  const pants = '#2c3e50';
  const shoe = '#1a1a1a';

  for (let x = 13; x <= 15; x++) {
    for (let y = 18; y <= 23; y++) {
      pixels[y][x] = null;
    }
  }

  for (let x = 13; x <= 15; x++) {
    for (let y = 18; y <= 20; y++) {
      pixels[y][x] = pants;
    }
  }
  for (let x = 13; x <= 16; x++) {
    pixels[21][x] = pants;
  }
  for (let x = 14; x <= 17; x++) {
    pixels[22][x] = shoe;
  }

  return pixels;
}
