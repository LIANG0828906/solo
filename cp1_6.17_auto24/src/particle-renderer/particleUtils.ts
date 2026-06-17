export interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
}

export interface RainParticle extends Particle {
  length: number;
  angle: number;
}

export interface SnowParticle extends Particle {
  drift: number;
  driftSpeed: number;
}

export interface SandParticle extends Particle {}

export const createRainParticles = (
  count: number,
  width: number,
  height: number,
  speed: number = 600
): RainParticle[] => {
  const particles: RainParticle[] = [];
  const angle = (80 * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: speed * (0.8 + Math.random() * 0.4),
      size: 2,
      length: 15,
      angle: angle,
      opacity: 0.4 + Math.random() * 0.4
    });
  }

  return particles;
};

export const updateRainParticles = (
  particles: RainParticle[],
  width: number,
  height: number,
  deltaTime: number
): RainParticle[] => {
  return particles.map((p) => {
    const newY = p.y + p.speed * deltaTime;
    const newX = p.x + Math.cos(p.angle) * p.speed * deltaTime;

    if (newY > height || newX > width || newX < -50) {
      return {
        ...p,
        x: Math.random() * (width + 100) - 50,
        y: -p.length
      };
    }

    return { ...p, x: newX, y: newY };
  });
};

export const drawRainParticles = (
  ctx: CanvasRenderingContext2D,
  particles: RainParticle[]
): void => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle - Math.PI / 2);
    ctx.fillRect(-p.size / 2, 0, p.size, p.length);
    ctx.restore();
  });
};

export const createSnowParticles = (
  count: number,
  width: number,
  height: number
): SnowParticle[] => {
  const particles: SnowParticle[] = [];

  for (let i = 0; i < count; i++) {
    const radius = 3 + Math.random() * 3;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 100 + Math.random() * 100,
      size: radius,
      drift: 0,
      driftSpeed: (Math.random() - 0.5) * 40,
      opacity: 0.7 + Math.random() * 0.3
    });
  }

  return particles;
};

export const updateSnowParticles = (
  particles: SnowParticle[],
  width: number,
  height: number,
  deltaTime: number,
  time: number
): SnowParticle[] => {
  return particles.map((p) => {
    const newY = p.y + p.speed * deltaTime;
    const drift = Math.sin(time * 0.001 + p.x * 0.01) * 20;
    const newX = p.x + p.driftSpeed * deltaTime + drift * 0.01;

    if (newY > height + p.size) {
      return {
        ...p,
        x: Math.random() * width,
        y: -p.size * 2
      };
    }

    if (newX < -p.size) {
      return { ...p, x: width + p.size };
    }
    if (newX > width + p.size) {
      return { ...p, x: -p.size };
    }

    return { ...p, x: newX, y: newY, drift };
  });
};

export const drawSnowParticles = (
  ctx: CanvasRenderingContext2D,
  particles: SnowParticle[]
): void => {
  ctx.fillStyle = '#FFFFFF';

  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
};

export const createSandParticles = (
  count: number,
  width: number,
  height: number
): SandParticle[] => {
  const particles: SandParticle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 1000 + Math.random() * 400,
      size: 2 + Math.random() * 2,
      opacity: 0.5 + Math.random() * 0.5
    });
  }

  return particles;
};

export const updateSandParticles = (
  particles: SandParticle[],
  width: number,
  height: number,
  deltaTime: number
): SandParticle[] => {
  return particles.map((p) => {
    const newX = p.x + p.speed * deltaTime;

    if (newX > width + p.size) {
      return {
        ...p,
        x: -p.size,
        y: Math.random() * height
      };
    }

    return { ...p, x: newX };
  });
};

export const drawSandParticles = (
  ctx: CanvasRenderingContext2D,
  particles: SandParticle[]
): void => {
  ctx.fillStyle = '#B8860B';

  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  });
};

interface LightningState {
  active: boolean;
  opacity: number;
  nextFlash: number;
}

export const createLightningState = (): LightningState => ({
  active: false,
  opacity: 0,
  nextFlash: 0.5 + Math.random() * 1.5
});

export const updateLightning = (
  state: LightningState,
  deltaTime: number
): LightningState => {
  let { active, opacity, nextFlash } = state;

  nextFlash -= deltaTime;

  if (nextFlash <= 0 && !active) {
    active = true;
    opacity = 0.4;
    nextFlash = 0.1;
  } else if (active) {
    opacity -= deltaTime * 4;
    if (opacity <= 0) {
      active = false;
      opacity = 0;
      nextFlash = 0.5 + Math.random() * 1.5;
    }
  }

  return { active, opacity, nextFlash };
};

export const drawLightning = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number
): void => {
  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};
