export interface Vector2 {
  x: number;
  y: number;
}

export interface Wall {
  start: Vector2;
  end: Vector2;
}

export interface Echo {
  id: number;
  center: Vector2;
  radius: number;
  maxRadius: number;
  speed: number;
  baseSpeed: number;
  opacity: number;
  maxOpacity: number;
  color: string;
  reflectionCount: number;
  createdAt: number;
  duration: number;
  isReflection: boolean;
  reflectedWalls: Set<number>;
}

export interface Chandelier {
  id: number;
  position: Vector2;
  brightness: number;
  targetBrightness: number;
  brightEndTime: number;
  swingAngle: number;
  swingVelocity: number;
}

export interface Singer {
  id: number;
  position: Vector2;
  resonance: number;
  activated: boolean;
  activatedAt: number;
  rotation: number;
  flashActive: boolean;
  flashEndTime: number;
}

export interface Particle {
  id: number;
  position: Vector2;
  velocity: Vector2;
  size: number;
  opacity: number;
  createdAt: number;
  lifetime: number;
  singerId: number;
}

export interface GameState {
  echoes: Echo[];
  walls: Wall[];
  chandeliers: Chandelier[];
  singers: Singer[];
  particles: Particle[];
  activatedCount: number;
  mousePosition: Vector2;
  hoveredSingerId: number | null;
  globalFlashEndTime: number;
}

export class GameLogic {
  private state: GameState;
  private nextEchoId: number;
  private nextParticleId: number;
  private lastParticleEmit: Map<number, number>;
  private readonly SCENE_WIDTH = 800;
  private readonly SCENE_HEIGHT = 600;
  private readonly MAX_REFLECTIONS = 3;
  private readonly REFLECTION_SPEED_DECAY = 0.6;
  private readonly ECHO_DURATION = 2000;
  private readonly CHANDELIER_BRIGHT_DURATION = 500;
  private readonly SINGER_FLASH_DURATION = 1000;
  private readonly PARTICLE_LIFETIME = 500;
  private readonly PARTICLES_PER_SECOND = 10;

  constructor() {
    this.nextEchoId = 0;
    this.nextParticleId = 0;
    this.lastParticleEmit = new Map();
    this.state = this.initializeState();
  }

