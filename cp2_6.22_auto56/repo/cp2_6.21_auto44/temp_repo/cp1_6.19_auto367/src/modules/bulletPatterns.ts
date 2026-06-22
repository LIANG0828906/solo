export interface Bullet {
  x: number;
  y: number;
  speed: number;
  angle: number;
  color: string;
  active: boolean;
}

export interface ColorTheme {
  name: string;
  colors: string[];
  type: 'gradient' | 'random';
}

export const colorThemes: ColorTheme[] = [
  {
    name: '火焰红橙',
    colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700'],
    type: 'gradient',
  },
  {
    name: '冰霜蓝紫',
    colors: ['#00BFFF', '#1E90FF', '#6495ED', '#7B68EE', '#8A2BE2'],
    type: 'gradient',
  },
  {
    name: '霓虹绿粉',
    colors: ['#39FF14', '#00FA9A', '#00FF7F', '#FF69B4', '#FF1493'],
    type: 'gradient',
  },
  {
    name: '金属银灰',
    colors: ['#C0C0C0', '#A9A9A9', '#808080', '#696969', '#778899'],
    type: 'gradient',
  },
  {
    name: '暗夜彩虹',
    colors: ['#800080', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF0000', '#FF00FF'],
    type: 'gradient',
  },
  {
    name: '随机多彩',
    colors: ['#FF4500', '#00BFFF', '#39FF14', '#FF69B4', '#FFD700', '#8A2BE2', '#00FFFF', '#FF1493'],
    type: 'random',
  },
];

export function getColorFromTheme(theme: ColorTheme, index: number, total: number): string {
  if (theme.type === 'random') {
    return theme.colors[Math.floor(Math.random() * theme.colors.length)];
  }
  const ratio = total <= 1 ? 0 : index / (total - 1);
  const colorIndex = Math.min(Math.floor(ratio * theme.colors.length), theme.colors.length - 1);
  return theme.colors[colorIndex];
}

export function createFanPattern(
  originX: number,
  originY: number,
  params: { bulletCount: number; angleRange: number; speed: number },
  theme: ColorTheme
): Bullet[] {
  const bullets: Bullet[] = new Array(params.bulletCount);
  const startAngle = -params.angleRange / 2;
  const step = params.bulletCount <= 1 ? 0 : params.angleRange / (params.bulletCount - 1);

  for (let i = 0; i < params.bulletCount; i++) {
    const angleDeg = startAngle + step * i;
    const angleRad = (angleDeg * Math.PI) / 180;
    bullets[i] = {
      x: originX,
      y: originY,
      speed: params.speed,
      angle: angleRad,
      color: getColorFromTheme(theme, i, params.bulletCount),
      active: true,
    };
  }
  return bullets;
}

export function createSpiralPattern(
  originX: number,
  originY: number,
  params: { rotations: number; bulletsPerRotation: number; speed: number },
  theme: ColorTheme
): Bullet[] {
  const totalBullets = params.rotations * params.bulletsPerRotation;
  const bullets: Bullet[] = new Array(totalBullets);
  const angleStep = (Math.PI * 2) / params.bulletsPerRotation;

  for (let i = 0; i < totalBullets; i++) {
    const angle = i * angleStep;
    bullets[i] = {
      x: originX,
      y: originY,
      speed: params.speed,
      angle: angle,
      color: getColorFromTheme(theme, i, totalBullets),
      active: true,
    };
  }
  return bullets;
}

export function createWavePattern(
  originX: number,
  originY: number,
  params: { bulletCount: number; amplitude: number; frequency: number; speed: number },
  theme: ColorTheme
): Bullet[] {
  const bullets: Bullet[] = new Array(params.bulletCount);
  const spreadAngle = (Math.PI * 2) / params.bulletCount;

  for (let i = 0; i < params.bulletCount; i++) {
    const baseAngle = spreadAngle * i;
    const waveOffset = Math.sin(baseAngle * params.frequency) * (params.amplitude * Math.PI / 180);
    const finalAngle = baseAngle + waveOffset;
    bullets[i] = {
      x: originX,
      y: originY,
      speed: params.speed,
      angle: finalAngle,
      color: getColorFromTheme(theme, i, params.bulletCount),
      active: true,
    };
  }
  return bullets;
}

export function createRandomPattern(
  originX: number,
  originY: number,
  params: { bulletCount: number; minSpeed: number; maxSpeed: number },
  theme: ColorTheme
): Bullet[] {
  const bullets: Bullet[] = new Array(params.bulletCount);
  const speedRange = params.maxSpeed - params.minSpeed;

  for (let i = 0; i < params.bulletCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = params.minSpeed + Math.random() * speedRange;
    bullets[i] = {
      x: originX,
      y: originY,
      speed: speed,
      angle: angle,
      color: getColorFromTheme(theme, i, params.bulletCount),
      active: true,
    };
  }
  return bullets;
}
