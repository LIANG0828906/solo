import { BodyState, EngineConfig, EventBus } from '../types';

export class PhysicsEngine {
  private bodies: BodyState[] = [];
  private config: EngineConfig = {
    gravitationalConstant: 0.5,
    starMass: 5
  };
  private eventBus: EventBus;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
    this.initializeBodies();
  }

  private setupEventListeners(): void {
    this.eventBus.on('config:update', (config) => {
      this.updateConfig(config as Partial<EngineConfig>);
    });

    this.eventBus.on('engine:start', () => {
      this.start();
    });

    this.eventBus.on('engine:stop', () => {
      this.stop();
    });
  }

  private initializeBodies(): void {
    const star: BodyState = {
      id: 'star-0',
      name: '恒星 Helios',
      type: 'star',
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      mass: this.config.starMass,
      radius: 3,
      color: '#FFAA00',
      orbitRadius: 0,
      angularSpeed: 0,
      angle: 0,
      emissiveIntensity: 1.5
    };

    this.bodies.push(star);

    const planetNames = ['Aether', 'Nova', 'Terra', 'Aqua', 'Ignis'];
    const planetColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    for (let i = 0; i < 5; i++) {
      const orbitRadius = 5 + (i + 1) * 3;
      const radius = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const orbitalSpeed = this.calculateOrbitalSpeed(orbitRadius);

      const planet: BodyState = {
        id: `planet-${i}`,
        name: `行星 ${planetNames[i]}`,
        type: 'planet',
        position: {
          x: Math.cos(angle) * orbitRadius,
          y: 0,
          z: Math.sin(angle) * orbitRadius
        },
        velocity: {
          x: -Math.sin(angle) * orbitalSpeed,
          y: 0,
          z: Math.cos(angle) * orbitalSpeed
        },
        mass: 0.1 + Math.random() * 0.2,
        radius: radius,
        color: planetColors[i],
        orbitRadius: orbitRadius,
        angularSpeed: orbitalSpeed / orbitRadius,
        angle: angle
      };

      this.bodies.push(planet);
    }

    this.eventBus.emit('bodies:initialized', this.bodies);
  }

  private calculateOrbitalSpeed(orbitRadius: number): number {
    return Math.sqrt(
      (this.config.gravitationalConstant * this.config.starMass) / orbitRadius
    );
  }

  private updateConfig(newConfig: Partial<EngineConfig>): void {
    const prevStarMass = this.config.starMass;
    const prevG = this.config.gravitationalConstant;

    if (newConfig.gravitationalConstant !== undefined) {
      this.config.gravitationalConstant = newConfig.gravitationalConstant;
    }
    if (newConfig.starMass !== undefined) {
      this.config.starMass = newConfig.starMass;
      const star = this.bodies.find((b) => b.type === 'star');
      if (star) {
        star.mass = this.config.starMass;
      }
    }

    const speedRatio = Math.sqrt(
      (this.config.gravitationalConstant * this.config.starMass) /
        (prevG * prevStarMass)
    );

    this.bodies.forEach((body) => {
      if (body.type === 'planet') {
        body.angularSpeed *= speedRatio;
        body.velocity.x *= speedRatio;
        body.velocity.z *= speedRatio;
      }
    });

    this.eventBus.emit('config:updated', this.config);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop(): void {
    this.running = false;
  }

  private animate(): void {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(deltaTime);

    requestAnimationFrame(() => this.animate());
  }

  update(deltaTime: number): void {
    this.bodies.forEach((body) => {
      if (body.type === 'planet') {
        body.angle += body.angularSpeed * deltaTime;
        body.position.x = Math.cos(body.angle) * body.orbitRadius;
        body.position.z = Math.sin(body.angle) * body.orbitRadius;
      }
    });

    this.eventBus.emit('bodies:updated', this.bodies);
  }

  getBodies(): BodyState[] {
    return this.bodies;
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  getOrbitalPeriod(orbitRadius: number): number {
    const speed = this.calculateOrbitalSpeed(orbitRadius);
    const circumference = 2 * Math.PI * orbitRadius;
    return circumference / speed;
  }
}
