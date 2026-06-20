// 幽灵赛车竞技场 - 主程序入口
import { GhostRecorder, GhostReplay, GhostData, GhostFrame, InterpolationMethod } from './ghostRecorder';
import { AIOpponent, AIFactory, TrackWaypoint } from './aiOpponent';
import { CollisionManager, FinishLineDetector, Point, Obstacle, CollisionEvent } from './collisionManager';
import { UIRenderer, LeaderboardEntry, CarMiniMapData, UIData } from './uiRenderer';

interface PlayerCar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  friction: number;
  turnSpeed: number;
  width: number;
  height: number;
  lap: number;
  prevX: number;
  prevY: number;
}

interface TrackData {
  outerBoundary: Point[];
  innerBoundary: Point[];
  centerLine: Point[];
  waypoints: TrackWaypoint[];
  finishLineStart: Point;
  finishLineEnd: Point;
  obstacles: Obstacle[];
}

interface GameState {
  playerPosition: { x: number; y: number; angle: number; speed: number };
  collisionState: {
    active: boolean;
    lastEvent: CollisionEvent | null;
    slowdownActive: boolean;
    slowdownFactor: number;
  };
  lapInfo: {
    currentLap: number;
    totalLaps: number;
    lapTimes: number[];
    currentLapTime: number;
    totalTime: number;
  };
  raceState: 'countdown' | 'racing' | 'finished';
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const TOTAL_LAPS = 3;

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  private player: PlayerCar;
  private track: TrackData;
  private keys: Set<string> = new Set();

  private ghostRecorder: GhostRecorder;
  private ghostReplays: GhostReplay[] = [];
  private aiOpponents: AIOpponent[] = [];
  private collisionManager: CollisionManager;
  private finishLineDetector: FinishLineDetector;
  private uiRenderer: UIRenderer;

  private gameState: 'countdown' | 'racing' | 'finished' = 'countdown';
  private countdownValue: number = 3;
  private countdownTimer: number = 0;
  private raceStartTime: number = 0;
  private lapStartTime: number = 0;
  private lapTimes: number[] = [];
  private totalTime: number = 0;
  private showLeaderboard: boolean = false;
  private finishAnimationTimer: number = 0;
  private playerFinished: boolean = false;
  private lapPenaltyTime: number = 0;

  private globalState: GameState;
  private lastCollisionEvent: CollisionEvent | null = null;
  private collisionActive: boolean = false;
  private slowdownActive: boolean = false;
  private slowdownFactor: number = 1.0;
  private interpolationMethod: InterpolationMethod = 'spline';

