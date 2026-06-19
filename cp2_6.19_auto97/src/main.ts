import { GestureRecognizer, TrajectoryPoint } from './input/gesture-recognizer';
import { Player } from './entities/player';
import { EnemyManager, Enemy, DeathEvent, DamageEvent } from './entities/enemy';
import { RuneSystem, RuneType, MatchResult, SpellCastEvent, RuneDefinition, Point, SpellElement } from './entities/rune-system';
import { Renderer, RuneCardState } from './rendering/renderer';

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private gestureRecognizer: GestureRecognizer;
  private player: Player;
  private enemyManager: EnemyManager;
  private runeSystem: RuneSystem;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationId: number | null = null;
  private currentTrajectory: TrajectoryPoint[] = [];
  private currentElement: SpellElement = 'fire';
  private isRunning: boolean = false;

  private onResizeBound: () => void;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }

    this.onResizeBound = this.resize.bind(this);
    window.addEventListener('resize', this.onResizeBound);

    this.renderer = new Renderer(this.canvas);

    this.runeSystem = new RuneSystem();

    this.enemyManager = new EnemyManager(window.innerWidth, window.innerHeight, {
      onDeath: this.onDeath.bind(this),
      onDamage: this.onDamage.bind(this),
    });

    this.player = new Player({
      onSpellCast: this.onSpellCast.bind(this),
      onScoreChange: this.onScoreChange.bind(this),
    });

    const circleParams = this.renderer.getCircleParams();
    this.gestureRecognizer = new GestureRecognizer(
      this.canvas,
      circleParams.x,
      circleParams.y,
      circleParams.r,
      {
        onStart: this.onStart.bind(this),
        onMove: this.onMove.bind(this),
        onEnd: this.onEnd.bind(this),
        onCancel: this.onCancel.bind(this),
      }
    );

    this.resize(true);
  }

  private onStart(): void {
    this.currentTrajectory = [];
  }

  private onMove(pt: TrajectoryPoint): void {
    this.currentTrajectory.push(pt);
  }

  private onEnd(points: TrajectoryPoint[]): void {
    if (points.length < 10) {
      this.currentTrajectory = [];
      return;
    }

    const normalizedPoints: Point[] = points.map((p) => ({
      x: p.x,
      y: p.y,
      timestamp: p.timestamp,
    }));

    const matchResult: MatchResult = this.runeSystem.matchPattern(normalizedPoints);

    if (matchResult.matched) {
      const now = performance.now();
      const spellEvent = this.player.castSpell(matchResult, now);
      if (spellEvent) {
        this.renderer.triggerSpellEffect(
          matchResult.runeId as RuneType,
          spellEvent.rune.color
        );
      }
    }

    this.currentTrajectory = [];
  }

  private onCancel(): void {
    this.currentTrajectory = [];
  }

  private onSpellCast(event: SpellCastEvent): void {
    this.renderer.triggerCardFlash(event.rune.id);

    const circleParams = this.renderer.getCircleParams();
    this.renderer.addShockwave(circleParams.x, circleParams.y, event.rune.color);
    this.renderer.playWandStrikeSound();

    const impactX = circleParams.x - circleParams.r * 0.3;
    const impactY = circleParams.y;
    const radius = circleParams.r * 1.5;

    this.enemyManager.hitTestSpellImpact(
      impactX,
      impactY,
      radius,
      event.damage,
      event.rune.color
    );
  }

  private onScoreChange(score: number, delta: number): void {
    this.renderer.triggerScoreBounce();
  }

  private onDeath(event: DeathEvent): void {
    const { enemy, scoreReward } = event;
    this.renderer.addDeathParticles(enemy.x, enemy.y, enemy.type);
    this.renderer.addFlyingCoin(enemy.x, enemy.y);
    this.player.addScore(scoreReward);
  }

  private onDamage(event: DamageEvent): void {
    this.renderer.addSparkParticles(event.x, event.y, event.color, 10);
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return;

    let deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (deltaTime > 100) {
      deltaTime = 100;
    }

    this.accumulator += deltaTime;

    while (this.accumulator >= FRAME_TIME) {
      this.fixedUpdate(FRAME_TIME / 1000);
      this.accumulator -= FRAME_TIME;
    }

    const alpha = this.accumulator / FRAME_TIME;
    this.update(deltaTime / 1000);
    this.render(timestamp, alpha);

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private fixedUpdate(dt: number): void {}

  private update(dt: number): void {
    const now = performance.now();

    this.player.regenMana(dt);
    this.player.updateCooldowns(now);
    this.enemyManager.update(dt, now);
    this.gestureRecognizer.update();
    this.renderer.update(dt);

    const state = this.player.getState();
    if (state.selectedRuneId) {
      const rune = this.runeSystem.getRuneById(state.selectedRuneId);
      if (rune) {
        this.currentElement = rune.element;
      }
    } else {
      const firstRune = this.runeSystem.getRunes()[0];
      if (firstRune) {
        this.currentElement = firstRune.element;
      }
    }
  }

  private buildRuneCards(now: number): RuneCardState[] {
    return this.runeSystem.getRunes().map((r: RuneDefinition): RuneCardState => ({
      rune: r,
      cooldownPercent: this.player.getCooldownPercent(r.id, now),
      isActive: this.player.canCastRune(r, now),
    }));
  }

  private render(now: number, alpha: number): void {
    const segments = this.gestureRecognizer.getActiveSegments();
    const enemies = this.enemyManager.getEnemies();
    const perfNow = performance.now();
    const runeCards = this.buildRuneCards(perfNow);
    const state = this.player.getState();

    this.renderer.render(
      segments,
      enemies,
      runeCards,
      state.score,
      state.mana,
      state.maxMana,
      state.combo,
      this.currentTrajectory,
      this.currentElement
    );
  }

  private resize(updateRecognizer: boolean = true): void {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.renderer) {
      this.renderer.resize(width, height);
    }

    if (this.renderer && this.gestureRecognizer && updateRecognizer) {
      const circleParams = this.renderer.getCircleParams();
      this.gestureRecognizer.setCenter(circleParams.x, circleParams.y, circleParams.r);
    }

    if (this.enemyManager) {
      this.enemyManager.resize(width, height);
    }
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  destroy(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('resize', this.onResizeBound);
    this.gestureRecognizer.destroy();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
  (window as any).game = game;
});
