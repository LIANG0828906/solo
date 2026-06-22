export interface Vec2 {
  x: number;
  y: number;
}

export interface SpacecraftState {
  position: Vec2;
  velocity: Vec2;
}

export interface PlanetState {
  position: Vec2;
  mass: number;
  radius: number;
}

export type OrbitType = 'elliptical' | 'hyperbolic' | 'parabolic';

export interface SimulationConfig {
  initialSpeed: number;
  launchAngle: number;
  planetMass: number;
}

export const G_EFFECTIVE = 800;
export const DT = 1 / 60;
export const MAX_TRAIL_POINTS = 3000;
export const PLANET_RADIUS = 40;
export const SPACECRAFT_RADIUS = 4;

export class PhysicsEngine {
  private planet: PlanetState;
  private spacecraft: SpacecraftState;
  private config: SimulationConfig;
  private canvasWidth: number;
  private canvasHeight: number;
  public collided: boolean;
  public escaped: boolean;
  public escapeDetected: boolean;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    config: SimulationConfig
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.config = config;

    this.planet = {
      position: { x: canvasWidth / 2, y: canvasHeight / 2 },
      mass: config.planetMass,
      radius: PLANET_RADIUS
    };

    this.spacecraft = this.createInitialSpacecraft();
    this.collided = false;
    this.escaped = false;
    this.escapeDetected = false;
  }

  private createInitialSpacecraft(): SpacecraftState {
    const angleRad = (this.config.launchAngle * Math.PI) / 180;
    const speed = this.config.initialSpeed;
    const startX = 100;
    const startY = this.canvasHeight / 2;

    return {
      position: { x: startX, y: startY },
      velocity: {
        x: speed * Math.cos(angleRad),
        y: speed * Math.sin(angleRad)
      }
    };
  }

  public updateConfig(config: SimulationConfig): void {
    this.config = config;
    this.planet.mass = config.planetMass;
    this.reset();
  }

  public resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.planet.position = { x: width / 2, y: height / 2 };
  }

  public reset(): void {
    this.spacecraft = this.createInitialSpacecraft();
    this.collided = false;
    this.escaped = false;
    this.escapeDetected = false;
  }

  public step(): void {
    if (this.collided || this.escaped) {
      return;
    }

    const dx = this.spacecraft.position.x - this.planet.position.x;
    const dy = this.spacecraft.position.y - this.planet.position.y;
    const rSq = dx * dx + dy * dy;
    const r = Math.sqrt(rSq);

    if (r < this.planet.radius + SPACECRAFT_RADIUS) {
      this.collided = true;
      return;
    }

    const gm = G_EFFECTIVE * this.planet.mass;
    const rCubed = rSq * r;
    const ax = -(gm * dx) / rCubed;
    const ay = -(gm * dy) / rCubed;

    this.spacecraft.velocity.x += ax * DT;
    this.spacecraft.velocity.y += ay * DT;

    this.spacecraft.position.x += this.spacecraft.velocity.x * DT;
    this.spacecraft.position.y += this.spacecraft.velocity.y * DT;

    const margin = 200;
    if (
      this.spacecraft.position.x < -margin ||
      this.spacecraft.position.x > this.canvasWidth + margin ||
      this.spacecraft.position.y < -margin ||
      this.spacecraft.position.y > this.canvasHeight + margin
    ) {
      this.escaped = true;
    }
  }

  public getSpacecraft(): SpacecraftState {
    return {
      position: { ...this.spacecraft.position },
      velocity: { ...this.spacecraft.velocity }
    };
  }

  public getPlanet(): PlanetState {
    return {
      position: { ...this.planet.position },
      mass: this.planet.mass,
      radius: this.planet.radius
    };
  }

  public getSpeed(): number {
    return Math.hypot(this.spacecraft.velocity.x, this.spacecraft.velocity.y);
  }

  public getDistance(): number {
    const dx = this.spacecraft.position.x - this.planet.position.x;
    const dy = this.spacecraft.position.y - this.planet.position.y;
    return Math.hypot(dx, dy);
  }

  public getEscapeSpeed(): number {
    const r = this.getDistance();
    if (r <= 0) return Infinity;
    const gm = G_EFFECTIVE * this.planet.mass;
    return Math.sqrt((2 * gm) / r);
  }

  public getOrbitType(): OrbitType {
    const v = this.getSpeed();
    const vesc = this.getEscapeSpeed();
    const ratio = v / vesc;

    if (Math.abs(ratio - 1.0) < 0.01) {
      return 'parabolic';
    } else if (ratio > 1.0) {
      if (!this.escapeDetected) {
        this.escapeDetected = true;
      }
      return 'hyperbolic';
    } else {
      return 'elliptical';
    }
  }

  public hasEscapedGravity(): boolean {
    return this.getSpeed() > this.getEscapeSpeed();
  }
}