  constructor() {
    const canvasEl = document.getElementById('gameCanvas');
    if (!canvasEl) throw new Error('Canvas not found');
    this.canvas = canvasEl as HTMLCanvasElement;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Cannot get 2D context');
    this.ctx = context;

    this.track = this.generateTrack();
    this.player = this.createPlayer();
    this.ghostRecorder = new GhostRecorder();
    this.collisionManager = new CollisionManager();
    this.finishLineDetector = new FinishLineDetector(
      this.track.finishLineStart,
      this.track.finishLineEnd
    );
    this.uiRenderer = new UIRenderer(this.ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.globalState = this.createInitialState();

    this.setupInput();
    this.initializeTrack();
    this.initializeAI();
    this.setupCollisionCallbacks();
    this.startCountdown();
  }

  private createInitialState(): GameState {
    return {
      playerPosition: { x: this.player.x, y: this.player.y, angle: this.player.angle, speed: this.player.speed },
      collisionState: {
        active: false,
        lastEvent: null,
        slowdownActive: false,
        slowdownFactor: 1.0
      },
      lapInfo: {
        currentLap: 1,
        totalLaps: TOTAL_LAPS,
        lapTimes: [],
        currentLapTime: 0,
        totalTime: 0
      },
      raceState: 'countdown'
    };
  }

  private updateGlobalState(): void {
    this.globalState.playerPosition = {
      x: this.player.x,
      y: this.player.y,
      angle: this.player.angle,
      speed: this.player.speed
    };
    this.globalState.collisionState = {
      active: this.collisionActive,
      lastEvent: this.lastCollisionEvent,
      slowdownActive: this.slowdownActive,
      slowdownFactor: this.slowdownFactor
    };
    const currentLapTime = this.gameState === 'racing' && !this.playerFinished
      ? (performance.now() - this.lapStartTime) / 1000 + this.lapPenaltyTime
      : this.lapPenaltyTime;
    this.globalState.lapInfo = {
      currentLap: Math.min(this.player.lap, TOTAL_LAPS),
      totalLaps: TOTAL_LAPS,
      lapTimes: [...this.lapTimes],
      currentLapTime,
      totalTime: this.totalTime + (this.gameState === 'racing' && !this.playerFinished ? currentLapTime : 0)
    };
    this.globalState.raceState = this.gameState;
  }

  private createPlayer(): PlayerCar {
    const startWp = this.track.waypoints[0];
    const nextWp = this.track.waypoints[1];
    const angle = Math.atan2(nextWp.y - startWp.y, nextWp.x - startWp.x);
    return {
      x: startWp.x,
      y: startWp.y,
      prevX: startWp.x,
      prevY: startWp.y,
      angle,
      speed: 0,
      maxSpeed: 320,
      acceleration: 200,
      deceleration: 280,
      friction: 0.985,
      turnSpeed: 2.5,
      width: 28,
      height: 16,
      lap: 1
    };
  }

  private generateTrack(): TrackData {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const outerRx = 520;
    const outerRy = 340;
    const innerRx = 340;
    const innerRy = 200;
    const points = 48;

    const outerBoundary: Point[] = [];
    const innerBoundary: Point[] = [];
    const centerLine: Point[] = [];
    const waypoints: TrackWaypoint[] = [];

    for (let i = 0; i < points; i++) {
      const t = (i / points) * Math.PI * 2;
      const wobble = Math.sin(t * 3) * 25;
      const wobble2 = Math.cos(t * 2) * 20;

      const ox = cx + Math.cos(t) * (outerRx + wobble);
      const oy = cy + Math.sin(t) * (outerRy + wobble2);
      outerBoundary.push({ x: ox, y: oy });

      const ix = cx + Math.cos(t) * (innerRx + wobble * 0.6);
      const iy = cy + Math.sin(t) * (innerRy + wobble2 * 0.6);
      innerBoundary.push({ x: ix, y: iy });

      const centerRx = (outerRx + innerRx) / 2;
      const centerRy = (outerRy + innerRy) / 2;
      const cxp = cx + Math.cos(t) * (centerRx + wobble * 0.8);
      const cyp = cy + Math.sin(t) * (centerRy + wobble2 * 0.8);
      centerLine.push({ x: cxp, y: cyp });

      if (i % 3 === 0) {
        waypoints.push({
          x: cxp,
          y: cyp,
          radius: 60
        });
      }
    }

    const finishY = cy + (outerRy + innerRy) / 2;
    const finishX1 = cx - 40;
    const finishX2 = cx + 40;

    const obstacles: Obstacle[] = [
      { x: cx + 120, y: cy - 80, radius: 18, type: 'barrier' },
      { x: cx - 150, y: cy + 60, radius: 15, type: 'cone' },
      { x: cx + 60, y: cy + 140, radius: 20, type: 'pillar' },
      { x: cx - 200, y: cy - 120, radius: 16, type: 'cone' },
      { x: cx + 280, y: cy + 10, radius: 14, type: 'barrier' },
      { x: cx - 100, y: cy - 200, radius: 18, type: 'pillar' }
    ];

    return {
      outerBoundary,
      innerBoundary,
      centerLine,
      waypoints,
      finishLineStart: { x: finishX1, y: finishY },
      finishLineEnd: { x: finishX2, y: finishY },
      obstacles
    };
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'l') {
        this.showLeaderboard = !this.showLeaderboard;
      }
      if (e.key.toLowerCase() === 'r' && this.gameState === 'finished') {
        this.restartRace();
      }
      if (e.key.toLowerCase() === 'i') {
        this.interpolationMethod = this.interpolationMethod === 'linear' ? 'spline' : 'linear';
        this.ghostReplays.forEach(replay => replay.setInterpolationMethod(this.interpolationMethod));
        console.log(`插值方法切换为: ${this.interpolationMethod}`);
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private initializeTrack(): void {
    this.collisionManager.setTrackBoundaries(this.track.outerBoundary, this.track.innerBoundary);
    this.collisionManager.setObstacles(this.track.obstacles);
  }

  private initializeAI(): void {
    this.aiOpponents = AIFactory.generateOpponents(this.track.waypoints, 45, 2, this.player.maxSpeed);
  }

  private setupCollisionCallbacks(): void {
    this.collisionManager.onCollision((event: CollisionEvent) => {
      this.lastCollisionEvent = event;
      this.collisionActive = true;
      this.slowdownActive = event.speedReductionFactor < 1.0;
      this.slowdownFactor = event.speedReductionFactor;
      console.log(`碰撞发生: 类型=${event.type}, 力度=${event.impactForce.toFixed(2)}, 减速=${event.speedReductionFactor}, 惩罚=${event.penaltyTime}s`);
      setTimeout(() => {
        this.collisionActive = false;
      }, 300);
    });
  }

  private startCountdown(): void {
    this.gameState = 'countdown';
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.globalState.raceState = 'countdown';
  }

  private startRace(): void {
    this.gameState = 'racing';
    this.raceStartTime = performance.now();
    this.lapStartTime = performance.now();
    this.ghostRecorder.startRecording(1);
    this.aiOpponents.forEach(ai => ai.start());
    this.globalState.raceState = 'racing';

    const bestGhost = this.ghostRecorder.getBestGhost();
    if (bestGhost) {
      const replay = new GhostReplay();
      replay.loadGhost(bestGhost);
      replay.setInterpolationMethod(this.interpolationMethod);
      replay.startPlayback();
      this.ghostReplays.push(replay);
    }
  }

  private restartRace(): void {
    this.player = this.createPlayer();
    this.lapTimes = [];
    this.totalTime = 0;
    this.playerFinished = false;
    this.lapPenaltyTime = 0;
    this.finishAnimationTimer = 0;
    this.ghostReplays = [];
    this.collisionManager.reset();
    this.aiOpponents.forEach(ai => ai.reset());
    this.lastCollisionEvent = null;
    this.collisionActive = false;
    this.slowdownActive = false;
    this.slowdownFactor = 1.0;
    this.globalState = this.createInitialState();
    this.startCountdown();
  }

  public update(deltaTime: number): void {
    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    if (this.fpsUpdateTime >= 1) {
      this.fps = Math.round(this.frameCount / this.fpsUpdateTime);
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }

    if (this.gameState === 'countdown') {
      this.updateCountdown(deltaTime);
      this.updateGlobalState();
      return;
    }

    if (this.gameState === 'racing') {
      this.updatePlayer(deltaTime);
      this.updateAI(deltaTime);
      this.updateGhostReplays();
      this.collisionManager.updateParticles(deltaTime);
      this.checkLapCompletion();
    }

    if (this.gameState === 'finished') {
      this.finishAnimationTimer += deltaTime;
      this.updateGhostReplays();
      this.collisionManager.updateParticles(deltaTime);
    }

    this.updateGlobalState();
  }

  private updateCountdown(deltaTime: number): void {
    this.countdownTimer += deltaTime;
    if (this.countdownTimer >= 1) {
      this.countdownTimer = 0;
      this.countdownValue--;
      if (this.countdownValue < 0) {
        this.startRace();
      }
    }
  }

  private updatePlayer(deltaTime: number): void {
    if (this.playerFinished) return;

    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;

    const keys = this.keys;
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');
    const left = keys.has('arrowleft') || keys.has('a');
    const right = keys.has('arrowright') || keys.has('d');

    if (up) {
      this.player.speed = Math.min(
        this.player.maxSpeed,
        this.player.speed + this.player.acceleration * deltaTime
      );
    }
    if (down) {
      this.player.speed = Math.max(
        -this.player.maxSpeed * 0.4,
        this.player.speed - this.player.deceleration * deltaTime
      );
    }

    if (!up && !down) {
      this.player.speed *= this.player.friction;
    }

    const turnFactor = Math.min(1, Math.abs(this.player.speed) / 80);
    if (left) {
      this.player.angle -= this.player.turnSpeed * deltaTime * turnFactor;
    }
    if (right) {
      this.player.angle += this.player.turnSpeed * deltaTime * turnFactor;
    }

    const collisionResult = this.collisionManager.checkCarCollision({
      x: this.player.x,
      y: this.player.y,
      angle: this.player.angle,
      width: this.player.width,
      height: this.player.height,
      speed: this.player.speed
    }, deltaTime);

    if (collisionResult.collided) {
      this.player.speed = collisionResult.newSpeed;
      this.lapPenaltyTime += collisionResult.positionPenalty;
    }

    this.slowdownActive = collisionResult.shouldSlowdown;
    this.slowdownFactor = collisionResult.slowdownFactor;
    if (this.slowdownActive && this.slowdownFactor < 1.0) {
      this.player.speed *= Math.pow(this.slowdownFactor, deltaTime * 2);
    }

    this.player.x += Math.cos(this.player.angle) * this.player.speed * deltaTime;
    this.player.y += Math.sin(this.player.angle) * this.player.speed * deltaTime;

    this.ghostRecorder.recordFrame(
      this.player.x,
      this.player.y,
      this.player.angle,
      this.player.speed
    );
  }

  private updateAI(deltaTime: number): void {
    for (const ai of this.aiOpponents) {
      ai.update(deltaTime);
    }
  }

  private updateGhostReplays(): void {
    for (const replay of this.ghostReplays) {
      replay.update();
    }
  }

  private checkLapCompletion(): void {
    if (this.playerFinished) return;

    const crossed = this.finishLineDetector.checkCrossing(
      { x: this.player.prevX, y: this.player.prevY },
      { x: this.player.x, y: this.player.y }
    );

    if (crossed && this.player.speed > 20) {
      const now = performance.now();
      const lapTime = (now - this.lapStartTime) / 1000 + this.lapPenaltyTime;
      this.lapTimes.push(lapTime);
      this.totalTime += lapTime;
      this.lapPenaltyTime = 0;

      const ghostData = this.ghostRecorder.stopRecording();

      this.player.lap++;

      if (this.player.lap > TOTAL_LAPS) {
        this.playerFinished = true;
        this.finishAnimationTimer = 0;
        if (this.allFinished()) {
          this.gameState = 'finished';
          this.globalState.raceState = 'finished';
          this.saveLeaderboard();
        }
      } else {
        this.lapStartTime = now;
        this.ghostRecorder.startRecording(this.player.lap);

        if (ghostData) {
          const replay = new GhostReplay();
          replay.loadGhost(ghostData);
          replay.setInterpolationMethod(this.interpolationMethod);
          replay.startPlayback();
          this.ghostReplays.push(replay);
        }
      }
    }

    if (this.playerFinished && this.allFinished() && this.gameState !== 'finished') {
      this.gameState = 'finished';
      this.globalState.raceState = 'finished';
      this.saveLeaderboard();
    }
  }

  private allFinished(): boolean {
    return this.aiOpponents.every(ai => ai.getFinished());
  }

  private saveLeaderboard(): void {
    try {
      const entries = this.buildLeaderboard();
      const existing = localStorage.getItem('ghostRacingLeaderboard');
      let all: LeaderboardEntry[] = existing ? JSON.parse(existing) : [];
      all = [...all, ...entries].sort((a, b) => a.totalTime - b.totalTime).slice(0, 20);
      localStorage.setItem('ghostRacingLeaderboard', JSON.stringify(all));
      console.log('排行榜已保存，共', all.length, '条记录');
    } catch (e) {
      console.log('无法保存排行榜:', e);
    }
  }

  private buildLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    entries.push({
      rank: 0,
      name: '玩家',
      totalTime: this.totalTime,
      lapTimes: [...this.lapTimes],
      isPlayer: true
    });

    for (const ai of this.aiOpponents) {
      entries.push({
        rank: 0,
        name: ai.getName(),
        totalTime: ai.getTotalTime(),
        lapTimes: ai.getLapTimes(),
        isPlayer: false
      });
    }

    return entries.sort((a, b) => a.totalTime - b.totalTime).map((e, i) => ({ ...e, rank: i + 1 }));
  }

  public render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.uiRenderer.drawTrackWithNeonEdges(
      this.track.outerBoundary,
      this.track.innerBoundary,
      this.track.centerLine
    );

    this.drawGuardrailParticles();

    for (const obs of this.track.obstacles) {
      this.uiRenderer.drawObstacleWithGlow(obs);
    }

    this.uiRenderer.drawFinishLineWithFlag(
      this.track.finishLineStart.x,
      this.track.finishLineStart.y,
      this.track.finishLineEnd.x,
      this.track.finishLineEnd.y,
      this.gameState === 'finished'
    );

    for (const replay of this.ghostReplays) {
      this.uiRenderer.drawGhostTrail(
        replay.getTrailPoints(),
        'rgba(100, 180, 255, 0.5)',
        '#64b4ff'
      );
    }

    for (const ai of this.aiOpponents) {
      this.uiRenderer.drawGhostTrail(
        ai.getTrailPoints(),
        ai.getColor().replace('#', 'rgba(').concat(', 0.5)'),
        ai.getNeonShadowColor()
      );
    }

    for (const replay of this.ghostReplays) {
      const frame = replay.update();
      if (frame) {
        this.uiRenderer.drawCarWithNeonGlow(
          frame.x,
          frame.y,
          frame.angle,
          this.player.width,
          this.player.height,
          'rgba(100, 180, 255, 0.6)',
          '#64b4ff',
          12,
          true
        );
      }
    }

    for (const ai of this.aiOpponents) {
      const pos = ai.getPosition();
      this.uiRenderer.drawCarWithNeonGlow(
        pos.x,
        pos.y,
        ai.getAngle(),
        this.player.width,
        this.player.height,
        ai.getColor() + 'aa',
        ai.getNeonShadowColor(),
        10,
        false
      );
    }

    this.uiRenderer.drawCarWithNeonGlow(
      this.player.x,
      this.player.y,
      this.player.angle,
      this.player.width,
      this.player.height,
      'rgba(0, 255, 170, 0.85)',
      '#00ffaa',
      15,
      false
    );

    const uiData = this.buildUIData();
    this.uiRenderer.render(uiData);

    this.drawFPSCounter();
  }

