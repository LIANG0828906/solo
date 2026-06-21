export interface PatternParams {
  depth: number;
  angle: number;
  scale: number;
  theme: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
}

const themes: Record<string, ThemeColors> = {
  ocean: { primary: '#00BCD4', secondary: '#0288D1' },
  sunset: { primary: '#FF7043', secondary: '#E91E63' },
  aurora: { primary: '#66BB6A', secondary: '#9C27B0' },
  vintage: { primary: '#FFB74D', secondary: '#8D6E63' }
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function createShape(
  type: 'circle' | 'square' | 'triangle',
  cx: number,
  cy: number,
  size: number,
  fillColor: string,
  strokeColor: string,
  strokeOpacity: number
): string {
  const strokeRgb = hexToRgb(strokeColor);
  const stroke = `rgba(${strokeRgb.r}, ${strokeRgb.g}, ${strokeRgb.b}, ${strokeOpacity})`;

  switch (type) {
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${fillColor}" stroke="${stroke}" stroke-width="1.5"/>`;
    case 'square': {
      const half = size / 2;
      return `<rect x="${cx - half}" y="${cy - half}" width="${size}" height="${size}" fill="${fillColor}" stroke="${stroke}" stroke-width="1.5"/>`;
    }
    case 'triangle': {
      const h = size * 0.866;
      const points = `${cx},${cy - size / 2} ${cx - size / 2},${cy + h / 2} ${cx + size / 2},${cy + h / 2}`;
      return `<polygon points="${points}" fill="${fillColor}" stroke="${stroke}" stroke-width="1.5"/>`;
    }
  }
}

function radialFractal(
  cx: number,
  cy: number,
  size: number,
  depth: number,
  maxDepth: number,
  angle: number,
  scale: number,
  themeColors: ThemeColors,
  shapeType: 'circle' | 'square' | 'triangle',
  arms: number,
  result: string[]
): void {
  if (depth > maxDepth || size < 3) return;

  const depthRatio = (depth - 1) / (maxDepth - 1 || 1);
  const fillBase = lerpColor(themeColors.primary, themeColors.secondary, depthRatio);
  const fillRgb = hexToRgb(fillBase);
  const fillOpacity = 0.15 + (1 - depthRatio) * 0.35;
  const fillColor = `rgba(${fillRgb.r}, ${fillRgb.g}, ${fillRgb.b}, ${fillOpacity})`;
  const strokeOpacity = 0.6;

  result.push(createShape(shapeType, cx, cy, size, fillColor, themeColors.primary, strokeOpacity));

  if (depth < maxDepth) {
    const newSize = size * scale;
    const distance = size * 0.65;
    const baseAngle = (angle * Math.PI) / 180;

    for (let i = 0; i < arms; i++) {
      const rot = baseAngle + (i * 2 * Math.PI) / arms;
      const nx = cx + Math.cos(rot) * distance;
      const ny = cy + Math.sin(rot) * distance;

      radialFractal(
        nx,
        ny,
        newSize,
        depth + 1,
        maxDepth,
        angle + 25,
        scale,
        themeColors,
        shapeType,
        arms,
        result
      );
    }
  }
}

export function generatePattern(params: PatternParams, width: number = 800, height: number = 600): string {
  const { depth, angle, scale, theme } = params;
  const themeColors = themes[theme] || themes.ocean;

  const shapeTypes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
  const result: string[] = [];

  const centerX = width / 2;
  const centerY = height / 2;
  const initialSize = Math.min(width, height) * 0.22;

  radialFractal(
    centerX,
    centerY,
    initialSize,
    1,
    depth,
    angle,
    scale,
    themeColors,
    shapeTypes[0],
    6,
    result
  );

  const secondSize = initialSize * 0.65;
  const secondRadius = initialSize * 0.5;
  for (let i = 0; i < 6; i++) {
    const rot = (angle * Math.PI) / 180 + Math.PI / 6 + (i * 2 * Math.PI) / 6;
    const x = centerX + Math.cos(rot) * secondRadius;
    const y = centerY + Math.sin(rot) * secondRadius;

    radialFractal(
      x,
      y,
      secondSize,
      1,
      Math.max(2, depth - 1),
      angle + 30,
      scale,
      themeColors,
      shapeTypes[1],
      5,
      result
    );
  }

  if (depth >= 4) {
    const thirdSize = initialSize * 0.35;
    const thirdRadius = initialSize * 0.9;
    const thirdDepth = Math.max(2, depth - 2);
    const thirdCount = 8;

    for (let i = 0; i < thirdCount; i++) {
      const rot = (angle * 0.7 * Math.PI) / 180 + (i * 2 * Math.PI) / thirdCount;
      const x = centerX + Math.cos(rot) * thirdRadius;
      const y = centerY + Math.sin(rot) * thirdRadius;

      radialFractal(
        x,
        y,
        thirdSize,
        1,
        thirdDepth,
        angle - 20,
        scale,
        themeColors,
        shapeTypes[2],
        4,
        result
      );
    }
  }

  if (depth >= 5) {
    const outerSize = initialSize * 0.2;
    const outerRadius = initialSize * 1.2;
    const outerDepth = Math.max(2, depth - 3);
    const outerCount = 12;

    for (let i = 0; i < outerCount; i++) {
      const rot = (angle * 0.5 * Math.PI) / 180 + (i * 2 * Math.PI) / outerCount;
      const x = centerX + Math.cos(rot) * outerRadius;
      const y = centerY + Math.sin(rot) * outerRadius;

      radialFractal(
        x,
        y,
        outerSize,
        1,
        outerDepth,
        angle + 45,
        scale,
        themeColors,
        shapeTypes[i % 3],
        3,
        result
      );
    }
  }

  return result.join('');
}

export function getThemes(): { key: string; label: string }[] {
  return [
    { key: 'ocean', label: '海洋蓝青 (#00BCD4 - #0288D1)' },
    { key: 'sunset', label: '日落橙粉 (#FF7043 - #E91E63)' },
    { key: 'aurora', label: '极光绿紫 (#66BB6A - #9C27B0)' },
    { key: 'vintage', label: '复古暖棕 (#FFB74D - #8D6E63)' }
  ];
}
