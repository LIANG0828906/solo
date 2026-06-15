import type { Vector2, Asteroid, Particle, OreGrade, Star, ORE_CONFIG } from './types';

export const ORE_CONFIGS: Record<OreGrade, ORE_CONFIG> = {
  common: { color: '#aa8855', value: 10, name: '普通矿石' },
  rare: { color: '#55aaff', value: 50, name: '稀有矿石' },
  legendary: { color: '#ff66aa', value: 200, name: '传说矿石' }
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateAsteroidVertices(radius: number): Vector2[] {
  const vertices: Vector2[] = [];
  const numVertices = Math.floor(randomRange(7, 12));
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const r = radius * randomRange(0.7, 1.2);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }
  return vertices;
}

function getRandomGrade(): OreGrade {
  const rand = Math.random();
  if (rand < 0.1) return 'legendary';
  if (rand < 0.35) return 'rare';
  return 'common';
}

export function createAsteroid(id: string, position?: Vector2): Asteroid {
  const radius = randomRange(20, 35);
  const grade = getRandomGrade();
  const pos = position || {
    x: randomRange(60, CANVAS_WIDTH - 60),
    y: randomRange(60, CANVAS_HEIGHT - 60)
  };
  return {
    id,
    position: pos,
    radius,
    grade,
    rotation: randomRange(0, Math.PI * 2),
    rotationSpeed: randomRange(-0.3, 0.3),
    vertices: generateAsteroidVertices(radius),
    flashCount: 0,
    isFlashing: false,
    flashTimer: 0,
    hovered: false
  };
}

export function generateInitialAsteroids(): Asteroid[] {
  const asteroids: Asteroid[] = [];
  const count = Math.floor(randomRange(12, 16));
  for (let i = 0; i < count; i++) {
    let asteroid: Asteroid;
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 50) {
      asteroid = createAsteroid(`asteroid_${Date.now()}_${i}`);
      valid = true;
      for (const existing of asteroids) {
        const dx = asteroid.position.x - existing.position.x;
        const dy = asteroid.position.y - existing.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < asteroid.radius + existing.radius + 30) {
          valid = false;
          break;
        }
      }
      attempts++;
    }
    if (asteroid!) {
      asteroids.push(asteroid!);
    }
  }
  return asteroids;
}

export function updateAsteroids(asteroids: Asteroid[], dt: number): void {
  for (const asteroid of asteroids) {
    asteroid.rotation += asteroid.rotationSpeed * dt;
    if (asteroid.isFlashing) {
      asteroid.flashTimer -= dt;
      if (asteroid.flashTimer <= 0) {
        asteroid.isFlashing = false;
      }
    }
  }
}

export function hitAsteroid(asteroid: Asteroid): boolean {
  asteroid.flashCount++;
  asteroid.isFlashing = true;
  asteroid.flashTimer = 0.15;
  return asteroid.flashCount >= 3;
}

export function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: randomRange(0, CANVAS_WIDTH),
      y: randomRange(0, CANVAS_HEIGHT),
      size: randomRange(1, 4),
      baseSize: 0,
      brightness: randomRange(0.3, 1),
      twinkleSpeed: randomRange(0.5, 2),
      twinklePhase: randomRange(0, Math.PI * 2),
      parallaxLayer: randomRange(0.2, 1)
    });
    stars[i].baseSize = stars[i].size;
  }
  return stars;
}

export function updateStars(stars: Star[], dt: number, playerVelocity: Vector2): void {
  for (const star of stars) {
    star.twinklePhase += star.twinkleSpeed * dt;
    star.brightness = 0.5 + Math.sin(star.twinklePhase) * 0.5;
    star.size = star.baseSize * (0.7 + star.brightness * 0.5);
    star.x -= playerVelocity.x * star.parallaxLayer * dt * 0.1;
    star.y -= playerVelocity.y * star.parallaxLayer * dt * 0.1;
    if (star.x < 0) star.x = CANVAS_WIDTH;
    if (star.x > CANVAS_WIDTH) star.x = 0;
    if (star.y < 0) star.y = CANVAS_HEIGHT;
    if (star.y > CANVAS_HEIGHT) star.y = 0;
  }
}

