export interface ParticleData {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

type CycloneType = 'cyclone' | 'anticyclone';

interface Particle {
  angle: number;
  baseRadius: number;
  currentRadius: number;
  targetRadius: number;
  height: number;
  liftSpeed: number;
  rotationSpeed: number;
  opacity: number;
  targetOpacity: number;
  age: number;
  phase: number;
  isNew: boolean;
}

const CYCLONE_COLORS = {
  bottom: { r: 0x21 / 255, g: 0x96 / 255, b: 0xf3 / 255 },
  top: { r: 0x9c / 255, g: 0x27 / 255, b: 0xb0 / 255 }
};

const ANTICYCLONE_COLORS = {
  bottom: { r: 0xff / 255, g: 0x57 / 255, b: 0x22 / 255 },
  top: { r: 0xff / 255, g: 0xeb / 255, b: 0x3b / 255 }
};

const MIN_HEIGHT = -6;
const MAX_HEIGHT = 6;
const MIN_RADIUS = 1;
const MAX_RADIUS = 6;
const TYPE_TRANSITION_DURATION = 3;
const DENSITY_TRANSITION_DURATION = 1;
const FADE_OUT_SPEED = 0.3;
const FADE_IN_SPEED = 0.5;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t)
  };
}

function createParticle(isNew = false): Particle {
  return {
    angle: Math.random() * Math.PI * 2,
    baseRadius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
    currentRadius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
    targetRadius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
    height: MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT),
    liftSpeed: 0.5 + Math.random() * 0.5,
    rotationSpeed: 0.5 + Math.random() * 0.5,
    opacity: isNew ? 0 : 0.9,
    targetOpacity: 0.9,
    age: 0,
    phase: Math.random() * Math.PI * 2,
    isNew
  };
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private cycloneType: CycloneType = 'cyclone';
  private targetCycloneType: CycloneType = 'cyclone';
  private typeTransitionProgress: number = 1;
  private windSpeed: number = 5;
  private targetDensity: number = 2000;
  private densityTransitionProgress: number = 1;

  constructor(initialCount: number = 2000) {
    for (let i = 0; i < initialCount; i++) {
      this.particles.push(createParticle(false));
    }
  }

  public setCycloneType(type: CycloneType): void {
    if (type !== this.targetCycloneType) {
      this.targetCycloneType = type;
      this.typeTransitionProgress = 0;
    }
  }

  public setWindSpeed(speed: number): void {
    this.windSpeed = Math.max(1, Math.min(10, speed));
  }

  public setDensity(count: number): void {
    const clampedCount = Math.max(1000, Math.min(5000, Math.floor(count)));
    if (clampedCount !== this.targetDensity) {
      this.targetDensity = clampedCount;
      this.densityTransitionProgress = 0;
    }
  }

  public getCount(): number {
    return this.particles.length;
  }

  public update(deltaTime: number): ParticleData[] {
    if (this.typeTransitionProgress < 1) {
      this.typeTransitionProgress = Math.min(
        1,
        this.typeTransitionProgress + deltaTime / TYPE_TRANSITION_DURATION
      );
      if (this.typeTransitionProgress >= 1) {
        this.cycloneType = this.targetCycloneType;
      }
    }

    if (this.densityTransitionProgress < 1) {
      this.densityTransitionProgress = Math.min(
        1,
        this.densityTransitionProgress + deltaTime / DENSITY_TRANSITION_DURATION
      );
      this.adjustParticleCount();
    }

    const easedTypeProgress = easeInOutCubic(this.typeTransitionProgress);
    const currentDirection = this.cycloneType === 'cyclone' ? 1 : -1;
    const targetDirection = this.targetCycloneType === 'cyclone' ? 1 : -1;
    const direction = lerp(currentDirection, targetDirection, easedTypeProgress);

    const baseSpeed = this.windSpeed * 0.15;
    const result: ParticleData[] = [];

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += deltaTime;

      p.angle += direction * baseSpeed * p.rotationSpeed * deltaTime;

      const liftAmount = baseSpeed * 0.5 * p.liftSpeed * deltaTime;
      p.height += liftAmount;
      if (p.height > MAX_HEIGHT) {
        p.height = MIN_HEIGHT + (p.height - MAX_HEIGHT);
        p.angle = Math.random() * Math.PI * 2;
      }

      const heightNormalized = (p.height - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT);
      const radiusShrink = 0.75 + heightNormalized * 0.25;
      const effectiveBaseRadius = p.baseRadius * radiusShrink;
      const radiusOscillation = Math.sin(p.age * p.rotationSpeed + p.phase) * 0.1;
      p.currentRadius = effectiveBaseRadius + radiusOscillation;

      if (p.isNew) {
        p.opacity = Math.min(p.targetOpacity, p.opacity + FADE_IN_SPEED * deltaTime);
        if (p.opacity >= p.targetOpacity) {
          p.isNew = false;
        }
      } else if (p.targetOpacity < p.opacity) {
        p.opacity = Math.max(0, p.opacity - FADE_OUT_SPEED * deltaTime);
      }

      if (p.opacity <= 0 && p.targetOpacity === 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const x = Math.cos(p.angle) * p.currentRadius;
      const y = p.height;
      const z = Math.sin(p.angle) * p.currentRadius;

      const cycloneColor = lerpColor(CYCLONE_COLORS.bottom, CYCLONE_COLORS.top, heightNormalized);
      const anticycloneColor = lerpColor(ANTICYCLONE_COLORS.bottom, ANTICYCLONE_COLORS.top, heightNormalized);

      let color;
      if (this.cycloneType === 'cyclone' && this.targetCycloneType === 'cyclone') {
        color = cycloneColor;
      } else if (this.cycloneType === 'anticyclone' && this.targetCycloneType === 'anticyclone') {
        color = anticycloneColor;
      } else if (this.cycloneType === 'cyclone') {
        color = lerpColor(cycloneColor, anticycloneColor, easedTypeProgress);
      } else {
        color = lerpColor(anticycloneColor, cycloneColor, easedTypeProgress);
      }

      result.push({
        x,
        y,
        z,
        r: color.r,
        g: color.g,
        b: color.b,
        a: p.opacity
      });
    }

    return result;
  }

  private adjustParticleCount(): void {
    const currentCount = this.particles.length;
    const targetCount = this.targetDensity;

    if (currentCount < targetCount) {
      const toAdd = targetCount - currentCount;
      for (let i = 0; i < toAdd; i++) {
        this.particles.push(createParticle(true));
      }
    } else if (currentCount > targetCount) {
      const toRemove = currentCount - targetCount;
      let removed = 0;
      for (let i = 0; i < this.particles.length && removed < toRemove; i++) {
        if (!this.particles[i].isNew && this.particles[i].targetOpacity !== 0) {
          this.particles[i].targetOpacity = 0;
          removed++;
        }
      }
      if (removed < toRemove) {
        for (let i = 0; i < this.particles.length && removed < toRemove; i++) {
          if (this.particles[i].targetOpacity !== 0) {
            this.particles[i].targetOpacity = 0;
            removed++;
          }
        }
      }
    }
  }
}
