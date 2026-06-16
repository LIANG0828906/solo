import { v4 as uuid } from 'uuid';
import type {
  Asteroid,
  AsteroidDebris,
  Pirate,
  PirateLaser,
  GravityWell,
  EnergyOrb,
  Particle,
  Star,
  GameState,
  Vec2,
} from '../types';
import { useGameStore } from '../store/gameStore';

const MAX_PARTICLES = 200;

function generateAsteroidVertices(radius: number): number[] {
  const count = 8 + Math.floor(Math.random() * 4);
  const verts: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.6);
    verts.push(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  return verts;
}

export function generateStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 1,
      brightness: 0.3 + Math.random() * 0.4,
      twinkleSpeed: 1 + Math.random() * 2,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: `rgba(180,190,210,`,
      layer: 1,
      speed: 15 + Math.random() * 10,
    });
  }
  for (let i = 0; i < 30; i++) {
    const hue = [200, 220, 40, 10, 280][Math.floor(Math.random() * 5)];
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.5 + Math.random() * 2,
      brightness: 0.5 + Math.random() * 0.5,
      twinkleSpeed: 2 + Math.random() * 3,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: `hsla(${hue},70%,70%,`,
      layer: 2,
      speed: 30 + Math.random() * 20,
    });
  }
  return stars;
}

export function spawnAsteroid(
  width: number,
  shipY: number,
  difficulty: number,
  existingCount: number
): Asteroid | null {
  const maxAsteroids = Math.floor(8 + difficulty * 3);
  if (existingCount >= maxAsteroids) return null;

  const isMoving = Math.random() < 0.3;
  const radius = 18 + Math.random() * 22;
  const margin = 60;
  const x = margin + Math.random() * (width - margin * 2);

  return {
    id: uuid(),
    x,
    y: shipY - 800 - Math.random() * 200,
    radius,
    type: isMoving ? 'moving' : 'static',
    hp: 1,
    angle: 0,
    amplitude: 40 + Math.random() * 60,
    frequency: 1.5 + Math.random() * 2,
    baseX: x,
    vertices: generateAsteroidVertices(radius),
  };
}

export function spawnPirate(
  width: number,
  shipY: number,
  shipX: number,
  difficulty: number
): Pirate {
  const side = Math.random() < 0.5 ? 'left' : 'right';
  const maxHp = 1 * Math.pow(2, difficulty - 1);
  return {
    id: uuid(),
    x: side === 'left' ? -30 : width + 30,
    y: shipY - 300 - Math.random() * 200,
    hp: maxHp,
    maxHp,
    speed: 60 + Math.random() * 40,
    side,
    fireTimer: 1 + Math.random() * 2,
    fireInterval: Math.max(1.5, 3 - difficulty * 0.3),
    targetY: shipY - 200,
  };
}

export function spawnGravityWell(
  width: number,
  shipY: number
): GravityWell | null {
  const margin = 80;
  return {
    id: uuid(),
    x: margin + Math.random() * (width - margin * 2),
    y: shipY - 800 - Math.random() * 400,
    radius: 60 + Math.random() * 30,
    flowAngle: 0,
  };
}

export function spawnEnergyOrb(
  width: number,
  shipY: number
): EnergyOrb | null {
  const margin = 60;
  return {
    id: uuid(),
    x: margin + Math.random() * (width - margin * 2),
    y: shipY - 800 - Math.random() * 400,
    radius: 12,
    pulse: 0,
  };
}

export function spawnDebris(x: number, y: number): AsteroidDebris[] {
  const pieces: AsteroidDebris[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    pieces.push({
      id: uuid(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 6,
      life: 0.8,
      maxLife: 0.8,
    });
  }
  return pieces;
}

export function spawnEngineParticles(
  x: number,
  y: number,
  count: number,
  difficulty: number
): Particle[] {
  const extra = Math.floor(difficulty * 0.5);
  const total = Math.min(count + extra, 4);
  const particles: Particle[] = [];
  for (let i = 0; i < total; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + Math.random() * 5,
      vx: (Math.random() - 0.5) * 30,
      vy: 60 + Math.random() * 80,
      life: 0.5,
      maxLife: 0.5,
      color: Math.random() < 0.5 ? '#00aaff' : '#0066ff',
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
}

export function spawnLaserTrail(x: number, y: number): Particle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    life: 0.3,
    maxLife: 0.3,
    color: '#ff3333',
    size: 1.5,
  };
}

