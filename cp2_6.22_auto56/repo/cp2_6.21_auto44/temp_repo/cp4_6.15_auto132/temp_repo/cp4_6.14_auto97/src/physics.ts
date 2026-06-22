export interface Vector2 {
  x: number;
  y: number;
}

export interface PhysicsBody {
  position: Vector2;
  velocity: Vector2;
  mass: number;
  radius: number;
  readonly _physicsId?: number;
}

export interface GravitySource {
  position: Vector2;
  mass: number;
  radius: number;
}

export interface CollisionResult {
  collided: boolean;
  normal: Vector2;
  penetration: number;
}

const GRAVITATIONAL_CONSTANT = 50;
const CELL_SIZE = 50;

export class SpatialHash {
  private cells: Map<string, PhysicsBody[]>;
  private cellSize: number;

  constructor(cellSize: number = CELL_SIZE) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear(): void {
    this.cells.clear();
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(body: PhysicsBody): void {
    const minX = Math.floor((body.position.x - body.radius) / this.cellSize);
    const maxX = Math.floor((body.position.x + body.radius) / this.cellSize);
    const minY = Math.floor((body.position.y - body.radius) / this.cellSize);
    const maxY = Math.floor((body.position.y + body.radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = [];
          this.cells.set(key, cell);
        }
        if (!cell.includes(body)) {
          cell.push(body);
        }
      }
    }
  }

  query(body: PhysicsBody): PhysicsBody[] {
    return this.queryRange(body.position, body.radius, body);
  }

  queryRange(center: Vector2, range: number, excludeBody?: PhysicsBody): PhysicsBody[] {
    const result: PhysicsBody[] = [];
    const seen = new Set<PhysicsBody>();

    const minX = Math.floor((center.x - range) / this.cellSize);
    const maxX = Math.floor((center.x + range) / this.cellSize);
    const minY = Math.floor((center.y - range) / this.cellSize);
    const maxY = Math.floor((center.y + range) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const other of cell) {
            if (other !== excludeBody && !seen.has(other)) {
              seen.add(other);
              result.push(other);
            }
          }
        }
      }
    }

    return result;
  }

  queryPoint(px: number, py: number): PhysicsBody[] {
    const cellX = Math.floor(px / this.cellSize);
    const cellY = Math.floor(py / this.cellSize);
    const result: PhysicsBody[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          result.push(...cell);
        }
      }
    }
    return result;
  }
}

export const Vector2Utils = {
  create(x: number = 0, y: number = 0): Vector2 {
    return { x, y };
  },

  add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  sub(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  mul(v: Vector2, s: number): Vector2 {
    return { x: v.x * s, y: v.y * s };
  },

  div(v: Vector2, s: number): Vector2 {
    return { x: v.x / s, y: v.y / s };
  },

  length(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  lengthSquared(v: Vector2): number {
    return v.x * v.x + v.y * v.y;
  },

  normalize(v: Vector2): Vector2 {
    const len = Vector2Utils.length(v);
    if (len === 0) return { x: 0, y: 0 };
    return Vector2Utils.div(v, len);
  },

  distance(a: Vector2, b: Vector2): number {
    return Vector2Utils.length(Vector2Utils.sub(a, b));
  },

  distanceSquared(a: Vector2, b: Vector2): number {
    return Vector2Utils.lengthSquared(Vector2Utils.sub(a, b));
  },

  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  angle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  },

  fromAngle(angle: number, magnitude: number = 1): Vector2 {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
  },

  lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  },

  clone(v: Vector2): Vector2 {
    return { x: v.x, y: v.y };
  }
};

export class PhysicsEngine {
  private spatialHash: SpatialHash;
  private gravitySources: GravitySource[] = [];
  private bodyIdCounter: number = 0;

  constructor() {
    this.spatialHash = new SpatialHash(CELL_SIZE);
  }

  private ensureBodyId(body: PhysicsBody): number {
    if (body._physicsId === undefined) {
      (body as PhysicsBody & { _physicsId: number })._physicsId = ++this.bodyIdCounter;
    }
    return body._physicsId;
  }

