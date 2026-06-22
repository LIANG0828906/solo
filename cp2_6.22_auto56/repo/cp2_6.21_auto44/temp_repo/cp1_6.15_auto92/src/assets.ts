export interface Food {
  id: string;
  name: string;
  pixels: number[][];
  color: string;
}

export interface ToolIcon {
  id: string;
  pixels: number[][];
}

const PIXEL_SIZE = 2;
const spriteCache: Map<string, HTMLCanvasElement> = new Map();

export const FOODS: Food[] = [
  {
    id: 'fish',
    name: '小鱼干',
    color: '#f4a460',
    pixels: [
      [0,0,0,0,1,1,0,0],
      [0,0,0,1,1,1,1,0],
      [0,0,1,1,1,1,1,1],
      [1,1,1,1,1,1,0,1],
      [1,1,1,1,1,0,0,1],
      [0,0,1,1,1,1,1,1],
      [0,0,0,1,1,1,1,0],
      [0,0,0,0,1,1,0,0],
    ]
  },
  {
    id: 'strawberry',
    name: '草莓',
    color: '#ff4444',
    pixels: [
      [0,0,1,0,0,0,1,0],
      [0,1,0,1,0,1,0,0],
      [0,0,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
    ]
  },
  {
    id: 'bone',
    name: '骨头',
    color: '#f5f5dc',
    pixels: [
      [1,0,0,0,0,0,0,1],
      [1,1,0,0,0,0,1,1],
      [0,1,1,0,0,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,0,0,1,1,0],
      [1,1,0,0,0,0,1,1],
      [1,0,0,0,0,0,0,1],
    ]
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    color: '#ff8c00',
    pixels: [
      [0,0,1,0,1,0,0,0],
      [0,1,0,1,0,1,0,0],
      [0,0,1,1,1,0,0,0],
      [0,0,1,1,1,0,0,0],
      [0,1,1,1,1,1,0,0],
      [0,0,1,1,1,0,0,0],
      [0,0,0,1,0,0,0,0],
      [0,0,0,1,0,0,0,0],
    ]
  },
  {
    id: 'apple',
    name: '苹果',
    color: '#dc143c',
    pixels: [
      [0,0,0,1,0,0,0,0],
      [0,0,1,1,1,0,0,0],
      [0,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,0,0],
      [0,0,1,1,1,0,0,0],
    ]
  },
  {
    id: 'cake',
    name: '蛋糕',
    color: '#ffd700',
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [0,1,0,1,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
    ]
  },
  {
    id: 'meat',
    name: '肉块',
    color: '#8b4513',
    pixels: [
      [0,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [1,0,1,1,0,1,1,1],
      [1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0],
    ]
  },
  {
    id: 'cookie',
    name: '饼干',
    color: '#d2691e',
    pixels: [
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,0,1],
      [1,1,1,1,1,1,1,1],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
    ]
  },
  {
    id: 'bread',
    name: '面包',
    color: '#deb887',
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,0,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
    ]
  }
];

export const TOOL_ICONS: Record<string, ToolIcon> = {
  feed: {
    id: 'feed',
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,0,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
    ]
  },
  clean: {
    id: 'clean',
    pixels: [
      [0,0,1,0,0,0,0,0],
      [0,1,1,1,0,0,0,0],
      [1,1,1,1,1,0,0,0],
      [0,1,1,1,0,0,0,0],
      [0,0,1,0,0,1,0,0],
      [0,0,0,0,1,1,1,0],
      [0,0,0,1,1,1,1,1],
      [0,0,0,0,1,1,1,0],
    ]
  },
  play: {
    id: 'play',
    pixels: [
      [0,1,1,0,0,0,0,0],
      [1,1,1,1,0,0,0,0],
      [1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,0,0],
      [1,1,1,1,0,0,0,0],
      [0,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
    ]
  },
  sleep: {
    id: 'sleep',
    pixels: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,1,0,0,1,1,1],
      [1,1,0,0,0,0,1,1],
      [0,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,1],
    ]
  },
  settings: {
    id: 'settings',
    pixels: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [1,1,1,0,0,1,1,1],
      [1,1,0,1,1,0,1,1],
      [1,1,0,1,1,0,1,1],
      [1,1,1,0,0,1,1,1],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
    ]
  }
};