export function spawnVictoryParticles(cx: number, cy: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 200;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5 + Math.random(),
      maxLife: 2,
      color: ['#00ffaa', '#00ff66', '#aaffcc', '#ffffff'][Math.floor(Math.random() * 4)],
      size: 2 + Math.random() * 4,
    });
  }
  return particles;
}

export class EntityManager {
  private store = useGameStore;
  private spawnAccumulator = 0;
  private gravityAccumulator = 0;
  private orbAccumulator = 0;

  update(dt: number, canvasW: number, canvasH: number) {
    const state = this.store.getState();
    if (state.phase !== 'playing') return;

    const { difficulty, shipY, shipX, distance } = state;
    const scrollSpeed = 120;

    this.spawnAccumulator += dt;
    this.gravityAccumulator += dt;
    this.orbAccumulator += dt;

    const asteroidInterval = Math.max(0.3, 1.2 / (1 + (difficulty - 1) * 0.2));
    if (this.spawnAccumulator >= asteroidInterval) {
      this.spawnAccumulator = 0;
      const ast = spawnAsteroid(canvasW, shipY, difficulty, state.asteroids.length);
      if (ast) {
        this.store.setState((s) => ({ asteroids: [...s.asteroids, ast] }));
      }
    }

    const gravityChance = 0.005 * (1 + (difficulty - 1) * 0.5);
    if (this.gravityAccumulator >= 2) {
      this.gravityAccumulator = 0;
      if (Math.random() < gravityChance * 30) {
        const gw = spawnGravityWell(canvasW, shipY);
        if (gw) {
          this.store.setState((s) => ({ gravityWells: [...s.gravityWells, gw] }));
        }
      }
    }

    const orbChance = 0.002;
    if (this.orbAccumulator >= 3) {
      this.orbAccumulator = 0;
      if (Math.random() < orbChance * 30) {
        const orb = spawnEnergyOrb(canvasW, shipY);
        if (orb) {
          this.store.setState((s) => ({ energyOrbs: [...s.energyOrbs, orb] }));
        }
      }
    }

    let pirateSpawnTimer = state.pirateSpawnTimer - dt;
    if (pirateSpawnTimer <= 0) {
      pirateSpawnTimer = 10 + Math.random() * 5;
      const pirate = spawnPirate(canvasW, shipY, shipX, difficulty);
      this.store.setState((s) => ({ pirates: [...s.pirates, pirate], pirateSpawnTimer }));
    } else {
      this.store.setState({ pirateSpawnTimer });
    }

    this.updateAsteroids(dt, scrollSpeed, canvasW, canvasH, shipY);
    this.updateDebris(dt, canvasH, shipY);
    this.updatePirates(dt, scrollSpeed, canvasW, canvasH, shipY, shipX);
    this.updateLasers(dt, canvasW, canvasH, shipY);
    this.updateGravityWells(dt, scrollSpeed, canvasH, shipY);
    this.updateEnergyOrbs(dt, scrollSpeed, canvasH, shipY);
    this.updateParticles(dt);
    this.updateStars(dt, canvasW, canvasH, shipY, scrollSpeed, difficulty);
    this.cullEntities(canvasH, shipY);
  }

  private updateAsteroids(
    dt: number,
    scrollSpeed: number,
    _canvasW: number,
    _canvasH: number,
    _shipY: number
  ) {
    const asteroids = this.store.getState().asteroids.map((a) => {
      const ny = a.y + scrollSpeed * dt;
      if (a.type === 'moving') {
        a.angle += a.frequency * dt;
        return { ...a, y: ny, x: a.baseX + Math.sin(a.angle) * a.amplitude };
      }
      return { ...a, y: ny };
    });
    this.store.setState({ asteroids });
  }

  private updateDebris(dt: number, _canvasH: number, _shipY: number) {
    const debris = this.store.getState().debris
      .map((d) => ({
        ...d,
        x: d.x + d.vx * dt,
        y: d.y + d.vy * dt,
        life: d.life - dt,
      }))
      .filter((d) => d.life > 0);
    this.store.setState({ debris });
  }