export function createParticle(
  position: Vector2,
  velocity: Vector2,
  color: string,
  size: number,
  life: number,
  gravity: number = 0,
  trail: boolean = false
): Particle {
  return {
    position: { ...position },
    velocity: { ...velocity },
    life,
    maxLife: life,
    size,
    color,
    gravity,
    trail
  };
}

export function createExplosionParticles(
  position: Vector2,
  color: string,
  count: number,
  speed: number = 100
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const vel = randomRange(speed * 0.3, speed);
    particles.push(createParticle(
      position,
      { x: Math.cos(angle) * vel, y: Math.sin(angle) * vel },
      color,
      randomRange(3, 6),
      randomRange(0.4, 0.8),
      0,
      true
    ));
  }
  return particles;
}

export function createOreDropParticles(position: Vector2): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const vel = randomRange(50, 150);
    particles.push(createParticle(
      position,
      { x: Math.cos(angle) * vel, y: Math.sin(angle) * vel },
      '#ffd700',
      randomRange(4, 6),
      0.8,
      200,
      true
    ));
  }
  return particles;
}

export function createEngineParticles(position: Vector2, angle: number, color: string): Particle {
  const spreadAngle = randomRange(-0.3, 0.3);
  const finalAngle = angle + Math.PI + spreadAngle;
  const speed = randomRange(80, 150);
  return createParticle(
    position,
    { x: Math.cos(finalAngle) * speed, y: Math.sin(finalAngle) * speed },
    color,
    randomRange(2, 4),
    randomRange(0.2, 0.4),
    0,
    false
  );
}

export function createMissileTrail(position: Vector2): Particle {
  return createParticle(
    position,
    { x: 0, y: 0 },
    '#ff8800',
    randomRange(2, 4),
    0.3,
    0,
    false
  );
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.position.x += p.velocity.x * dt;
    p.position.y += p.velocity.y * dt;
    p.velocity.y += p.gravity * dt;
    p.velocity.x *= 0.98;
    p.velocity.y *= 0.98;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function limitParticles(particles: Particle[], maxCount: number): void {
  while (particles.length > maxCount) {
    particles.shift();
  }
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[]): void {
  for (const star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.fill();
  }
}

export function drawAsteroid(ctx: CanvasRenderingContext2D, asteroid: Asteroid): void {
  ctx.save();
  ctx.translate(asteroid.position.x, asteroid.position.y);
  ctx.rotate(asteroid.rotation);

  ctx.beginPath();
  const vertices = asteroid.vertices;
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();

  const config = ORE_CONFIGS[asteroid.grade];
  const baseColor = asteroid.isFlashing ? '#ffffff' : config.color;
  ctx.fillStyle = baseColor;
  ctx.fill();

  ctx.strokeStyle = asteroid.isFlashing ? '#ffffff' : config.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!asteroid.isFlashing) {
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.trail && p.maxLife > 0.3) {
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    } else {
      const gradient = ctx.createRadialGradient(
        p.position.x, p.position.y, 0,
        p.position.x, p.position.y, p.size
      );
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function checkAsteroidHover(
  asteroids: Asteroid[],
  mouseX: number,
  mouseY: number,
  canvasRect: DOMRect
): Asteroid | null {
  const scaleX = CANVAS_WIDTH / canvasRect.width;
  const scaleY = CANVAS_HEIGHT / canvasRect.height;
  const x = (mouseX - canvasRect.left) * scaleX;
  const y = (mouseY - canvasRect.top) * scaleY;

  for (const asteroid of asteroids) {
    const dx = x - asteroid.position.x;
    const dy = y - asteroid.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < asteroid.radius) {
      return asteroid;
    }
  }
  return null;
}
