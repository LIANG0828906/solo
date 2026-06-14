import Matter from 'matter-js';
import { BodyConfig, ObstacleType, OBSTACLE_PRESETS, BALL_CONFIG, TARGET_CONFIG, createBodyConfig } from './bodies';

export interface CollisionEvent {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  type: string;
  bodyAVelocity: { x: number; y: number };
  collisionPoint: { x: number; y: number };
}

type CollisionCallback = (event: CollisionEvent) => void;

export type OnWoodBoxBreak = (x: number, y: number, velocity: { x: number; y: number }) => Matter.Body[];
export type OnIronBlockHit = (x: number, y: number) => void;
export type OnRubberBallBounce = (id: number, count: number) => void;
export type OnSpikeTrapHit = (ballBody: Matter.Body, x: number, y: number) => void;

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private collisionCallbacks: CollisionCallback[] = [];
  private bodyTypeMap: Map<number, ObstacleType | 'ball' | 'target' | 'debris'> = new Map();
  private bodyAngleMap: Map<number, number> = new Map();
  private bounceCountMap: Map<number, number> = new Map();
  private ground: Matter.Body | null = null;
  private processedCollisions: Set<string> = new Set();

  private onWoodBoxBreak: OnWoodBoxBreak | null = null;
  private onIronBlockHit: OnIronBlockHit | null = null;
  private onRubberBallBounce: OnRubberBallBounce | null = null;
  private onSpikeTrapHit: OnSpikeTrapHit | null = null;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0015 },
      positionIterations: 8,
      velocityIterations: 8,
      enableSleeping: false,
    });
    this.world = this.engine.world;
    this.setupCollisionHandler();
  }

  setWoodBoxBreakHandler(handler: OnWoodBoxBreak): void {
    this.onWoodBoxBreak = handler;
  }

  setIronBlockHitHandler(handler: OnIronBlockHit): void {
    this.onIronBlockHit = handler;
  }

  setRubberBallBounceHandler(handler: OnRubberBallBounce): void {
    this.onRubberBallBounce = handler;
  }

  setSpikeTrapHitHandler(handler: OnSpikeTrapHit): void {
    this.onSpikeTrapHit = handler;
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
        const collisionPoint = {
          x: (bodyA.position.x + bodyB.position.x) / 2,
          y: (bodyA.position.y + bodyB.position.y) / 2,
        };

        let ballBody: Matter.Body | null = null;
        let otherBody: Matter.Body | null = null;
        let otherType: ObstacleType | 'target' | 'debris' | undefined;

        if (typeA === 'ball' && typeB) {
          ballBody = bodyA;
          otherBody = bodyB;
          otherType = typeB as ObstacleType | 'target';
        } else if (typeB === 'ball' && typeA) {
          ballBody = bodyB;
          otherBody = bodyA;
          otherType = typeA as ObstacleType | 'target';
        }

        if (ballBody && otherBody && otherType && otherType !== 'ball') {
          const collisionKey = `${ballBody.id}-${otherBody.id}-${Date.now()}`;
          this.processedCollisions.add(collisionKey);
          setTimeout(() => this.processedCollisions.delete(collisionKey), 100);

          this.collisionCallbacks.forEach(cb => cb({
            bodyA: ballBody,
            bodyB: otherBody,
            type: otherType,
            bodyAVelocity: ballBody.velocity,
            collisionPoint,
          }));

          if (otherType === 'woodbox') {
            const vel = ballBody.velocity;
            this.processWoodBoxBreak(otherBody, vel);
          } else if (otherType === 'ironblock') {
            if (this.onIronBlockHit) {
              this.onIronBlockHit(collisionPoint.x, collisionPoint.y);
            }
          } else if (otherType === 'rubberball') {
            const count = (this.bounceCountMap.get(otherBody.id) || 0) + 1;
            this.bounceCountMap.set(otherBody.id, count);
            if (this.onRubberBallBounce) {
              this.onRubberBallBounce(otherBody.id, count);
            }
            if (count >= 10) {
              Matter.Body.setStatic(otherBody, true);
              Matter.Body.setVelocity(otherBody, { x: 0, y: 0 });
              Matter.Body.setAngularVelocity(otherBody, 0);
            }
          } else if (otherType === 'spiketrap') {
            if (this.onSpikeTrapHit) {
              this.onSpikeTrapHit(ballBody, collisionPoint.x, collisionPoint.y);
            }
          } else if (otherType === 'springboard') {
            this.processSpringboardHit(ballBody, otherBody);
          }
        }
      }
    });
  }

  private processWoodBoxBreak(woodBox: Matter.Body, impactVelocity: { x: number; y: number }): void {
    const x = woodBox.position.x;
    const y = woodBox.position.y;
    const angle = woodBox.angle;

    this.removeBody(woodBox.id);

    if (this.onWoodBoxBreak) {
      this.onWoodBoxBreak(x, y, impactVelocity);
      return;
    }

    const halfW = OBSTACLE_PRESETS.woodbox.width / 4;
    const halfH = OBSTACLE_PRESETS.woodbox.height / 4;
    const offsets = [
      { dx: -halfW, dy: -halfH },
      { dx: halfW, dy: -halfH },
      { dx: -halfW, dy: halfH },
      { dx: halfW, dy: halfH },
    ];

    for (const off of offsets) {
      const debrisConfig = createBodyConfig('woodbox', x + off.dx, y + off.dy, angle);
      debrisConfig.width = 25;
      debrisConfig.height = 25;
      debrisConfig.density = 0.003;
      debrisConfig.isStatic = false;
      const debris = this.addBody(debrisConfig);
      this.bodyTypeMap.set(debris.id, 'debris');
      Matter.Body.setVelocity(debris, {
        x: impactVelocity.x * 0.4 + off.dx * 0.08 + (Math.random() - 0.5) * 3,
        y: impactVelocity.y * 0.4 - 2 - Math.random() * 3,
      });
      Matter.Body.setAngularVelocity(debris, (Math.random() - 0.5) * 0.2);
    }
  }

  private processSpringboardHit(ball: Matter.Body, springboard: Matter.Body): void {
    const boardAngle = springboard.angle;
    const normalX = Math.sin(boardAngle);
    const normalY = -Math.cos(boardAngle);
    const vel = ball.velocity;
    const dot = vel.x * normalX + vel.y * normalY;

    const reflectX = vel.x - 2 * dot * normalX;
    const reflectY = vel.y - 2 * dot * normalY;
    const boost = 1.5;

    Matter.Body.setVelocity(ball, {
      x: reflectX * boost,
      y: reflectY * boost - 4,
    });
  }
}
