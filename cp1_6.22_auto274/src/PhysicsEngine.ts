export interface Vec2 {
  x: number;
  y: number;
}

export interface PlanetData {
  id: number;
  x: number;
  y: number;
  mass: number;
}

const G = 800;
const DT = 1 / 60;
const MAX_TRAJECTORY_POINTS = 200;
const MIN_DIST_SQ = 900;

export class PhysicsEngine {
  private planets: PlanetData[] = [];
  private shipPos: Vec2 = { x: 0, y: 0 };
  private shipVel: Vec2 = { x: 0, y: 0 };
  private trajectoryPoints: Vec2[] = [];
  private running = false;

  setPlanets(planets: PlanetData[]) {
    this.planets = planets;
  }

  setShipInitial(pos: Vec2, vel: Vec2) {
    this.shipPos = { ...pos };
    this.shipVel = { ...vel };
    this.trajectoryPoints = [{ ...pos }];
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  reset(pos: Vec2, vel: Vec2) {
    this.running = false;
    this.shipPos = { ...pos };
    this.shipVel = { ...vel };
    this.trajectoryPoints = [{ ...pos }];
  }

  getTrajectoryPoints(): Vec2[] {
    return this.trajectoryPoints;
  }

  getShipPosition(): Vec2 {
    return { ...this.shipPos };
  }

  getShipVelocity(): Vec2 {
    return { ...this.shipVel };
  }

  predictTrajectory(pos: Vec2, vel: Vec2, steps: number): Vec2[] {
    const points: Vec2[] = [{ ...pos }];
    let p = { ...pos };
    let v = { ...vel };
    for (let i = 0; i < steps; i++) {
      const acc = this.computeAcceleration(p);
      v.x += acc.x * DT;
      v.y += acc.y * DT;
      p = { x: p.x + v.x * DT, y: p.y + v.y * DT };
      points.push({ ...p });
    }
    return points;
  }

  step(): boolean {
    if (!this.running) return false;

    const acc = this.computeAcceleration(this.shipPos);
    this.shipVel.x += acc.x * DT;
    this.shipVel.y += acc.y * DT;
    this.shipPos.x += this.shipVel.x * DT;
    this.shipPos.y += this.shipVel.y * DT;

    this.trajectoryPoints.push({ ...this.shipPos });
    if (this.trajectoryPoints.length > MAX_TRAJECTORY_POINTS) {
      this.trajectoryPoints.shift();
    }

    return true;
  }

  private computeAcceleration(pos: Vec2): Vec2 {
    let ax = 0;
    let ay = 0;
    for (const planet of this.planets) {
      const dx = planet.x - pos.x;
      const dy = planet.y - pos.y;
      const distSq = Math.max(dx * dx + dy * dy, MIN_DIST_SQ);
      const dist = Math.sqrt(distSq);
      const force = (G * planet.mass) / distSq;
      ax += (force * dx) / dist;
      ay += (force * dy) / dist;
    }
    return { x: ax, y: ay };
  }

  isOutOfBounds(width: number, height: number): boolean {
    const margin = 200;
    return (
      this.shipPos.x < -margin ||
      this.shipPos.x > width + margin ||
      this.shipPos.y < -margin ||
      this.shipPos.y > height + margin
    );
  }
}
