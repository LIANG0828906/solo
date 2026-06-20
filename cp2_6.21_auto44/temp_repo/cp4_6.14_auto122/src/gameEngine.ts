import Matter from 'matter-js';

export interface BlockData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  scale: number;
  createdAt: number;
}

export interface BallData {
  id: string;
  x: number;
  y: number;
  radius: number;
  trail: { x: number; y: number }[];
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  createdAt: number;
  lifetime: number;
}

export interface CollisionResult {
  blockId: string;
  blockData: BlockData;
  ballId: string;
}

export interface GameState {
  score: number;
  remainingBalls: number;
  blocks: Map<string, BlockData>;
  balls: Map<string, BallData>;
  particles: ParticleData[];
  isGameOver: boolean;
  isWin: boolean;
  blocksEliminated: number;
  lastEliminationTime: number;
  consecutiveEliminations: number;
}

type CollisionCallback = (result: CollisionResult) => void;
type BallRecycleCallback = (ballId: string) => void;

const BLOCK_COLORS = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'];
const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 40;
const BLOCK_GAP = 0.5;
const BLOCK_COLS = 8;
const BLOCK_ROWS = 6;
const BALL_RADIUS = 12;
const BALL_SPEED = 15;
const WALL_THICKNESS = 10;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export class GameEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private runner: Matter.Runner;
  private blocks: Map<string, BlockData> = new Map();
  private balls: Map<string, BallData> = new Map();
  private particles: ParticleData[] = [];
  private blockBodies: Map<string, Matter.Body> = new Map();
  private ballBodies: Map<string, Matter.Body> = new Map();
  private walls: Matter.Body[] = [];
  private onCollision?: CollisionCallback;
  private onBallRecycle?: BallRecycleCallback;
  private audioContext: AudioContext | null = null;
  private ballTrails: Map<string, { x: number; y: number }[]> = new Map();

  constructor(
    onCollision?: CollisionCallback,
    onBallRecycle?: BallRecycleCallback
  ) {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 }
    });
    this.world = this.engine.world;
    this.runner = Matter.Runner.create();
    this.onCollision = onCollision;
    this.onBallRecycle = onBallRecycle;

    this.setupCollisionDetection();
    this.createWalls();
    this.createBlocks();
  }

  getWorld(): Matter.World {
    return this.world;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  getBlocks(): Map<string, BlockData> {
    return this.blocks;
  }

  getBalls(): Map<string, BallData> {
    return this.balls;
  }

  getParticles(): ParticleData[] {
    return this.particles;
  }

  start(): void {
    Matter.Runner.run(this.runner, this.engine);
  }

  stop(): void {
    Matter.Runner.stop(this.runner);
  }

  update(deltaTime: number): void {
    this.updateBallTrails();
    this.updateParticles(deltaTime);
    this.checkBallRecycle();
  }

  private updateBallTrails(): void {
    this.balls.forEach((ball, id) => {
      const body = this.ballBodies.get(id);
      if (body) {
        ball.x = body.position.x;
        ball.y = body.position.y;
        
        const trail = this.ballTrails.get(id) || [];
        trail.unshift({ x: ball.x, y: ball.y });
        if (trail.length > 5) {
          trail.pop();
        }
        ball.trail = [...trail];
        this.ballTrails.set(id, trail);
      }
    });
  }

  private updateParticles(_deltaTime: number): void {
    const now = Date.now();
    this.particles = this.particles.filter(particle => {
      if (now - particle.createdAt > particle.lifetime) {
        return false;
      }
      particle.x += particle.vx;
      particle.y += particle.vy;
      return true;
    });
  }

  private checkBallRecycle(): void {
    const ballsToRemove: string[] = [];
    this.balls.forEach((ball, id) => {
      if (ball.y > CANVAS_HEIGHT + 20) {
        ballsToRemove.push(id);
      }
    });

    ballsToRemove.forEach(id => {
      this.removeBall(id);
      this.onBallRecycle?.(id);
    });
  }

  private setupCollisionDetection(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        
        const isBlockA = bodyA.label?.startsWith('block_');
        const isBlockB = bodyB.label?.startsWith('block_');
        const isBallA = bodyA.label?.startsWith('ball_');
        const isBallB = bodyB.label?.startsWith('ball_');
        
        if ((isBlockA && isBallB) || (isBlockB && isBallA)) {
          const blockBody = isBlockA ? bodyA : bodyB;
          const ballBody = isBallA ? bodyA : bodyB;
          
          const blockId = blockBody.label?.replace('block_', '') || '';
          const ballId = ballBody.label?.replace('ball_', '') || '';
          
          const blockData = this.blocks.get(blockId);
          if (blockData && this.blockBodies.has(blockId)) {
            this.onCollision?.({
              blockId,
              blockData,
              ballId
            });
          }
        }
      });
    });
  }

  private createWalls(): void {
    const wallOptions = {
      isStatic: true,
      restitution: 0.6,
      friction: 0,
      frictionAir: 0,
      label: 'wall'
    };

    const leftWall = Matter.Bodies.rectangle(
      -WALL_THICKNESS / 2,
      CANVAS_HEIGHT / 2,
      WALL_THICKNESS,
      CANVAS_HEIGHT,
      { ...wallOptions, label: 'wall_left' }
    );

    const rightWall = Matter.Bodies.rectangle(
      CANVAS_WIDTH + WALL_THICKNESS / 2,
      CANVAS_HEIGHT / 2,
      WALL_THICKNESS,
      CANVAS_HEIGHT,
      { ...wallOptions, label: 'wall_right' }
    );

    const topWall = Matter.Bodies.rectangle(
      CANVAS_WIDTH / 2,
      -WALL_THICKNESS / 2,
      CANVAS_WIDTH,
      WALL_THICKNESS,
      { ...wallOptions, label: 'wall_top' }
    );

    this.walls = [leftWall, rightWall, topWall];
    Matter.Composite.add(this.world, this.walls);
  }

  private createBlocks(): void {
    const totalWidth = BLOCK_COLS * BLOCK_WIDTH + (BLOCK_COLS - 1) * BLOCK_GAP;
    const startX = (CANVAS_WIDTH - totalWidth) / 2 + BLOCK_WIDTH / 2;
    const startY = 100 + BLOCK_HEIGHT / 2;

    for (let row = 0; row < BLOCK_ROWS; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        const id = `block_${row}_${col}`;
        const x = startX + col * (BLOCK_WIDTH + BLOCK_GAP);
        const y = startY + row * (BLOCK_HEIGHT + BLOCK_GAP);
        const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];

        const blockBody = Matter.Bodies.rectangle(
          x,
          y,
          BLOCK_WIDTH,
          BLOCK_HEIGHT,
          {
            isStatic: true,
            label: `block_${id}`,
            restitution: 0.8,
            friction: 0.1
          }
        );

        const blockData: BlockData = {
          id,
          x,
          y,
          width: BLOCK_WIDTH,
          height: BLOCK_HEIGHT,
          color,
          scale: 1,
          createdAt: Date.now()
        };

        this.blocks.set(id, blockData);
        this.blockBodies.set(id, blockBody);
        Matter.Composite.add(this.world, blockBody);
      }
    }
  }

  launchBall(angle: number): boolean {
    const id = `ball_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startX = CANVAS_WIDTH / 2;
    const startY = CANVAS_HEIGHT - 60;

    const vx = Math.cos(angle) * BALL_SPEED;
    const vy = Math.sin(angle) * BALL_SPEED;

    const ballBody = Matter.Bodies.circle(
      startX,
      startY,
      BALL_RADIUS,
      {
        label: `ball_${id}`,
        restitution: 0.9,
        friction: 0.001,
        frictionAir: 0,
        density: 0.001
      }
    );

    Matter.Body.setVelocity(ballBody, { x: vx, y: vy });

    const ballData: BallData = {
      id,
      x: startX,
      y: startY,
      radius: BALL_RADIUS,
      trail: []
    };

    this.balls.set(id, ballData);
    this.ballBodies.set(id, ballBody);
    this.ballTrails.set(id, []);
    Matter.Composite.add(this.world, ballBody);

    return true;
  }

  removeBlock(blockId: string): void {
    const blockBody = this.blockBodies.get(blockId);
    if (blockBody) {
      Matter.Composite.remove(this.world, blockBody);
      this.blockBodies.delete(blockId);
    }
    this.blocks.delete(blockId);
  }

  removeBall(ballId: string): void {
    const ballBody = this.ballBodies.get(ballId);
    if (ballBody) {
      Matter.Composite.remove(this.world, ballBody);
      this.ballBodies.delete(ballId);
    }
    this.balls.delete(ballId);
    this.ballTrails.delete(ballId);
  }

  createParticles(x: number, y: number, color: string): void {
    const now = Date.now();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 2;
      
      const particle: ParticleData = {
        id: `particle_${now}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4,
        createdAt: now,
        lifetime: 500
      };
      
      this.particles.push(particle);
    }
  }

  playCollisionSound(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  reset(): void {
    this.blocks.forEach((_, id) => this.removeBlock(id));
    this.balls.forEach((_, id) => this.removeBall(id));
    this.particles = [];
    this.createBlocks();
  }

  destroy(): void {
    this.stop();
    Matter.Composite.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }
}