export const getSprite = (pixels: number[][], color: string, bgColor: string | null = null): HTMLCanvasElement => {
  const key = `${color}_${bgColor}_${JSON.stringify(pixels)}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  const w = pixels[0].length * PIXEL_SIZE;
  const h = pixels.length * PIXEL_SIZE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      if (pixels[y][x] === 1) {
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      } else if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }

  spriteCache.set(key, canvas);
  return canvas;
};

export const getPetSprite = (action: string, frame: number, petColor: string): HTMLCanvasElement => {
  const key = `pet_${action}_${frame}_${petColor}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const darkColor = shadeColor(petColor, -30);
  const lightColor = shadeColor(petColor, 30);

  const drawPixel = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * 2, y * 2, 2, 2);
  };

  if (action === 'walk') {
    const legOffset = frame % 2 === 0 ? 0 : 1;
    drawPetBody(drawPixel, petColor, darkColor, lightColor);
    drawPixel(5, 13, darkColor);
    drawPixel(6, 13 + legOffset, darkColor);
    drawPixel(9, 13, darkColor);
    drawPixel(10, 13 - legOffset, darkColor);
  } else if (action === 'jump') {
    const jumpY = frame === 0 ? -2 : frame === 1 ? -4 : frame === 2 ? -2 : 0;
    drawPetBody((x, y, c) => drawPixel(x, y + jumpY, c), petColor, darkColor, lightColor);
  } else if (action === 'sit') {
    drawPetBody(drawPixel, petColor, darkColor, lightColor);
    drawPixel(4, 13, darkColor);
    drawPixel(5, 13, darkColor);
    drawPixel(10, 13, darkColor);
    drawPixel(11, 13, darkColor);
    drawPixel(6, 14, darkColor);
    drawPixel(7, 14, darkColor);
    drawPixel(8, 14, darkColor);
    drawPixel(9, 14, darkColor);
  } else if (action === 'sleep') {
    drawPetBody(drawPixel, petColor, darkColor, lightColor);
    drawPixel(5, 7, '#ffffff');
    drawPixel(6, 7, '#ffffff');
    drawPixel(9, 7, '#ffffff');
    drawPixel(10, 7, '#ffffff');
    if (frame % 2 === 0) {
      drawPixel(12, 3, '#306230');
      drawPixel(13, 4, '#306230');
      drawPixel(13, 5, '#306230');
    }
  } else if (action === 'happy') {
    drawPetBody(drawPixel, petColor, darkColor, lightColor);
    drawPixel(5, 7, '#000000');
    drawPixel(6, 7, '#000000');
    drawPixel(9, 7, '#000000');
    drawPixel(10, 7, '#000000');
    drawPixel(6, 10, '#000000');
    drawPixel(7, 10, '#000000');
    drawPixel(8, 10, '#000000');
    drawPixel(9, 10, '#000000');
  }

  spriteCache.set(key, canvas);
  return canvas;
};

const drawPetBody = (draw: (x: number, y: number, c: string) => void, main: string, dark: string, light: string) => {
  for (let y = 4; y <= 13; y++) {
    for (let x = 3; x <= 12; x++) {
      if (y === 4 || y === 13 || x === 3 || x === 12) {
        draw(x, y, dark);
      } else {
        draw(x, y, main);
      }
    }
  }
  for (let y = 2; y <= 6; y++) {
    for (let x = 4; x <= 11; x++) {
      if (y === 2 || x === 4 || x === 11) {
        draw(x, y, dark);
      } else {
        draw(x, y, main);
      }
    }
  }
  draw(4, 3, dark);
  draw(11, 3, dark);
  draw(5, 7, '#000000');
  draw(6, 7, '#000000');
  draw(9, 7, '#000000');
  draw(10, 7, '#000000');
  draw(7, 9, '#000000');
  draw(8, 9, '#000000');
  draw(7, 10, dark);
  draw(8, 10, dark);
  draw(4, 8, light);
  draw(11, 8, light);
};

const shadeColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
};

export const getHeartSprite = (): HTMLCanvasElement => {
  const key = 'heart';
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const heartPixels = [
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,0,0,0,0,0],
  ];
  for (let y = 0; y < heartPixels.length; y++) {
    for (let x = 0; x < heartPixels[y].length; x++) {
      if (heartPixels[y][x] === 1) {
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(x * 2, y * 2, 2, 2);
      }
    }
  }
  spriteCache.set(key, canvas);
  return canvas;
};

export const getExclamationSprite = (color: string): HTMLCanvasElement => {
  const key = `excl_${color}`;
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 6; y++) {
    ctx.fillStyle = color;
    ctx.fillRect(2, y * 2, 4, 2);
  }
  ctx.fillStyle = color;
  ctx.fillRect(2, 14, 4, 2);
  spriteCache.set(key, canvas);
  return canvas;
};

export const COLORS = {
  GB_BG: '#9bbc0f',
  GB_DARK: '#306230',
  GB_LIGHT: '#8bac0f',
  GB_PALE: '#0f380f',
  HUNGER_LOW: '#ff4444',
  HUNGER_HIGH: '#ffdd44',
  CLEAN_LOW: '#4488ff',
  CLEAN_HIGH: '#ffffff',
  HAPPY_LOW: '#ff88cc',
  HAPPY_HIGH: '#aa66ff',
};