  private drawGuardrailParticles(): void {
    const guardrailParticles = this.collisionManager.getGuardrailParticles();
    const time = performance.now() / 500;
    for (const p of guardrailParticles) {
      const alpha = 0.25 + Math.sin(time + p.phase) * 0.35;
      const offset = Math.sin(time * 1.5 + p.phase) * 2;
      this.ctx.save();
      this.ctx.fillStyle = `rgba(0, 255, 170, ${alpha.toFixed(3)})`;
      this.ctx.shadowColor = '#00ffaa';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(p.x + offset, p.y + offset * 0.5, 2 + Math.sin(time + p.phase) * 1, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }
  }

  private buildUIData(): UIData {
    const currentLapTime = this.gameState === 'racing' && !this.playerFinished
      ? (performance.now() - this.lapStartTime) / 1000 + this.lapPenaltyTime
      : this.lapPenaltyTime;

    const totalT = this.totalTime + (this.gameState === 'racing' && !this.playerFinished ? currentLapTime : 0);

    const cars: CarMiniMapData[] = [
      {
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle,
        color: '#00ffaa',
        isPlayer: true,
        lap: this.player.lap,
        name: '玩家'
      },
      ...this.aiOpponents.map(ai => ({
        x: ai.getPosition().x,
        y: ai.getPosition().y,
        angle: ai.getAngle(),
        color: ai.getColor(),
        isPlayer: false,
        lap: ai.getLap(),
        name: ai.getName()
      }))
    ];

    for (const replay of this.ghostReplays) {
      const frame = replay.update();
      if (frame) {
        cars.push({
          x: frame.x,
          y: frame.y,
          angle: frame.angle,
          color: '#64b4ff',
          isPlayer: false,
          lap: 0,
          name: '幽灵车'
        });
      }
    }

    let leaderboard = this.buildLeaderboard();
    try {
      const saved = localStorage.getItem('ghostRacingLeaderboard');
      if (saved) {
        const savedEntries: LeaderboardEntry[] = JSON.parse(saved);
        const playerEntry = leaderboard.find(e => e.isPlayer);
        if (playerEntry) {
          leaderboard = [...savedEntries.slice(0, 10)];
          if (!leaderboard.some(e => e.isPlayer)) {
            leaderboard.push(playerEntry);
          }
        } else {
          leaderboard = savedEntries.slice(0, 6);
        }
      }
    } catch (e) { }

    return {
      speed: Math.abs(this.player.speed),
      maxSpeed: this.player.maxSpeed,
      currentLap: Math.min(this.player.lap, TOTAL_LAPS),
      totalLaps: TOTAL_LAPS,
      currentLapTime,
      totalTime: totalT,
      lapTimes: [...this.lapTimes],
      leaderboard,
      showLeaderboard: this.showLeaderboard,
      cars,
      screenFlashAlpha: this.collisionManager.getScreenFlashAlpha(),
      particles: this.collisionManager.getSparkParticles(),
      finishAnimation: this.gameState === 'finished',
      countdown: this.countdownValue,
      countdownActive: this.gameState === 'countdown',
      guardrailParticles: this.collisionManager.getGuardrailParticles(),
      collisionActive: this.collisionActive
    };
  }

  private drawFPSCounter(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = this.fps >= 50 ? '#00ffaa' : '#ff4757';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${this.fps}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText(`插值: ${this.interpolationMethod}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 25);
    ctx.restore();
  }

  public gameLoop = (timestamp: number): void => {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaTime = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  public start(): void {
    requestAnimationFrame(this.gameLoop);
  }

  public getGlobalState(): Readonly<GameState> {
    return this.globalState;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
  (window as any).gameInstance = game;
  console.log('🏁 幽灵赛车竞技场已启动!');
  console.log('🎮 控制: 方向键/WASD移动 | L键排行榜 | R键重开 | I键切换插值');
});
