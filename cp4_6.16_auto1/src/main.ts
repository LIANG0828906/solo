import { GhostRecorder, GhostReplay, GhostData, GhostFrame } from './ghostRecorder';
import { AIOpponent, AIFactory, TrackWaypoint } from './aiOpponent';
import { CollisionManager, FinishLineDetector, Point, Obstacle } from './collisionManager';
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

  private guardrailParticles: { x: number; y: number; phase: number }[] = [];

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

    this.setupInput();
    this.initializeTrack();
    this.initializeAI();
    this.initializeGuardrailParticles();
    this.startCountdown();
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
    this.aiOpponents = AIFactory.generateOpponents(this.track.waypoints, 45, 2);
  }

  private initializeGuardrailParticles(): void {
    this.guardrailParticles = [];
    const allPoints = [...this.track.outerBoundary, ...this.track.innerBoundary];
    for (let i = 0; i < 80; i++) {
      const p = allPoints[Math.floor(Math.random() * allPoints.length)];
      this.guardrailParticles.push({
        x: p.x + (Math.random() - 0.5) * 4,
        y: p.y + (Math.random() - 0.5) * 4,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private startCountdown(): void {
    this.gameState = 'countdown';
    this.countdownValue = 3;
    this.countdownTimer = 0;
  }

  private startRace(): void {
    this.gameState = 'racing';
    this.raceStartTime = performance.now();
    this.lapStartTime = performance.now();
    this.ghostRecorder.startRecording(1);
    this.aiOpponents.forEach(ai => ai.start());

    const bestGhost = this.ghostRecorder.getBestGhost();
    if (bestGhost) {
      const replay = new GhostReplay();
      replay.loadGhost(bestGhost);
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
    this.initializeGuardrailParticles();
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
          this.saveLeaderboard();
        }
      } else {
        this.lapStartTime = now;
        this.ghostRecorder.startRecording(this.player.lap);

        if (ghostData) {
          const replay = new GhostReplay();
          replay.loadGhost(ghostData);
          replay.startPlayback();
          this.ghostReplays.push(replay);
        }
      }
    }

    if (this.playerFinished && this.allFinished() && this.gameState !== 'finished') {
      this.gameState = 'finished';
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
    } catch (e) {
      console.log('Could not save leaderboard');
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

    this.drawTrack();
    this.drawGuardrailParticles();
    this.drawObstacles();
    this.drawFinishLine();

    for (const replay of this.ghostReplays) {
      this.drawGhostTrail(replay.getTrailPoints());
    }

    for (const ai of this.aiOpponents) {
      this.drawAITrail(ai);
    }

    for (const replay of this.ghostReplays) {
      const frame = replay.update();
      this.drawGhostCar(frame);
    }

    for (const ai of this.aiOpponents) {
      this.drawAICar(ai);
    }

    this.drawPlayer();

    const uiData = this.buildUIData();
    this.uiRenderer.render(uiData);

    this.drawFPSCounter();
  }

  private drawTrack(): void {
    const ctx = this.ctx;

    const trackGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 600
    );
    trackGrad.addColorStop(0, '#0a0a15');
    trackGrad.addColorStop(1, '#05050a');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.fillStyle = '#1a1f2e';
    ctx.strokeStyle = '#2a3a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.track.outerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a0a15';
    ctx.beginPath();
    this.track.innerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    this.track.outerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    this.track.innerBoundary.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    this.track.centerLine.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawGuardrailParticles(): void {
    const ctx = this.ctx;
    const time = performance.now() / 500;
    for (const p of this.guardrailParticles) {
      const alpha = 0.3 + Math.sin(time + p.phase) * 0.4;
      ctx.fillStyle = `rgba(0, 255, 170, ${alpha.toFixed(3)})`;
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + Math.sin(time + p.phase) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  private drawObstacles(): void {
    const ctx = this.ctx;
    for (const obs of this.track.obstacles) {
      ctx.save();
      if (obs.type === 'barrier') {
        ctx.fillStyle = '#ff6b35';
        ctx.shadowColor = '#ff6b35';
      } else if (obs.type === 'cone') {
        ctx.fillStyle = '#ff9500';
        ctx.shadowColor = '#ff9500';
      } else {
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = '#ff4757';
      }
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawFinishLine(): void {
    const ctx = this.ctx;
    const { finishLineStart, finishLineEnd } = this.track;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(finishLineStart.x, finishLineStart.y - 30);
    ctx.lineTo(finishLineEnd.x, finishLineEnd.y - 30);
    ctx.stroke();
    ctx.restore();

    const segments = 8;
    const dx = (finishLineEnd.x - finishLineStart.x) / segments;
    for (let i = 0; i < segments; i++) {
      const x1 = finishLineStart.x + dx * i;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(x1, finishLineStart.y - 35, dx, 10);
    }

    if (this.gameState === 'finished') {
      const wave = Math.sin(performance.now() / 200) * 10;
      ctx.save();
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(finishLineEnd.x + 5, finishLineEnd.y - 80 + wave, 40, 30);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(finishLineEnd.x, finishLineEnd.y - 100);
      ctx.lineTo(finishLineEnd.x, finishLineEnd.y - 40);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawGhostTrail(points: { x: number; y: number; alpha: number }[]): void {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      ctx.strokeStyle = `rgba(100, 180, 255, ${(p1.alpha * 0.4).toFixed(3)})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#64b4ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawGhostCar(frame: GhostFrame | null): void {
    if (!frame) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(frame.x, frame.y);
    ctx.rotate(frame.angle);
    ctx.globalAlpha = 0.5;

    ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
    ctx.strokeStyle = '#64b4ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#64b4ff';
    ctx.shadowBlur = 12;
    this.drawCarBody(ctx);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawAITrail(ai: AIOpponent): void {
    const points = ai.getTrailPoints();
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      ctx.strokeStyle = `${ai.getColor()}${Math.floor(p1.alpha * 128).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 3;
      ctx.shadowColor = ai.getColor();
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawAICar(ai: AIOpponent): void {
    const ctx = this.ctx;
    const pos = ai.getPosition();
    const angle = ai.getAngle();
    const color = ai.getColor();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    ctx.fillStyle = `${color}aa`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    this.drawCarBody(ctx);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayer(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);

    const neonGreen = '#00ffaa';
    ctx.fillStyle = 'rgba(0, 255, 170, 0.85)';
    ctx.strokeStyle = neonGreen;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = neonGreen;
    ctx.shadowBlur = 15;
    this.drawCarBody(ctx);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawCarBody(ctx: CanvasRenderingContext2D): void {
    const w = this.player.width;
    const h = this.player.height;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 4, -h / 2);
    ctx.lineTo(-w / 3, -h / 2);
    ctx.lineTo(-w / 2, -h / 4);
    ctx.lineTo(-w / 2, h / 4);
    ctx.lineTo(-w / 3, h / 2);
    ctx.lineTo(w / 4, h / 2);
    ctx.closePath();
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
      countdownActive: this.gameState === 'countdown'
    };
  }

  private drawFPSCounter(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = this.fps >= 50 ? '#00ffaa' : '#ff4757';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${this.fps}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
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
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
