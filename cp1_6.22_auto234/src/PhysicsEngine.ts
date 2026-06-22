export type BodyType = 'ball' | 'lever' | 'pulley' | 'incline' | 'anchor';

export interface Vector2 {
  x: number;
  y: number;
}

export interface RigidBody {
  id: string;
  type: BodyType;
  position: Vector2;
  velocity: Vector2;
  mass: number;
  rotation: number;
  angularVelocity: number;
  width?: number;
  height?: number;
  radius?: number;
  isStatic: boolean;
  restitution: number;
  friction: number;
}

export interface RopeConstraint {
  id: string;
  bodyAId: string;
  bodyBId: string;
  anchorA: Vector2;
  anchorB: Vector2;
  length: number;
  tension: number;
}

export interface PhysicsState {
  bodies: RigidBody[];
  constraints: RopeConstraint[];
  ballId: string;
  goalPosition: Vector2;
  goalRadius: number;
}

const GRAVITY = 9.8 * 50;
const AIR_FRICTION = 0.999;
const MAX_VELOCITY = 1500;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

function rotatePoint(point: Vector2, center: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function getBodyCorners(body: RigidBody): Vector2[] {
  if (!body.width || !body.height) return [body.position];
  const hw = body.width / 2;
  const hh = body.height / 2;
  const corners = [
    { x: body.position.x - hw, y: body.position.y - hh },
    { x: body.position.x + hw, y: body.position.y - hh },
    { x: body.position.x + hw, y: body.position.y + hh },
    { x: body.position.x - hw, y: body.position.y + hh },
  ];
  return corners.map((c) => rotatePoint(c, body.position, body.rotation));
}

function closestPointOnSegment(p: Vector2, a: Vector2, b: Vector2): Vector2 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  if (ab2 < 0.0001) return { ...a };
  let t = (apx * abx + apy * aby) / ab2;
  t = clamp(t, 0, 1);
  return { x: a.x + abx * t, y: a.y + aby * t };
}

export class PhysicsEngine {
  private state: PhysicsState;
  private gravity: number;

  constructor(gravity: number = GRAVITY) {
    this.gravity = gravity;
    this.state = {
      bodies: [],
      constraints: [],
      ballId: '',
      goalPosition: { x: 0, y: 0 },
      goalRadius: 25,
    };
  }

