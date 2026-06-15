import Matter from 'matter-js';
import { PhysicsEngine } from './physics/engine';
import { ObstacleType, BodyConfig, createBodyConfig, OBSTACLE_PRESETS, BALL_CONFIG, TARGET_CONFIG } from './physics/bodies';
import { Renderer, RenderableBody, Particle } from './renderer/canvas';
import { UIPanels, GameMode } from './ui/panels';
import { LevelManager, LevelData } from './ui/levels';

class Game {
  private physics: PhysicsEngine;
  private renderer: Renderer;
  private ui: UIPanels;
  private levelManager: LevelManager;

  private canvas: HTMLCanvasElement;
  private mode: GameMode = 'build';
  private placedBodies: Map<number, { type: ObstacleType | 'target'; body: Matter.Body; config: BodyConfig }> = new Map();
  private activeBalls: Map<number, Matter.Body> = new Map();
  private targetBodies: Map<number, Matter.Body> = new Map();
  private hitTargets: Set<number> = new Set();
  private remainingBalls: number = 3;

  private aimStart: { x: number; y: number } | null = null;
  private aimCurrent: { x: number; y: number } | null = null;
  private launchOrigin: { x: number; y: number } = { x: 80, y: 0 };
  private currentPower: number = 0;

  private lastTime: number = 0;
  private animationId: number = 0;

  private dragging: boolean = false;
  private dragType: ObstacleType | null = null;
  private dragGhost: { x: number; y: number; type: ObstacleType } | null = null;

  private settled: boolean = false;
  private settleTimer: number = 0;
  private resultShown: boolean = false;

  constructor() {
    this.physics = new PhysicsEngine();
    this.renderer = new Renderer();
    this.ui = new UIPanels();
    this.levelManager = new LevelManager();
    this.canvas = null!;
  }

  init(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas element not found');
    this.canvas = canvas;

    this.renderer.init(canvas);
    this.physics.init(this.renderer.getWidth(), this.renderer.getHeight());
    this.ui.init();

    this.launchOrigin.y = this.renderer.getHeight() - 40;

    this.bindCanvasEvents();
    this.bindScrollRotate();
    this.bindUICallbacks();

    this.loadLevel(this.levelManager.getCurrentLevel());

    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private loadLevel(level: LevelData): void {
    this.mode = 'build';
    this.placedBodies.clear();
    this.activeBalls.clear();
    this.targetBodies.clear();
    this.hitTargets.clear();
    this.remainingBalls = level.availableBalls;
    this.settled = false;
    this.settleTimer = 0;
    this.resultShown = false;
    this.aimStart = null;
    this.aimCurrent = null;
    this.currentPower = 0;

    this.physics.clearAll();
    this.physics.init(this.renderer.getWidth(), this.renderer.getHeight());
    this.renderer.clearAllTracking();

    this.launchOrigin.y = this.renderer.getHeight() - 40;

    for (const preset of level.presetObstacles) {
      const config = createBodyConfig(preset.type as ObstacleType, preset.x, preset.y, preset.angle);
      const body = this.physics.addBody(config);
      this.placedBodies.set(body.id, { type: preset.type as ObstacleType, body, config });
      this.renderer.setFadeIn(body.id);
    }

    for (const target of level.targets) {
      const body = this.physics.addTarget(target.x, target.y);
      this.targetBodies.set(body.id, body);
      this.placedBodies.set(body.id, { type: 'target', body, config: null! });
      this.renderer.setFadeIn(body.id);
    }

    this.levelManager.setTargetsHit(0);
    this.ui.updateLevelInfo(
      `第 ${level.id} 关: ${level.name}`,
      this.remainingBalls,
      0,
      level.targets.length
    );
    this.ui.setLaunchMode(false);
    this.ui.hidePowerBar();
    this.ui.hideResultPanel();
    this.ui.setHintVisible(this.placedBodies.size === 0);
  }

  private bindCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
  }

