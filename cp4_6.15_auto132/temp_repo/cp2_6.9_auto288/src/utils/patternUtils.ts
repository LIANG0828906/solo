export const deepCopyPattern = (pattern: number[][]): number[][] => {
  return pattern.map(row => [...row]);
};

export const patternToDataUrl = (
  pattern: number[][],
  lightColor: string = '#c4a35a',
  darkColor: string = '#5c3a1e',
  size: number = 200
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cellSize = size / 8;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = pattern[row][col] === 1 ? lightColor : darkColor;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      
      ctx.strokeStyle = 'rgba(160, 128, 96, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
  
  return canvas.toDataURL('image/png');
};

export const generatePatternTexture = (
  pattern: number[][],
  lacquerColor: string,
  bambooColor: string
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cellSize = 32;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = pattern[row][col] === 1;
      
      const baseColor = isLight ? bambooColor : adjustColor(bambooColor, -30);
      ctx.fillStyle = blendColors(baseColor, lacquerColor, 0.3);
      
      const x = col * cellSize;
      const y = row * cellSize;
      
      ctx.fillRect(x, y, cellSize, cellSize);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${isLight ? 0.15 : 0.05})`;
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
  
  return canvas;
};

const adjustColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
};

const blendColors = (c1: string, c2: string, ratio: number): string => {
  const parseColor = (c: string): [number, number, number] => {
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
    const match = c.match(/\d+/g);
    if (match) return match.map(Number) as [number, number, number];
    return [200, 180, 140];
  };
  
  const [r1, g1, b1] = parseColor(c1);
  const [r2, g2, b2] = parseColor(c2);
  
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
};