  setGravitySources(sources: GravitySource[]): void {
    this.gravitySources = sources;
  }

  calculateGravity(body: PhysicsBody): Vector2 {
    let totalForce = Vector2Utils.create();

    for (const source of this.gravitySources) {
      const direction = Vector2Utils.sub(source.position, body.position);
      const distance = Vector2Utils.length(direction);

      if (distance < source.radius) {
        continue;
      }

      const forceMagnitude = (GRAVITATIONAL_CONSTANT * source.mass) / (distance * distance);
      const forceDirection = Vector2Utils.normalize(direction);
      const force = Vector2Utils.mul(forceDirection, forceMagnitude);

      totalForce = Vector2Utils.add(totalForce, force);
    }

    return totalForce;
  }

  updateBody(body: PhysicsBody, acceleration: Vector2, dt: number): void {
    const gravity = this.calculateGravity(body);
    const totalAcceleration = Vector2Utils.add(acceleration, gravity);

    body.velocity = Vector2Utils.add(
      body.velocity,
      Vector2Utils.mul(totalAcceleration, dt)
    );

    body.position = Vector2Utils.add(
      body.position,
      Vector2Utils.mul(body.velocity, dt)
    );
  }

  checkCollision(a: PhysicsBody, b: PhysicsBody): CollisionResult {
    const delta = Vector2Utils.sub(a.position, b.position);
    const distance = Vector2Utils.length(delta);
    const minDistance = a.radius + b.radius;

    if (distance < minDistance) {
      const normal = distance > 0 ? Vector2Utils.normalize(delta) : Vector2Utils.create(0, -1);
      const penetration = minDistance - distance;
      return { collided: true, normal, penetration };
    }

    return { collided: false, normal: Vector2Utils.create(), penetration: 0 };
  }

  resolveCollision(body: PhysicsBody, collision: CollisionResult): void {
    body.position = Vector2Utils.add(
      body.position,
      Vector2Utils.mul(collision.normal, collision.penetration)
    );

    const dot = Vector2Utils.dot(body.velocity, collision.normal);
    if (dot < 0) {
      body.velocity = Vector2Utils.sub(
        body.velocity,
        Vector2Utils.mul(collision.normal, 2 * dot * 0.3)
      );
    }
  }

  rebuildSpatialHash(bodies: PhysicsBody[]): void {
    this.spatialHash.clear();
    for (const body of bodies) {
      this.ensureBodyId(body);
      this.spatialHash.insert(body);
    }
  }

  getPotentialCollisions(body: PhysicsBody): PhysicsBody[] {
    this.ensureBodyId(body);
    return this.spatialHash.queryRange(body.position, body.radius + CELL_SIZE, body);
  }

  detectCollisions(bodies: PhysicsBody[]): Array<{ a: PhysicsBody; b: PhysicsBody; result: CollisionResult }> {
    this.rebuildSpatialHash(bodies);
    const results: Array<{ a: PhysicsBody; b: PhysicsBody; result: CollisionResult }> = [];
    const checked = new Set<string>();

    for (const body of bodies) {
      this.ensureBodyId(body);
      const nearby = this.spatialHash.queryRange(body.position, body.radius + CELL_SIZE, body);

      for (const other of nearby) {
        this.ensureBodyId(other);
        const idA = body._physicsId!;
        const idB = other._physicsId!;
        if (idA === idB) continue;

        const pairKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const result = this.checkCollision(body, other);
        if (result.collided) {
          results.push({ a: body, b: other, result });
        }
      }
    }

    return results;
  }

  getSpatialHash(): SpatialHash {
    return this.spatialHash;
  }

  debugGetGridStats(): { cellSize: number; totalCells: number; totalBodies: number } {
    return {
      cellSize: CELL_SIZE,
      totalCells: (this.spatialHash as SpatialHash & { cells: Map<string, PhysicsBody[]> }).cells.size,
      totalBodies: this.bodyIdCounter
    };
  }

  static normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  static getShortestAngle(from: number, to: number): number {
    return PhysicsEngine.normalizeAngle(to - from);
  }
}