  private updatePirates(
    dt: number,
    scrollSpeed: number,
    canvasW: number,
    _canvasH: number,
    _shipY: number,
    shipX: number
  ) {
    const state = this.store.getState();
    const newLasers: PirateLaser[] = [];

    const pirates = state.pirates.map((p) => {
      let ny = p.y + scrollSpeed * dt * 0.5;
      let nx = p.x;
      if (p.side === 'left') {
        nx += p.speed * dt;
        if (nx > 40) nx = 40;
      } else {
        nx -= p.speed * dt;
        if (nx < canvasW - 40) nx = canvasW - 40;
      }

      let fireTimer = p.fireTimer - dt;
      if (fireTimer <= 0) {
        fireTimer = p.fireInterval;
        const dx = shipX - nx;
        const dy = state.shipY - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 100;
        newLasers.push({
          id: uuid(),
          x: nx,
          y: ny,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          trail: [{ x: nx, y: ny }],
          life: 4,
        });
      }

      return { ...p, x: nx, y: ny, fireTimer };
    });

    const allLasers = [...state.pirateLasers, ...newLasers];
    this.store.setState({ pirates, pirateLasers: allLasers });
  }

  private updateLasers(dt: number, _canvasW: number, _canvasH: number, _shipY: number) {
    const lasers = this.store.getState().pirateLasers
      .map((l) => {
        const nx = l.x + l.vx * dt;
        const ny = l.y + l.vy * dt;
        const trail = [...l.trail, { x: nx, y: ny }].slice(-8);
        return { ...l, x: nx, y: ny, trail, life: l.life - dt };
      })
      .filter((l) => l.life > 0);
    this.store.setState({ pirateLasers: lasers });
  }

  private updateGravityWells(dt: number, scrollSpeed: number, _canvasH: number, _shipY: number) {
    const gravityWells = this.store.getState().gravityWells.map((gw) => ({
      ...gw,
      y: gw.y + scrollSpeed * dt,
      flowAngle: gw.flowAngle + dt * 2,
    }));
    this.store.setState({ gravityWells });
  }

  private updateEnergyOrbs(dt: number, scrollSpeed: number, _canvasH: number, _shipY: number) {
    const energyOrbs = this.store.getState().energyOrbs.map((orb) => ({
      ...orb,
      y: orb.y + scrollSpeed * dt,
      pulse: orb.pulse + dt * 3,
    }));
    this.store.setState({ energyOrbs });
  }

  private updateParticles(dt: number) {
    const particles = this.store.getState().particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);
    this.store.setState({ particles });
  }

  private updateStars(
    dt: number,
    canvasW: number,
    canvasH: number,
    _shipY: number,
    scrollSpeed: number,
    difficulty: number
  ) {
    const stars = this.store.getState().stars.map((s) => {
      const ny = s.y + s.speed * dt * (scrollSpeed / 120);
      if (ny > canvasH + 10) {
        return {
          ...s,
          y: -5,
          x: Math.random() * canvasW,
          twinkleSpeed: s.twinkleSpeed * (1 + (difficulty - 1) * 0.1),
        };
      }
      return { ...s, y: ny };
    });
    this.store.setState({ stars });
  }

  addParticles(newParticles: Particle[]) {
    const state = this.store.getState();
    const particles = [...state.particles, ...newParticles].slice(-MAX_PARTICLES);
    this.store.setState({ particles });
  }

  private cullEntities(canvasH: number, shipY: number) {
    const state = this.store.getState();
    const bottom = shipY + canvasH / 2 + 100;
    const top = shipY - canvasH / 2 - 600;

    this.store.setState({
      asteroids: state.asteroids.filter((a) => a.y < bottom && a.y > top - 200),
      pirates: state.pirates.filter((p) => p.y < bottom && p.y > top - 400),
      pirateLasers: state.pirateLasers.filter(
        (l) => l.y < bottom && l.y > top && l.x > -50 && l.x < canvasW + 50
      ),
      gravityWells: state.gravityWells.filter((gw) => gw.y < bottom && gw.y > top - 200),
      energyOrbs: state.energyOrbs.filter((orb) => orb.y < bottom && orb.y > top - 200),
    });
  }
}
