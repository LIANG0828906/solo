export type BulletPatternType = 'fan' | 'spiral' | 'spread';

export interface BulletPattern {
  id: string;
  type: BulletPatternType;
  angleRange: number;
  bulletSpeed: number;
  bulletDensity: number;
  colorStart: string;
  colorEnd: string;
  gravityEnabled: boolean;
  gravityStrength: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  patternId: string;
  life: number;
  maxLife: number;
}

export interface SpawnPoint {
  x: number;
  y: number;
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

const lerpColor = (color1: string, color2: string, t: number): string => {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const generateInitialAngles = (
  pattern: BulletPattern,
  time: number
): number[] => {
  const angles: number[] = [];
  const { type, angleRange, bulletDensity } = pattern;

  switch (type) {
    case 'fan': {
      const startAngle = -angleRange / 2;
      const step = angleRange / Math.max(bulletDensity - 1, 1);
      for (let i = 0; i < bulletDensity; i++) {
        angles.push(degToRad(startAngle + step * i));
      }
      break;
    }
    case 'spiral': {
      const baseAngle = (time * 180) % 360;
      const angleStep = angleRange / Math.max(bulletDensity, 1);
      for (let i = 0; i < bulletDensity; i++) {
        const offset = angleStep * i - angleRange / 2;
        const randomOffset = (Math.random() - 0.5) * 5;
        angles.push(degToRad(baseAngle + offset + randomOffset));
      }
      break;
    }
    case 'spread': {
      for (let i = 0; i < bulletDensity; i++) {
        const baseAngle = (Math.random() - 0.5) * angleRange;
        const randomOffset = (Math.random() - 0.5) * (angleRange * 0.3);
        angles.push(degToRad(baseAngle + randomOffset));
      }
      break;
    }
    default:
      angles.push(0);
  }

  return angles;
};

export const createBullets = (
  pattern: BulletPattern,
  spawnPoint: SpawnPoint,
  time: number,
  direction: number = 0
): Bullet[] => {
  const angles = generateInitialAngles(pattern, time);
  const bullets: Bullet[] = [];

  angles.forEach((angle, index) => {
    const totalAngle = angle + degToRad(direction);
    const colorT = angles.length > 1 ? index / (angles.length - 1) : 0.5;
    const color = lerpColor(pattern.colorStart, pattern.colorEnd, colorT);
    const speedVariation = 0.8 + Math.random() * 0.4;

    bullets.push({
      id: `${pattern.id}-${time}-${index}-${Math.random().toString(36).slice(2, 9)}`,
      x: spawnPoint.x,
      y: spawnPoint.y,
      vx: Math.cos(totalAngle) * pattern.bulletSpeed * speedVariation,
      vy: Math.sin(totalAngle) * pattern.bulletSpeed * speedVariation,
      color,
      patternId: pattern.id,
      life: 0,
      maxLife: 300 + Math.random() * 100,
    });
  });

  return bullets;
};

export const updateBullet = (
  bullet: Bullet,
  deltaTime: number,
  gravityEnabled: boolean,
  gravityStrength: number
): Bullet => {
  let newVy = bullet.vy;

  if (gravityEnabled) {
    newVy += gravityStrength * deltaTime * 60;
  }

  return {
    ...bullet,
    x: bullet.x + bullet.vx * deltaTime * 60,
    y: bullet.y + newVy * deltaTime * 60,
    vy: newVy,
    life: bullet.life + deltaTime * 60,
  };
};

export const isBulletOutOfBounds = (
  bullet: Bullet,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 50
): boolean => {
  return (
    bullet.x < -margin ||
    bullet.x > canvasWidth + margin ||
    bullet.y < -margin ||
    bullet.y > canvasHeight + margin ||
    bullet.life >= bullet.maxLife
  );
};

export const getBulletOpacity = (bullet: Bullet): number => {
  const lifeRatio = bullet.life / bullet.maxLife;
  if (lifeRatio < 0.1) {
    return lifeRatio / 0.1;
  }
  if (lifeRatio > 0.8) {
    return (1 - lifeRatio) / 0.2;
  }
  return 1;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};
