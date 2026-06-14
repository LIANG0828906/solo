import Matter from 'matter-js';
import { BodyConfig, ObstacleType, OBSTACLE_PRESETS, BALL_CONFIG, TARGET_CONFIG } from './bodies';

export interface CollisionEvent {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  type: string;
}

type CollisionCallback = (event: CollisionEvent) => void;

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private collisionCallbacks: CollisionCallback[] = [];
  private bodyTypeMap: Map<number, ObstacleType | 'ball' | 'target'> = new Map();
  private bodyAngleMap: Map<number, number> = new Map();
  private bounceCountMap: Map<number, number> = new Map();
  private ground: Matter.Body | null = null;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 },
    });
    this.world = this.engine.world;
    this.setupCollisionHandler();
  }

  init(width: number, height: number): void {
    const wallThickness = 60;
    const ground = Matter.Bodies.rectangle(
      width / 2,
      height + wallThickness / 2,
      width + 200,
      wallThickness,
      { isStatic: true, friction: 0.8, label: 'ground' }
    );
    const leftWall = Matter.Bodies.rectangle(
      -wallThickness / 2,
      height / 2,
      wallThickness,
      height + 200,
      { isStatic: true, label: 'wall' }
    );
    const rightWall = Matter.Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height + 200,
      { isStatic: true, label: 'wall' }
    );

    Matter.Composite.add(this.world, [ground, leftWall, rightWall]);
    this.ground = ground;
  }

  addBody(config: BodyConfig): Matter.Body {
    let body: Matter.Body;

    if (config.type === 'rubberball') {
      body = Matter.Bodies.circle(config.x, config.y, config.width / 2, {
        isStatic: config.isStatic,
        density: config.density,
        friction: config.friction,
        restitution: config.restitution,
        angle: config.angle,
        label: config.type,
      });
    } else {
      body = Matter.Bodies.rectangle(config.x, config.y, config.width, config.height, {
        isStatic: config.isStatic,
        density: config.density,
        friction: config.friction,
        restitution: config.restitution,
        angle: config.angle,
        label: config.type,
      });
    }

    Matter.Composite.add(this.world, body);
    this.bodyTypeMap.set(body.id, config.type);
    this.bodyAngleMap.set(body.id, config.angle);
    return body;
  }

  addTarget(x: number, y: number): Matter.Body {
    const body = Matter.Bodies.rectangle(x, y, TARGET_CONFIG.width, TARGET_CONFIG.height, {
      isStatic: true,
      density: 0.001,
      friction: 0.5,
      restitution: 0.1,
      label: 'target',
    });
    Matter.Composite.add(this.world, body);
    this.bodyTypeMap.set(body.id, 'target');
    return body;
  }

  removeBody(id: number): void {
    const body = this.getBodyById(id);
    if (body) {
      Matter.Composite.remove(this.world, body);
      this.bodyTypeMap.delete(id);
      this.bodyAngleMap.delete(id);
      this.bounceCountMap.delete(id);
    }
  }

  getBodyById(id: number): Matter.Body | null {
    const bodies = Matter.Composite.allBodies(this.world);
    return bodies.find(b => b.id === id) || null;
  }

  update(delta: number): void {
    Matter.Engine.update(this.engine, delta);
  }

  onCollision(callback: CollisionCallback): void {
    this.collisionCallbacks.push(callback);
  }

  getBodies(): Matter.Body[] {
    return Matter.Composite.allBodies(this.world);
  }

  getBodyType(id: number): ObstacleType | 'ball' | 'target' | undefined {
    return this.bodyTypeMap.get(id);
  }

  launchBall(x: number, y: number, vx: number, vy: number): Matter.Body {
    const ball = Matter.Bodies.circle(x, y, BALL_CONFIG.radius, {
      density: BALL_CONFIG.density,
      friction: BALL_CONFIG.friction,
      restitution: BALL_CONFIG.restitution,
      label: 'ball',
    });
    Matter.Body.setVelocity(ball, { x: vx, y: vy });
    Matter.Composite.add(this.world, ball);
    this.bodyTypeMap.set(ball.id, 'ball');
    return ball;
  }

  getBounceCount(id: number): number {
    return this.bounceCountMap.get(id) || 0;
  }

  incrementBounceCount(id: number): void {
    const count = this.bounceCountMap.get(id) || 0;
    this.bounceCountMap.set(id, count + 1);
  }

  rotateBody(id: number, deltaAngle: number): void {
    const body = this.getBodyById(id);
    if (body) {
      Matter.Body.setAngle(body, body.angle + deltaAngle);
      this.bodyAngleMap.set(id, body.angle);
    }
  }

  setBodyStatic(id: number, isStatic: boolean): void {
    const body = this.getBodyById(id);
    if (body) {
      Matter.Body.setStatic(body, isStatic);
    }
  }

  clearDynamicBodies(): void {
    const bodies = Matter.Composite.allBodies(this.world);
    const toRemove = bodies.filter(b => {
      const type = this.bodyTypeMap.get(b.id);
      return type !== undefined && b.label !== 'ground' && b.label !== 'wall';
    });
    toRemove.forEach(b => {
      Matter.Composite.remove(this.world, b);
      this.bodyTypeMap.delete(b.id);
      this.bodyAngleMap.delete(b.id);
      this.bounceCountMap.delete(b.id);
    });
  }

  clearAll(): void {
    Matter.Composite.clear(this.world, false);
    this.bodyTypeMap.clear();
    this.bodyAngleMap.clear();
    this.bounceCountMap.clear();
  }

  private setupCollisionHandler(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const typeA = this.bodyTypeMap.get(bodyA.id);
        const typeB = this.bodyTypeMap.get(bodyB.id);

        if (typeA === 'ball' && typeB) {
          this.collisionCallbacks.forEach(cb => cb({
            bodyA,
            bodyB,
            type: typeB,
          }));
        } else if (typeB === 'ball' && typeA) {
          this.collisionCallbacks.forEach(cb => cb({
            bodyA: bodyB,
            bodyB: bodyA,
            type: typeA,
          }));
        }
      }
    });
  }
}