  setState(state: PhysicsState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  getState(): PhysicsState {
    return this.state;
  }

  getBall(): RigidBody | undefined {
    return this.state.bodies.find((b) => b.id === this.state.ballId);
  }

  step(deltaTime: number): void {
    const dt = Math.min(deltaTime, 1 / 30);
    this.applyGravity(dt);
    this.integrate(dt);
    this.handleCollisions();
    this.solveConstraints(dt);
    this.clampVelocities();
  }

  private applyGravity(dt: number): void {
    for (const body of this.state.bodies) {
      if (body.isStatic || body.type === 'anchor') continue;
      body.velocity.y += this.gravity * dt;
    }
  }

  private integrate(dt: number): void {
    for (const body of this.state.bodies) {
      if (body.isStatic) continue;
      body.velocity.x *= AIR_FRICTION;
      body.velocity.y *= AIR_FRICTION;
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.rotation += body.angularVelocity * dt;
      body.angularVelocity *= 0.99;
    }
  }

  private clampVelocities(): void {
    for (const body of this.state.bodies) {
      body.velocity.x = clamp(body.velocity.x, -MAX_VELOCITY, MAX_VELOCITY);
      body.velocity.y = clamp(body.velocity.y, -MAX_VELOCITY, MAX_VELOCITY);
    }
  }

  private handleCollisions(): void {
    const ball = this.getBall();
    if (!ball || !ball.radius) return;

    for (const body of this.state.bodies) {
      if (body.id === ball.id) continue;

      if (body.type === 'incline' && body.width && body.height) {
        this.handleInclineCollision(ball, body);
      } else if (body.type === 'lever' && body.width && body.height) {
        this.handleLeverCollision(ball, body);
      } else if (body.type === 'pulley' && body.radius) {
        this.handleCircleCollision(ball, body);
      } else if (body.type === 'anchor' && body.radius) {
        this.handleCircleCollision(ball, body);
      }
    }
  }

  private handleInclineCollision(ball: RigidBody, incline: RigidBody): void {
    if (!ball.radius || !incline.width || !incline.height) return;

    const corners = getBodyCorners(incline);
    const topEdge: [Vector2, Vector2] = [corners[3], corners[2]];

    const closest = closestPointOnSegment(ball.position, topEdge[0], topEdge[1]);
    const dist = distance(ball.position, closest);

    if (dist < ball.radius) {
      const normal = normalize({
        x: ball.position.x - closest.x,
        y: ball.position.y - closest.y,
      });

      if (normal.y < 0) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }

      const overlap = ball.radius - dist;
      ball.position.x += normal.x * overlap;
      ball.position.y += normal.y * overlap;

      const velDotNormal = dot(ball.velocity, normal);
      if (velDotNormal < 0) {
        ball.velocity.x -= (1 + ball.restitution) * velDotNormal * normal.x;
        ball.velocity.y -= (1 + ball.restitution) * velDotNormal * normal.y;

        const tangent = { x: -normal.y, y: normal.x };
        const velDotTangent = dot(ball.velocity, tangent);
        const frictionForce = incline.friction * Math.abs(velDotNormal);
        if (Math.abs(velDotTangent) > frictionForce) {
          ball.velocity.x -= tangent.x * frictionForce * Math.sign(velDotTangent);
          ball.velocity.y -= tangent.y * frictionForce * Math.sign(velDotTangent);
        } else {
          ball.velocity.x -= tangent.x * velDotTangent;
          ball.velocity.y -= tangent.y * velDotTangent;
        }
      }
    }
  }

  private handleLeverCollision(ball: RigidBody, lever: RigidBody): void {
    if (!ball.radius || !lever.width || !lever.height) return;

    const corners = getBodyCorners(lever);
    const edges: [Vector2, Vector2][] = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
    ];

    let minDist = Infinity;
    let closestPoint: Vector2 = ball.position;
    let hitEdge: [Vector2, Vector2] | null = null;

    for (const edge of edges) {
      const cp = closestPointOnSegment(ball.position, edge[0], edge[1]);
      const d = distance(ball.position, cp);
      if (d < minDist) {
        minDist = d;
        closestPoint = cp;
        hitEdge = edge;
      }
    }

