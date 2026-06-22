import type { CelestialBody, PhysicsParams } from '../utils/types';
import { EventBus } from './bus';

const PLANET_NAMES = ['水星', '金星', '地球', '火星', '木星'];
const PLANET_COLORS = [
  '#B87333',
  '#E6B800',
  '#4A90D9',
  '#D9534F',
  '#E8A060'
];
const FIXED_STEP = 1 / 60;
const MAX_ACCUMULATOR = 0.1;

export class PhysicsEngine {
  private bodies: CelestialBody[];
  private params: PhysicsParams;
  private bus: EventBus;
  private lastTime: number;
  private accumulator: number;
  private running: boolean;
  private animFrameId: number;

  constructor(bus: EventBus) {
    this.bus = bus;
    this.params = {
      gravitationalConstant: 0.5,
      starMass: 5.0
    };
    this.bodies = this.createInitialBodies();
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.animFrameId = 0;

    this.bus.on('params:update', (data) => {
      this.params = { ...data };
      this.updateOrbitSpeeds();
    });
  }

  private createInitialBodies(): CelestialBody[] {
    const bodies: CelestialBody[] = [];

    const star: CelestialBody = {
      id: 'star-0',
      name: '太阳',
      type: 'star',
      mass: this.params.starMass,
      radius: 3.0,
      color: '#FFAA00',
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      orbitRadius: 0,
      orbitAngle: 0,
      orbitSpeed: 0,
      emissiveIntensity: 1.5
    };
    bodies.push(star);

    for (let i = 0; i < 5; i++) {
      const orbitRadius = 5 + i * 3 + Math.random() * 2;
      const radius = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const orbitSpeed = this.calculateOrbitSpeed(orbitRadius);

      bodies.push({
        id: `planet-${i}`,
        name: PLANET_NAMES[i],
        type: 'planet',
        mass: 0.1 + Math.random() * 0.4,
        radius,
        color: PLANET_COLORS[i],
        position: {
          x: Math.cos(angle) * orbitRadius,
          y: (Math.random() - 0.5) * 0.5,
          z: Math.sin(angle) * orbitRadius
        },
        velocity: { x: 0, y: 0, z: 0 },
        orbitRadius,
        orbitAngle: angle,
        orbitSpeed
      });
    }

    return bodies;
  }

  private calculateOrbitSpeed(orbitRadius: number): number {
    const G = this.params.gravitationalConstant;
    const M = this.params.starMass;
    return Math.sqrt((G * M) / Math.pow(orbitRadius, 3)) * 0.5;
  }

  private updateOrbitSpeeds(): void {
    for (const body of this.bodies) {
      if (body.type === 'planet') {
        body.orbitSpeed = this.calculateOrbitSpeed(body.orbitRadius);
      }
      if (body.type === 'star') {
        body.mass = this.params.starMass;
      }
    }
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  public stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const frameTime = Math.min((now - this.lastTime) / 1000, MAX_ACCUMULATOR);
    this.lastTime = now;
    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }

    this.bus.emit('bodies:update', this.bodies);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    for (const body of this.bodies) {
      if (body.type === 'planet') {
        body.orbitAngle += body.orbitSpeed * dt;
        body.position.x = Math.cos(body.orbitAngle) * body.orbitRadius;
        body.position.z = Math.sin(body.orbitAngle) * body.orbitRadius;
      }
    }
  }

  public getBodies(): CelestialBody[] {
    return this.bodies;
  }

  public getParams(): PhysicsParams {
    return { ...this.params };
  }

  public getOrbitalPeriod(body: CelestialBody): number {
    if (body.type !== 'planet' || body.orbitSpeed === 0) return 0;
    return (2 * Math.PI) / body.orbitSpeed;
  }
}