  private initializeState(): GameState {
    const walls: Wall[] = [
      { start: { x: 0, y: 0 }, end: { x: 800, y: 0 } },
      { start: { x: 800, y: 0 }, end: { x: 800, y: 600 } },
      { start: { x: 800, y: 600 }, end: { x: 0, y: 600 } },
      { start: { x: 0, y: 600 }, end: { x: 0, y: 0 } },
      { start: { x: 200, y: 150 }, end: { x: 200, y: 350 } },
      { start: { x: 600, y: 250 }, end: { x: 600, y: 450 } },
      { start: { x: 300, y: 450 }, end: { x: 500, y: 450 } },
      { start: { x: 150, y: 500 }, end: { x: 350, y: 500 } },
    ];

    const chandeliers: Chandelier[] = [
      { id: 0, position: { x: 400, y: 100 }, brightness: 0.8, targetBrightness: 0.8, brightEndTime: 0, swingAngle: 0, swingVelocity: 0 },
      { id: 1, position: { x: 100, y: 300 }, brightness: 0.8, targetBrightness: 0.8, brightEndTime: 0, swingAngle: 0, swingVelocity: 0 },
      { id: 2, position: { x: 700, y: 200 }, brightness: 0.8, targetBrightness: 0.8, brightEndTime: 0, swingAngle: 0, swingVelocity: 0 },
      { id: 3, position: { x: 500, y: 350 }, brightness: 0.8, targetBrightness: 0.8, brightEndTime: 0, swingAngle: 0, swingVelocity: 0 },
    ];

    const singers: Singer[] = [
      { id: 0, position: { x: 150, y: 150 }, resonance: 0, activated: false, activatedAt: 0, rotation: 0, flashActive: false, flashEndTime: 0 },
      { id: 1, position: { x: 400, y: 300 }, resonance: 0, activated: false, activatedAt: 0, rotation: 0, flashActive: false, flashEndTime: 0 },
      { id: 2, position: { x: 650, y: 500 }, resonance: 0, activated: false, activatedAt: 0, rotation: 0, flashActive: false, flashEndTime: 0 },
    ];

    singers.forEach(s => this.lastParticleEmit.set(s.id, 0));

    return {
      echoes: [],
      walls,
      chandeliers,
      singers,
      particles: [],
      activatedCount: 0,
      mousePosition: { x: 0, y: 0 },
      hoveredSingerId: null,
      globalFlashEndTime: 0,
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public createEcho(x: number, y: number, now: number): void {
    const diagonal = Math.sqrt(this.SCENE_WIDTH ** 2 + this.SCENE_HEIGHT ** 2);
    const baseSpeed = diagonal / (this.ECHO_DURATION / 1000);

    const echo: Echo = {
      id: this.nextEchoId++,
      center: { x, y },
      radius: 0,
      maxRadius: diagonal,
      speed: baseSpeed,
      baseSpeed,
      opacity: 0.6,
      maxOpacity: 0.6,
      color: '#00FFFF',
      reflectionCount: 0,
      createdAt: now,
      duration: this.ECHO_DURATION,
      isReflection: false,
      reflectedWalls: new Set(),
    };

    this.state.echoes.push(echo);
  }

  public updateMousePosition(x: number, y: number): void {
    this.state.mousePosition = { x, y };
    this.state.hoveredSingerId = this.findHoveredSinger(x, y);
  }

  private findHoveredSinger(x: number, y: number): number | null {
    for (const singer of this.state.singers) {
      const dx = x - singer.position.x;
      const dy = y - singer.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 60) {
        return singer.id;
      }
    }
    return null;
  }

  public update(deltaTime: number, now: number): void {
    const dtSeconds = deltaTime / 1000;

    this.updateEchoes(dtSeconds, now);
    this.updateChandeliers(dtSeconds, now);
    this.updateSingers(dtSeconds, now);
    this.updateParticles(dtSeconds, now);
    this.emitParticles(now);
    this.checkCollisions();
  }

  private updateEchoes(dtSeconds: number, now: number): void {
    for (let i = this.state.echoes.length - 1; i >= 0; i--) {
      const echo = this.state.echoes[i];
      const age = now - echo.createdAt;

      echo.radius += echo.speed * dtSeconds;
      echo.opacity = echo.maxOpacity * (1 - age / echo.duration);

      if (age >= echo.duration || echo.radius >= echo.maxRadius) {
        this.state.echoes.splice(i, 1);
      }
    }
  }

  private updateChandeliers(dtSeconds: number, now: number): void {
    for (const chandelier of this.state.chandeliers) {
      if (now < chandelier.brightEndTime) {
        chandelier.brightness = 1.0;
      } else {
        chandelier.brightness = 0.8;
      }

      chandelier.swingVelocity += (Math.random() - 0.5) * 0.02;
      chandelier.swingAngle += chandelier.swingVelocity * dtSeconds * 60;
      chandelier.swingAngle *= 0.98;
      chandelier.swingVelocity *= 0.95;
      chandelier.swingAngle = Math.max(-0.1, Math.min(0.1, chandelier.swingAngle));
    }
  }

  private updateSingers(dtSeconds: number, now: number): void {
    for (const singer of this.state.singers) {
      if (singer.activated) {
        singer.rotation += 0.5 * dtSeconds;
        if (singer.rotation >= 360) singer.rotation -= 360;
      }

      if (singer.flashActive && now >= singer.flashEndTime) {
        singer.flashActive = false;
      }
    }

    if (this.state.globalFlashEndTime > 0 && now >= this.state.globalFlashEndTime) {
      this.state.globalFlashEndTime = 0;
    }
  }

  private updateParticles(dtSeconds: number, now: number): void {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const particle = this.state.particles[i];
      const age = now - particle.createdAt;

      particle.position.x += particle.velocity.x * dtSeconds;
      particle.position.y += particle.velocity.y * dtSeconds;
      particle.opacity = 1 - age / particle.lifetime;

      if (age >= particle.lifetime) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private emitParticles(now: number): void {
    const emitInterval = 1000 / this.PARTICLES_PER_SECOND;

    for (const singer of this.state.singers) {
      if (!singer.activated) continue;

      const lastEmit = this.lastParticleEmit.get(singer.id) || 0;
      if (now - lastEmit >= emitInterval) {
        this.createParticle(singer, now);
        this.lastParticleEmit.set(singer.id, now);
      }
    }
  }

  private createParticle(singer: Singer, now: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 20;

    const particle: Particle = {
      id: this.nextParticleId++,
      position: { ...singer.position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      size: 2 + Math.random() * 2,
      opacity: 1,
      createdAt: now,
      lifetime: this.PARTICLE_LIFETIME,
      singerId: singer.id,
    };

    this.state.particles.push(particle);
  }

  private checkCollisions(): void {
    const now = performance.now();

    for (let i = this.state.echoes.length - 1; i >= 0; i--) {
      const echo = this.state.echoes[i];

      this.checkWallReflections(echo, now);
      this.checkChandelierInteractions(echo, now);
      this.checkSingerActivations(echo);
    }
  }

  private checkWallReflections(echo: Echo, now: number): void {
    if (echo.reflectionCount >= this.MAX_REFLECTIONS) return;

    for (let wallIndex = 0; wallIndex < this.state.walls.length; wallIndex++) {
      if (echo.reflectedWalls.has(wallIndex)) continue;

      const wall = this.state.walls[wallIndex];
      const intersection = this.circleLineIntersection(echo.center, echo.radius, wall.start, wall.end);

      if (intersection) {
        echo.reflectedWalls.add(wallIndex);
        this.createReflectionEcho(echo, intersection.point, wall, now);
      }
    }
  }

  private circleLineIntersection(
    center: Vector2,
    radius: number,
    p1: Vector2,
    p2: Vector2
  ): { point: Vector2 } | null {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;

    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
      return {
        point: {
          x: p1.x + t1 * dx,
          y: p1.y + t1 * dy,
        },
      };
    }
    if (t2 >= 0 && t2 <= 1) {
      return {
        point: {
          x: p1.x + t2 * dx,
          y: p1.y + t2 * dy,
        },
      };
    }

    return null;
  }

  private createReflectionEcho(
    parentEcho: Echo,
    reflectionPoint: Vector2,
    wall: Wall,
    now: number
  ): void {
    const wallDx = wall.end.x - wall.start.x;
    const wallDy = wall.end.y - wall.start.y;
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
    const wallNormalX = -wallDy / wallLen;
    const wallNormalY = wallDx / wallLen;

    const toCenterX = parentEcho.center.x - reflectionPoint.x;
    const toCenterY = parentEcho.center.y - reflectionPoint.y;
    const dot = toCenterX * wallNormalX + toCenterY * wallNormalY;

    const reflectedDirX = toCenterX - 2 * dot * wallNormalX;
    const reflectedDirY = toCenterY - 2 * dot * wallNormalY;
    const reflectedLen = Math.sqrt(reflectedDirX * reflectedDirX + reflectedDirY * reflectedDirY);

    const newCenterX = reflectionPoint.x + (reflectedDirX / reflectedLen) * 0.1;
    const newCenterY = reflectionPoint.y + (reflectedDirY / reflectedLen) * 0.1;

    const newSpeed = parentEcho.baseSpeed * Math.pow(this.REFLECTION_SPEED_DECAY, parentEcho.reflectionCount + 1);
    const remainingDuration = parentEcho.duration - (now - parentEcho.createdAt);

    const reflection: Echo = {
      id: this.nextEchoId++,
      center: { x: newCenterX, y: newCenterY },
      radius: 0,
      maxRadius: parentEcho.maxRadius,
      speed: newSpeed,
      baseSpeed: parentEcho.baseSpeed,
      opacity: 0.35,
      maxOpacity: 0.35,
      color: '#8A2BE2',
      reflectionCount: parentEcho.reflectionCount + 1,
      createdAt: now,
      duration: Math.max(remainingDuration, 1000),
      isReflection: true,
      reflectedWalls: new Set([...parentEcho.reflectedWalls]),
    };

    this.state.echoes.push(reflection);
  }

  private checkChandelierInteractions(echo: Echo, now: number): void {
    for (const chandelier of this.state.chandeliers) {
      const dx = echo.center.x - chandelier.position.x;
      const dy = echo.center.y - chandelier.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(dist - echo.radius) <= 20) {
        chandelier.brightEndTime = now + this.CHANDELIER_BRIGHT_DURATION;
        chandelier.swingVelocity += (Math.random() - 0.5) * 0.3;
      }
    }
  }

  private checkSingerActivations(echo: Echo): void {
    for (const singer of this.state.singers) {
      if (singer.activated) continue;

      const dx = echo.center.x - singer.position.x;
      const dy = echo.center.y - singer.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= 55 && dist <= 60) {
        const resonanceGain = echo.isReflection ? 8 : 15;
        singer.resonance = Math.min(100, singer.resonance + resonanceGain);

        if (singer.resonance >= 100) {
          this.activateSinger(singer);
        }
      }
    }
  }

  private activateSinger(singer: Singer): void {
    singer.activated = true;
    singer.activatedAt = performance.now();
    singer.flashActive = true;
    singer.flashEndTime = performance.now() + this.SINGER_FLASH_DURATION;
    this.state.globalFlashEndTime = performance.now() + this.SINGER_FLASH_DURATION;
    this.state.activatedCount = this.state.singers.filter(s => s.activated).length;
  }

  public getGlobalFlashAlpha(now: number): number {
    if (this.state.globalFlashEndTime <= 0) return 0;
    const remaining = this.state.globalFlashEndTime - now;
    if (remaining <= 0) return 0;
    return 0.3 * (remaining / this.SINGER_FLASH_DURATION);
  }

  public getSingerPulseOpacity(singer: Singer, now: number): number {
    if (singer.activated) return 0.8;
    const cycle = 2000;
    const phase = (now % cycle) / cycle;
    return 0.2 + Math.sin(phase * Math.PI * 2) * 0.05;
  }
}