    if (minDist < ball.radius && hitEdge) {
      let normal = normalize({
        x: ball.position.x - closestPoint.x,
        y: ball.position.y - closestPoint.y,
      });

      if (minDist < 0.001) {
        const edgeDir = normalize({
          x: hitEdge[1].x - hitEdge[0].x,
          y: hitEdge[1].y - hitEdge[0].y,
        });
        normal = { x: -edgeDir.y, y: edgeDir.x };
        const toCenter = {
          x: ball.position.x - lever.position.x,
          y: ball.position.y - lever.position.y,
        };
        if (dot(normal, toCenter) < 0) {
          normal.x = -normal.x;
          normal.y = -normal.y;
        }
      }

      const overlap = ball.radius - minDist;
      ball.position.x += normal.x * overlap;
      ball.position.y += normal.y * overlap;

      const velDotNormal = dot(ball.velocity, normal);
      if (velDotNormal < 0) {
        const restitution = (ball.restitution + lever.restitution) / 2;
        ball.velocity.x -= (1 + restitution) * velDotNormal * normal.x;
        ball.velocity.y -= (1 + restitution) * velDotNormal * normal.y;

        const tangent = { x: -normal.y, y: normal.x };
        const velDotTangent = dot(ball.velocity, tangent);
        const frictionForce = lever.friction * Math.abs(velDotNormal);
        if (Math.abs(velDotTangent) > frictionForce) {
          ball.velocity.x -= tangent.x * frictionForce * Math.sign(velDotTangent);
          ball.velocity.y -= tangent.y * frictionForce * Math.sign(velDotTangent);
        } else {
          ball.velocity.x -= tangent.x * velDotTangent;
          ball.velocity.y -= tangent.y * velDotTangent;
        }
      }
    }
  }

  private handleCircleCollision(ball: RigidBody, other: RigidBody): void {
    if (!ball.radius || !other.radius) return;

    const dist = distance(ball.position, other.position);
    const minDist = ball.radius + other.radius;

    if (dist < minDist) {
      const normal = normalize({
        x: ball.position.x - other.position.x,
        y: ball.position.y - other.position.y,
      });

      const overlap = minDist - dist;
      ball.position.x += normal.x * overlap;
      ball.position.y += normal.y * overlap;

      const velDotNormal = dot(ball.velocity, normal);
      if (velDotNormal < 0) {
        const restitution = (ball.restitution + other.restitution) / 2;
        ball.velocity.x -= (1 + restitution) * velDotNormal * normal.x;
        ball.velocity.y -= (1 + restitution) * velDotNormal * normal.y;

        const tangent = { x: -normal.y, y: normal.x };
        const velDotTangent = dot(ball.velocity, tangent);
        const frictionForce = other.friction * Math.abs(velDotNormal);
        if (Math.abs(velDotTangent) > frictionForce) {
          ball.velocity.x -= tangent.x * frictionForce * Math.sign(velDotTangent);
          ball.velocity.y -= tangent.y * frictionForce * Math.sign(velDotTangent);
        } else {
          ball.velocity.x -= tangent.x * velDotTangent;
          ball.velocity.y -= tangent.y * velDotTangent;
        }
      }
    }
  }

  private solveConstraints(dt: number): void {
    const iterations = 5;
    for (let i = 0; i < iterations; i++) {
      for (const constraint of this.state.constraints) {
        this.solveRopeConstraint(constraint);
      }
    }
  }

  private solveRopeConstraint(constraint: RopeConstraint): void {
    const bodyA = this.state.bodies.find((b) => b.id === constraint.bodyAId);
    const bodyB = this.state.bodies.find((b) => b.id === constraint.bodyBId);
    if (!bodyA || !bodyB) return;

    const worldA = {
      x: bodyA.position.x + constraint.anchorA.x,
      y: bodyA.position.y + constraint.anchorA.y,
    };
    const worldB = {
      x: bodyB.position.x + constraint.anchorB.x,
      y: bodyB.position.y + constraint.anchorB.y,
    };

    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > constraint.length && dist > 0.001) {
      const diff = (dist - constraint.length) / dist;
      const normalX = dx / dist;
      const normalY = dy / dist;
      constraint.tension = diff * 100;

      const massA = bodyA.isStatic ? 0 : 1 / bodyA.mass;
      const massB = bodyB.isStatic ? 0 : 1 / bodyB.mass;
      const totalMass = massA + massB;

      if (totalMass > 0) {
        const ratioA = massA / totalMass;
        const ratioB = massB / totalMass;

        if (!bodyA.isStatic) {
          bodyA.position.x += normalX * diff * constraint.length * ratioA;
          bodyA.position.y += normalY * diff * constraint.length * ratioA;
        }
        if (!bodyB.isStatic) {
          bodyB.position.x -= normalX * diff * constraint.length * ratioB;
          bodyB.position.y -= normalY * diff * constraint.length * ratioB;
        }
      }
    } else {
      constraint.tension = 0;
    }
  }

  checkGoalReached(): boolean {
    const ball = this.getBall();
    if (!ball || !ball.radius) return false;
    const dist = distance(ball.position, this.state.goalPosition);
    return dist < this.state.goalRadius + ball.radius * 0.5;
  }

  checkBallOutOfBounds(bounds: { width: number; height: number }): boolean {
    const ball = this.getBall();
    if (!ball || !ball.radius) return false;
    const margin = 100;
    return (
      ball.position.x < -margin ||
      ball.position.x > bounds.width + margin ||
      ball.position.y > bounds.height + margin
    );
  }
}
