import { Vector2, Vector2Utils, PhysicsBody, GravitySource } from './physics';
import { ResourceType, ResourceTypes } from './ship';

export interface Star {
  position: Vector2;
  radius: number;
  color: string;
  mass: number;
  flickerSpeed: number;
  flickerPhase: number;
}

export interface Planet {
  star: Star;
  semiMajorAxis: number;
  eccentricity: number;
  angle: number;
  angularSpeed: number;
  radius: number;
  color: string;
  position: Vector2;
}

export interface ResourceNode extends PhysicsBody {
  id: number;
  type: ResourceType;
  amount: number;
  collectProgress: number;
  isCollecting: boolean;
  glowPhase: number;
  shrinking: boolean;
  shrinkProgress: number;
  collected: boolean;
  collectRadius: number;
}

export interface StarfieldUpdateResult {
  newlyCollecting: ResourceNode[];
  justCompleted: ResourceNode[];
}

export class Starfield {
  private width: number;
  private height: number;
  private stars: Star[] = [];
  private planets: Planet[] = [];
  private resourceNodes: ResourceNode[] = [];
  private backgroundStars: Array<{ x: number; y: number; size: number; alpha: number; flickerSpeed: number; phase: number }> = [];
  private nextResourceId: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.generate();
  }

  private generate(): void {
    this.generateBackgroundStars();
    this.generateStars();
    this.generatePlanets();
    this.generateResourceNodes();
  }

  private generateBackgroundStars(): void {
    const count = 300;
    for (let i = 0; i < count; i++) {
      this.backgroundStars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        flickerSpeed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private generateStars(): void {
    const starCount = 4 + Math.floor(Math.random() * 4);
    const margin = 100;

    for (let i = 0; i < starCount; i++) {
      const position: Vector2 = {
        x: margin + Math.random() * (this.width - margin * 2),
        y: margin + Math.random() * (this.height - margin * 2)
      };

      const star: Star = {
        position,
        radius: 8 + Math.random() * 12,
        color: Math.random() > 0.5 ? '#ffffff' : '#fbbf24',
        mass: 200 + Math.random() * 300,
        flickerSpeed: 0.5 + Math.random() * 1.5,
        flickerPhase: Math.random() * Math.PI * 2
      };

      this.stars.push(star);
    }
  }

  private generatePlanets(): void {
    for (const star of this.stars) {
      const planetCount = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < planetCount; i++) {
        const semiMajorAxis = 80 + Math.random() * 120;
        const eccentricity = 0.1 + Math.random() * 0.5;
        const angle = Math.random() * Math.PI * 2;
        const angularSpeed = 0.2 + Math.random() * 0.5;

        const planet: Planet = {
          star,
          semiMajorAxis,
          eccentricity,
          angle,
          angularSpeed,
          radius: 4 + Math.random() * 8,
          color: this.randomPlanetColor(),
          position: Vector2Utils.create()
        };

        this.updatePlanetPosition(planet);
        this.planets.push(planet);
      }
    }
  }

  private randomPlanetColor(): string {
    const colors = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#fb923c', '#94a3b8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private generateResourceNodes(): void {
    for (const planet of this.planets) {
      const nodeCount = 1 + Math.floor(Math.random() * 2);

      for (let i = 0; i < nodeCount; i++) {
        const offsetAngle = Math.random() * Math.PI * 2;
        const offsetDist = 25 + Math.random() * 20;
        const position: Vector2 = {
          x: planet.position.x + Math.cos(offsetAngle) * offsetDist,
          y: planet.position.y + Math.sin(offsetAngle) * offsetDist
        };

        const types: ResourceType[] = [ResourceTypes.CRYSTAL, ResourceTypes.METAL, ResourceTypes.GAS, ResourceTypes.ENERGY];
        const type = types[Math.floor(Math.random() * types.length)];

        this.resourceNodes.push({
          id: this.nextResourceId++,
          position,
          velocity: Vector2Utils.create(),
          mass: 0.1,
          radius: 10,
          type,
          amount: 1,
          collectProgress: 0,
          isCollecting: false,
          glowPhase: Math.random() * Math.PI * 2,
          shrinking: false,
          shrinkProgress: 0,
          collected: false,
          collectRadius: 30
        });
      }
    }
  }

  updatePlanetPosition(planet: Planet): void {
    const r = planet.semiMajorAxis * (1 - planet.eccentricity * planet.eccentricity) /
      (1 + planet.eccentricity * Math.cos(planet.angle));
    planet.position = {
      x: planet.star.position.x + r * Math.cos(planet.angle),
      y: planet.star.position.y + r * Math.sin(planet.angle)
    };
  }

  update(dt: number, shipPosition: Vector2): StarfieldUpdateResult {
    for (const planet of this.planets) {
      planet.angle += planet.angularSpeed * dt;
      this.updatePlanetPosition(planet);
    }

    for (const node of this.resourceNodes) {
      node.glowPhase += dt * Math.PI * 2;

      if (node.shrinking) {
        node.shrinkProgress += dt / 0.3;
        node.radius = 10 * Math.max(0, 1 - node.shrinkProgress);
        if (node.shrinkProgress >= 1) {
          node.collected = true;
        }
      }
    }

    const result = this.checkCollection(shipPosition, dt);

    this.resourceNodes = this.resourceNodes.filter(n => !n.collected);

    return result;
  }

  private checkCollection(shipPosition: Vector2, dt: number): StarfieldUpdateResult {
    const newlyCollecting: ResourceNode[] = [];
    const justCompleted: ResourceNode[] = [];

    for (const node of this.resourceNodes) {
      if (node.shrinking) continue;

      const dist = Vector2Utils.distance(shipPosition, node.position);
      if (dist <= node.collectRadius) {
        if (!node.isCollecting) {
          node.isCollecting = true;
          newlyCollecting.push(node);
        }
        node.collectProgress += (100 / 2) * dt;

        if (node.collectProgress >= 100) {
          node.isCollecting = false;
          node.shrinking = true;
          node.shrinkProgress = 0;
          justCompleted.push(node);
        }
      } else {
        if (node.isCollecting) {
          node.isCollecting = false;
          node.collectProgress = 0;
        }
      }
    }

    return { newlyCollecting, justCompleted };
  }

  getStars(): Star[] {
    return this.stars;
  }

  getPlanets(): Planet[] {
    return this.planets;
  }

  getResourceNodes(): ResourceNode[] {
    return this.resourceNodes;
  }

  getBackgroundStars() {
    return this.backgroundStars;
  }

  getGravitySources(): GravitySource[] {
    return this.stars.map(star => ({
      position: star.position,
      mass: star.mass,
      radius: star.radius
    }));
  }

  getCollectingNodes(): ResourceNode[] {
    return this.resourceNodes.filter(n => n.isCollecting);
  }

  getCompletedNodes(): ResourceNode[] {
    return this.resourceNodes.filter(n => n.shrinking && !n.collected);
  }

  isNearStar(position: Vector2, threshold: number = 50): Star | null {
    for (const star of this.stars) {
      const dist = Vector2Utils.distance(position, star.position);
      if (dist <= threshold + star.radius) {
        return star;
      }
    }
    return null;
  }
}
