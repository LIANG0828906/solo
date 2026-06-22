import { v4 as uuidv4 } from 'uuid';
import { PhysicsEngine } from './engine/PhysicsEngine';
import { AsteroidField } from './engine/AsteroidField';
import type {
  Ship,
  Asteroid,
  EnergyOrb,
  Particle,
  Star,
  SpaceStation,
  GameState,
  ThrustInput,
  ScreenShake,
  ArmorFlash,
} from './types';

const MAX_PARTICLES = 500;
const STAR_COUNT = 200;
const ENERGY_TARGET = 10;
const ENERGY_PER_ORB = 10;
const CELEBRATION_DURATION = 3000;

export class GameManager {
  private canvasWidth: number;
  private canvasHeight: number;
  private physicsEngine: PhysicsEngine;
  private asteroidField: AsteroidField;
  private ship: Ship;
  private particles: Particle[] = [];
  private stars: Star[] = [];
  private spaceStation: SpaceStation;
  private gameState: GameState;
  private thrustInput: ThrustInput = { angle: 0, magnitude: 0 };
  private screenShake: ScreenShake = { active: false, duration: 0, intensity: 0, time: 0 };
  private armorFlash: ArmorFlash = { active: false, duration: 0, frequency: 0, time: 0 };
  private celebrationParticles: Particle[] = [];
  private celebrationActive = false;
  private celebrationTime = 0;
  private listeners: Set<() => void> = new Set();
  private lastTime = 0;
  private animationFrameId: number | null = null;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.physicsEngine = new PhysicsEngine(width, height);
    this.asteroidField = new AsteroidField(width, height);
    this.ship = this.physicsEngine.createShip();
    this.stars = this.generateStars();
    this.spaceStation = {
      position: { x: width - 100, y: 100 },
      radius: 40,
      pulsePhase: 0,
    };
    this.gameState = {
      status: 'playing',
      score: 0,
      energyCollected: 0,
      energyTarget: ENERGY_TARGET,
      time: 0,
    };
  }

  private generateStars(): Star[] {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 0.5 + Math.random() * 2,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    return stars;
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;

    if (this.gameState.status === 'playing') {
      this.update(deltaTime);
    }

    this.notifyListeners();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    this.gameState.time += deltaTime;

    this.physicsEngine.updateShip(this.ship, this.thrustInput, deltaTime);

    this.asteroidField.update(deltaTime);

    const asteroids = this.asteroidField.getAsteroids();

    const collision = this.physicsEngine.checkShipAsteroidCollision(this.ship, asteroids);
    if (collision.hit && collision.asteroid) {
      this.handleShipAsteroidCollision(collision.asteroid, collision.damage);
    }

    const orb = this.physicsEngine.checkShipEnergyOrbCollision(
      this.ship,
      this.asteroidField.getEnergyOrbs()
    );
    if (orb) {
      this.handleEnergyOrbCollection(orb);
    }

    const reachedStation = this.physicsEngine.checkShipStationCollision(
      this.ship,
      this.spaceStation.position,
      this.spaceStation.radius
    );
    if (reachedStation && this.gameState.energyCollected >= this.gameState.energyTarget) {
      this.handleVictory();
    }

    this.updateParticles(deltaTime);
    this.updateExhaustParticles();
    this.updateScreenShake(deltaTime);
    this.updateArmorFlash(deltaTime);
    this.updateStars(deltaTime);
    this.updateStationPulse(deltaTime);
    this.updateCelebration(deltaTime);
  }

  private handleShipAsteroidCollision(asteroid: Asteroid, damage: number): void {
    this.ship.armor -= damage;

    this.triggerScreenShake(200, 3);
    this.triggerArmorFlash(1500, 3);
    this.spawnDebrisParticles(asteroid.position, asteroid.color, asteroid.radius);

    const dx = this.ship.position.x - asteroid.position.x;
    const dy = this.ship.position.y - asteroid.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const pushForce = 2;
    this.ship.velocity.x += (dx / dist) * pushForce;
    this.ship.velocity.y += (dy / dist) * pushForce;

    if (this.ship.armor <= 0) {
      this.ship.armor = 0;
      this.handleDefeat();
    }
  }

  private handleEnergyOrbCollection(orb: EnergyOrb): void {
    this.asteroidField.collectOrb(orb.id);
    this.ship.energy = Math.min(this.ship.maxEnergy, this.ship.energy + ENERGY_PER_ORB);
    this.gameState.energyCollected++;
    this.gameState.score += 100;

    if (this.ship.energy >= this.ship.maxEnergy) {
      this.ship.shieldActive = true;
      this.ship.shieldTimer = 3000;
      this.ship.energy = 0;
    }

    setTimeout(() => {
      if (this.gameState.status === 'playing') {
        this.asteroidField.respawnOrb(orb.id);
      }
    }, 5000);
  }

  private handleVictory(): void {
    this.gameState.status = 'won';
    this.gameState.score += 1000;
    this.celebrationActive = true;
    this.celebrationTime = 0;
    this.spawnCelebrationParticles();
  }

  private handleDefeat(): void {
    this.gameState.status = 'lost';
  }

  private spawnDebrisParticles(position: { x: number; y: number }, color: string, size: number): void {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.addParticle({
        id: uuidv4(),
        position: { x: position.x, y: position.y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: 2000,
        maxLife: 2000,
        color,
        size: 2 + Math.random() * (size / 4),
        type: 'debris',
      });
    }
  }

  private spawnCelebrationParticles(): void {
    for (let i = 0; i < 100; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 2 + Math.random() * 4;
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      this.celebrationParticles.push({
        id: uuidv4(),
        position: { ...this.spaceStation.position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 2,
        },
        life: CELEBRATION_DURATION,
        maxLife: CELEBRATION_DURATION,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        type: 'celebration',
      });
    }
  }

  private updateExhaustParticles(): void {
    if (this.thrustInput.magnitude > 0.1) {
      const thrust = this.thrustInput.magnitude;
      const particleCount = Math.floor(thrust * 3) + 1;

      for (let i = 0; i < particleCount; i++) {
        const spread = 0.3;
        const angle = this.ship.angle + Math.PI + (Math.random() - 0.5) * spread;
        const speed = 2 + Math.random() * 2;
        const offsetAngle = this.ship.angle + Math.PI;
        const offsetDist = this.ship.radius * 0.8;

        this.addParticle({
          id: uuidv4(),
          position: {
            x: this.ship.position.x + Math.cos(offsetAngle) * offsetDist,
            y: this.ship.position.y + Math.sin(offsetAngle) * offsetDist,
          },
          velocity: {
            x: Math.cos(angle) * speed + this.ship.velocity.x * 0.3,
            y: Math.sin(angle) * speed + this.ship.velocity.y * 0.3,
          },
          life: 500 + Math.random() * 300,
          maxLife: 800,
          color: `hsl(${200 + Math.random() * 40}, 100%, ${60 + Math.random() * 20}%)`,
          size: 2 + Math.random() * 3 * thrust,
          type: 'exhaust',
        });
      }
    }
  }

  private addParticle(particle: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    this.particles.push(particle);
  }

  private updateParticles(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    this.particles = this.particles.filter(p => {
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.velocity.x *= 0.99;
      p.velocity.y *= 0.99;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }

  private updateCelebration(deltaTime: number): void {
    if (!this.celebrationActive) return;

    this.celebrationTime += deltaTime;
    if (this.celebrationTime >= CELEBRATION_DURATION) {
      this.celebrationActive = false;
    }

    const dt = deltaTime / 16.67;
    this.celebrationParticles = this.celebrationParticles.filter(p => {
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.velocity.y += 0.02 * dt;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }

  private triggerScreenShake(duration: number, intensity: number): void {
    this.screenShake = {
      active: true,
      duration,
      intensity,
      time: 0,
    };
  }

  private updateScreenShake(deltaTime: number): void {
    if (!this.screenShake.active) return;

    this.screenShake.time += deltaTime;
    if (this.screenShake.time >= this.screenShake.duration) {
      this.screenShake.active = false;
    }
  }

  getScreenShakeOffset(): { x: number; y: number } {
    if (!this.screenShake.active) return { x: 0, y: 0 };

    const progress = 1 - this.screenShake.time / this.screenShake.duration;
    const intensity = this.screenShake.intensity * progress;

    return {
      x: (Math.random() - 0.5) * intensity * 2,
      y: (Math.random() - 0.5) * intensity * 2,
    };
  }

  private triggerArmorFlash(duration: number, frequency: number): void {
    this.armorFlash = {
      active: true,
      duration,
      frequency,
      time: 0,
    };
  }

  private updateArmorFlash(deltaTime: number): void {
    if (!this.armorFlash.active) return;

    this.armorFlash.time += deltaTime;
    if (this.armorFlash.time >= this.armorFlash.duration) {
      this.armorFlash.active = false;
    }
  }

  isArmorFlashing(): boolean {
    if (!this.armorFlash.active) return false;
    const flashPeriod = 1000 / this.armorFlash.frequency;
    return Math.floor(this.armorFlash.time / flashPeriod) % 2 === 0;
  }

  private updateStars(deltaTime: number): void {
    const dt = deltaTime / 1000;
    for (const star of this.stars) {
      star.twinklePhase += dt * star.twinkleSpeed * Math.PI * 2;
    }
  }

  private updateStationPulse(deltaTime: number): void {
    const dt = deltaTime / 1000;
    this.spaceStation.pulsePhase += dt * Math.PI * 2;
  }

  setThrustInput(angle: number, magnitude: number): void {
    this.thrustInput.angle = angle;
    this.thrustInput.magnitude = magnitude;
  }

  getShip(): Ship {
    return { ...this.ship };
  }

  getAsteroids(): Asteroid[] {
    return this.asteroidField.getAsteroids().map(a => ({ ...a }));
  }

  getEnergyOrbs(): EnergyOrb[] {
    return this.asteroidField.getEnergyOrbs().map(o => ({ ...o }));
  }

  getParticles(): Particle[] {
    return [...this.particles, ...this.celebrationParticles];
  }

  getStars(): Star[] {
    return this.stars;
  }

  getSpaceStation(): SpaceStation {
    return { ...this.spaceStation };
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getThrustInput(): ThrustInput {
    return { ...this.thrustInput };
  }

  isCelebrationActive(): boolean {
    return this.celebrationActive;
  }

  restart(): void {
    this.ship = this.physicsEngine.createShip();
    this.asteroidField = new AsteroidField(this.canvasWidth, this.canvasHeight);
    this.particles = [];
    this.celebrationParticles = [];
    this.celebrationActive = false;
    this.celebrationTime = 0;
    this.gameState = {
      status: 'playing',
      score: 0,
      energyCollected: 0,
      energyTarget: ENERGY_TARGET,
      time: 0,
    };
    this.thrustInput = { angle: 0, magnitude: 0 };
    this.screenShake = { active: false, duration: 0, intensity: 0, time: 0 };
    this.armorFlash = { active: false, duration: 0, frequency: 0, time: 0 };
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.physicsEngine.resize(width, height);
    this.asteroidField.resize(width, height);
    this.spaceStation.position = { x: width - 100, y: 100 };
    this.stars = this.generateStars();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