  private bindScrollRotate(): void {
    this.canvas.addEventListener('wheel', (e) => {
      if (this.mode !== 'build') return;
      e.preventDefault();

      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const deltaAngle = e.deltaY > 0 ? Math.PI / 12 : -Math.PI / 12;

      for (const [id, entry] of this.placedBodies) {
        const b = entry.body;
        const dx = Math.abs(b.position.x - mx);
        const dy = Math.abs(b.position.y - my);
        const maxDist = Math.max(
          (entry.config?.width || OBSTACLE_PRESETS[entry.type as ObstacleType]?.width || 50) / 2,
          (entry.config?.height || OBSTACLE_PRESETS[entry.type as ObstacleType]?.height || 50) / 2
        ) + 20;

        if (dx < maxDist && dy < maxDist) {
          this.physics.rotateBody(id, deltaAngle);
          this.renderer.showAngle(id, b.angle + deltaAngle);
          break;
        }
      }
    }, { passive: false });
  }

  private bindUICallbacks(): void {
    this.ui.onPlace((type, x, y) => {
      if (this.mode !== 'build') return;
      const config = createBodyConfig(type, x, y, 0);
      const body = this.physics.addBody(config);
      this.placedBodies.set(body.id, { type, body, config });
      this.renderer.setFadeIn(body.id);
      this.ui.setHintVisible(false);
    });

    this.ui.onRotate((id, deltaAngle) => {
      this.physics.rotateBody(id, deltaAngle);
      const body = this.physics.getBodyById(id);
      if (body) {
        this.renderer.showAngle(id, body.angle);
      }
    });

    this.ui.onDelete((id) => {
      this.physics.removeBody(id);
      this.placedBodies.delete(id);
      this.targetBodies.delete(id);
      this.renderer.clearBodyTracking(id);
    });

    this.ui.onLaunchClick(() => {
      if (this.mode === 'build') {
        this.mode = 'launch';
        this.ui.setLaunchMode(true);
        this.ui.clearSelection();
      } else if (this.mode === 'launch' || this.mode === 'aiming') {
        this.mode = 'build';
        this.ui.setLaunchMode(false);
        this.ui.hidePowerBar();
        this.aimStart = null;
        this.aimCurrent = null;
      }
    });

    this.ui.onNextLevel(() => {
      const next = this.levelManager.nextLevel();
      this.ui.hideResultPanel();
      if (next) {
        this.loadLevel(next);
      }
    });

    this.ui.onRestart(() => {
      this.ui.hideResultPanel();
      this.levelManager.resetLevel();
      this.loadLevel(this.levelManager.getCurrentLevel());
    });

    this.physics.onCollision((event) => {
      this.handleCollision(event);
    });
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.button === 0) {
      if (this.mode === 'build') {
        const selectedType = this.ui.getSelectedType();
        if (selectedType) {
          this.ui.triggerPlace(selectedType, mx, my);
          return;
        }
      } else if (this.mode === 'launch') {
        this.mode = 'aiming';
        this.aimStart = { x: mx, y: my };
        this.aimCurrent = { x: mx, y: my };
        this.ui.showPowerBar();
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.mode === 'aiming' && this.aimStart) {
      this.aimCurrent = { x: mx, y: my };
      const dx = this.aimStart.x - mx;
      const dy = this.aimStart.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.currentPower = Math.min(dist / 200, 1);
      this.ui.updatePowerBar(this.currentPower);
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.mode === 'aiming' && this.aimStart && this.aimCurrent && e.button === 0) {
      const dx = this.aimStart.x - this.aimCurrent.x;
      const dy = this.aimStart.y - this.aimCurrent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 15) {
        const power = Math.min(dist / 200, 1) * 18;
        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power;

        const ball = this.physics.launchBall(this.launchOrigin.x, this.launchOrigin.y, vx, vy);
        this.activeBalls.set(ball.id, ball);
        this.renderer.setFadeIn(ball.id);
        this.remainingBalls--;
        this.ui.updateLevelInfo(
          `第 ${this.levelManager.getCurrentLevel().id} 关: ${this.levelManager.getCurrentLevel().name}`,
          this.remainingBalls,
          this.hitTargets.size,
          this.levelManager.getCurrentLevel().targets.length
        );

        this.mode = 'flying';
        this.settled = false;
        this.settleTimer = 0;
        this.resultShown = false;
      }

      this.aimStart = null;
      this.aimCurrent = null;
      this.ui.hidePowerBar();
      this.ui.setLaunchMode(false);
    }
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    if (this.mode !== 'build') return;

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const [id, entry] of this.placedBodies) {
      const b = entry.body;
      const hw = (entry.config?.width || 50) / 2 + 10;
      const hh = (entry.config?.height || 50) / 2 + 10;
      if (Math.abs(b.position.x - mx) < hw && Math.abs(b.position.y - my) < hh) {
        if (entry.type !== 'target') {
          this.ui.showContextMenu(e.clientX - rect.left, e.clientY - rect.top, id);
        }
        return;
      }
    }
  }

  private handleCollision(event: { bodyA: Matter.Body; bodyB: Matter.Body; type: string }): void {
    const ball = event.bodyA;
    const obstacle = event.bodyB;
    const obstacleType = event.type as ObstacleType;

    if (obstacleType === 'woodbox') {
      this.renderer.addWoodDebris(obstacle.position.x, obstacle.position.y);
      const vel = ball.velocity;
      const angle = obstacle.angle;
      const w = OBSTACLE_PRESETS.woodbox.width / 2;
      const h = OBSTACLE_PRESETS.woodbox.height / 2;

      for (let i = 0; i < 4; i++) {
        const offX = (i % 2 === 0 ? -1 : 1) * w * 0.5;
        const offY = (i < 2 ? -1 : 1) * h * 0.5;
        const debrisConfig = createBodyConfig('woodbox', obstacle.position.x + offX, obstacle.position.y + offY, angle);
        debrisConfig.width = 25;
        debrisConfig.height = 25;
        debrisConfig.density = 0.003;
        const debris = this.physics.addBody(debrisConfig);
        Matter.Body.setVelocity(debris, {
          x: vel.x * 0.3 + (Math.random() - 0.5) * 4,
          y: vel.y * 0.3 - Math.random() * 3,
        });
        this.renderer.setFadeIn(debris.id);
      }

      this.physics.removeBody(obstacle.id);
      this.placedBodies.delete(obstacle.id);
      this.renderer.clearBodyTracking(obstacle.id);
    } else if (obstacleType === 'ironblock') {
      this.renderer.addSparkParticles(obstacle.position.x, obstacle.position.y, 10);
    } else if (obstacleType === 'rubberball') {
      this.physics.incrementBounceCount(obstacle.id);
      const count = this.physics.getBounceCount(obstacle.id);
      if (count >= 10) {
        this.physics.setBodyStatic(obstacle.id, true);
      }
    } else if (obstacleType === 'spiketrap') {
      this.renderer.addBallDestroyParticles(ball.position.x, ball.position.y);
      this.physics.removeBody(ball.id);
      this.activeBalls.delete(ball.id);
      this.renderer.clearBodyTracking(ball.id);
    } else if (obstacleType === 'target') {
      if (!this.hitTargets.has(obstacle.id)) {
        this.hitTargets.add(obstacle.id);
        this.levelManager.setTargetsHit(this.hitTargets.size);
        this.ui.updateLevelInfo(
          `第 ${this.levelManager.getCurrentLevel().id} 关: ${this.levelManager.getCurrentLevel().name}`,
          this.remainingBalls,
          this.hitTargets.size,
          this.levelManager.getCurrentLevel().targets.length
        );
      }
    }
  }

  private computeTrajectory(x: number, y: number, vx: number, vy: number, steps: number = 60): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const gravity = 1 * 0.001;
    let px = x, py = y, pvx = vx, pvy = vy;

    for (let i = 0; i < steps; i++) {
      points.push({ x: px, y: py });
      pvy += gravity * 16.67;
      px += pvx;
      py += pvy;
      if (py > this.renderer.getHeight()) break;
    }
    return points;
  }

  private buildRenderableBodies(): RenderableBody[] {
    const bodies = this.physics.getBodies();
    const result: RenderableBody[] = [];

    for (const body of bodies) {
      if (body.label === 'ground' || body.label === 'wall') continue;

      const type = body.label as ObstacleType | 'ball' | 'target';
      const entry = this.placedBodies.get(body.id);
      const isTarget = this.targetBodies.has(body.id);

      let width = 50;
      let height = 50;
      if (type === 'ball') {
        width = BALL_CONFIG.radius * 2;
        height = BALL_CONFIG.radius * 2;
      } else if (type === 'target') {
        width = TARGET_CONFIG.width;
        height = TARGET_CONFIG.height;
      } else if (entry?.config) {
        width = entry.config.width;
        height = entry.config.height;
      } else {
        const preset = OBSTACLE_PRESETS[type as ObstacleType];
        if (preset) {
          width = preset.width;
          height = preset.height;
        }
      }

      result.push({
        id: body.id,
        type,
        x: body.position.x,
        y: body.position.y,
        width,
        height,
        angle: body.angle,
        opacity: 1,
        radius: type === 'ball' ? BALL_CONFIG.radius : type === 'rubberball' ? width / 2 : undefined,
        isHit: isTarget && this.hitTargets.has(body.id),
      });
    }

    return result;
  }

  private checkSettlement(): boolean {
    if (this.activeBalls.size === 0) return true;

    let allSlow = true;
    for (const [id, ball] of this.activeBalls) {
      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
      if (speed > 0.5) {
        allSlow = false;
        break;
      }
    }

    return allSlow;
  }

  private showResult(): void {
    if (this.resultShown) return;
    this.resultShown = true;

    const level = this.levelManager.getCurrentLevel();
    const totalTargets = level.targets.length;
    const targetsHit = this.hitTargets.size;

    const stars = this.levelManager.calculateStars(targetsHit, totalTargets, this.remainingBalls);
    const score = this.levelManager.calculateScore(targetsHit, this.remainingBalls);

    const hasNext = !this.levelManager.isCompleted() || targetsHit === totalTargets;
    this.ui.showResultPanel(stars, score, hasNext && this.levelManager.getCurrentLevelIndex() < this.levelManager.getLevelCount() - 1);

    this.mode = 'result';
  }

  private gameLoop(timestamp: number): void {
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (delta < 200) {
      this.physics.update(delta);
    }

    const renderableBodies = this.buildRenderableBodies();
    this.renderer.render(renderableBodies);

    if (this.mode === 'aiming' && this.aimStart && this.aimCurrent) {
      const dx = this.aimStart.x - this.aimCurrent.x;
      const dy = this.aimStart.y - this.aimCurrent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(dist / 200, 1) * 18;
      const angle = Math.atan2(dy, dx);
      const vx = Math.cos(angle) * power;
      const vy = Math.sin(angle) * power;

      const trajectory = this.computeTrajectory(this.launchOrigin.x, this.launchOrigin.y, vx, vy);
      this.renderer.drawTrajectory(trajectory);
      this.renderer.drawPowerBar(this.currentPower);
    }

    if (this.mode === 'flying') {
      const level = this.levelManager.getCurrentLevel();
      const allTargetsHit = this.hitTargets.size >= level.targets.length;

      if (allTargetsHit || (this.activeBalls.size === 0 && this.remainingBalls <= 0)) {
        this.settleTimer += delta;
        if (this.settleTimer > 1500) {
          this.showResult();
        }
      } else if (this.checkSettlement()) {
        this.settleTimer += delta;
        if (this.settleTimer > 2000) {
          for (const [id] of this.activeBalls) {
            this.physics.removeBody(id);
            this.renderer.clearBodyTracking(id);
          }
          this.activeBalls.clear();

          if (this.remainingBalls > 0 && this.hitTargets.size < level.targets.length) {
            this.mode = 'launch';
            this.ui.setLaunchMode(true);
          } else {
            this.showResult();
          }
          this.settleTimer = 0;
        }
      } else {
        this.settleTimer = 0;
      }
    }

    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }
}

const game = new Game();
game.init();
