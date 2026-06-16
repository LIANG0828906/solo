import { Grid, GRID_SIZE, CELL_SIZE, PHOTON_RADIUS } from './grid';
import { Photon, PhotonColor, COLORS, PhotonState, BurstParticle, COLOR_CONFIG, Ripple } from './photon';
import { Renderer } from './renderer';
import { ChainResolver, ChainEvent } from './chainResolver';

export enum GamePhase {
  Idle,
  Dragging,
  Moving,
  Returning,
  Superposing,
  PostSuperpose,
  Collapsing,
  PostCollapse,
  Shifting,
  Adding,
  GameOver
}

export class GameLoop {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  renderer: Renderer;
  grid: Grid;
  chainResolver: ChainResolver;

  phase: GamePhase;
  phaseTimer: number;
  score: number;
  displayScore: number;
  chainCount: number;
  chainScale: number;
  scoreAnimScale: number;
  lastShiftScore: number;
  chainLevel: number;

  dragPhoton: Photon | null;
  dragX: number;
  dragY: number;
  dragOrigGridX: number;
  dragOrigGridY: number;
  dragOrigPixelX: number;
  dragOrigPixelY: number;

  movePhotonRef: Photon | null;
  moveStartX: number;
  moveStartY: number;
  moveEndX: number;
  moveEndY: number;

  returnPhotonRef: Photon | null;
  returnStartX: number;
  returnStartY: number;
  returnEndX: number;
  returnEndY: number;

  superposeA: Photon | null;
  superposeB: Photon | null;
  superposeAOrigX: number;
  superposeAOrigY: number;
  superposeBOrigX: number;
  superposeBOrigY: number;
  superposeRippleAdded: boolean;

  collapsePhotonRef: Photon | null;
  collapseRemovedList: Photon[];

  shiftRemoved: Photon[];
  shiftNewPhotons: Photon[];
  shiftFromPositions: Map<Photon, { x: number; y: number }>;

  addPhotonRef: Photon | null;

  burstParticles: BurstParticle[];
  ripples: Ripple[];

  gameTime: number;
  lastTimestamp: number;
  running: boolean;
  animFrameId: number;
  frameRenderTime: number;
  maxFrameRenderTime: number;
  frameCount: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx);
    this.grid = new Grid();
    this.chainResolver = new ChainResolver(this.grid);

    this.phase = GamePhase.Idle;
    this.phaseTimer = 0;
    this.score = 0;
    this.displayScore = 0;
    this.chainCount = 0;
    this.chainScale = 1;
    this.scoreAnimScale = 1;
    this.lastShiftScore = 0;
    this.chainLevel = 0;

    this.dragPhoton = null;
    this.dragX = 0;
    this.dragY = 0;
    this.dragOrigGridX = 0;
    this.dragOrigGridY = 0;
    this.dragOrigPixelX = 0;
    this.dragOrigPixelY = 0;

    this.movePhotonRef = null;
    this.moveStartX = 0;
    this.moveStartY = 0;
    this.moveEndX = 0;
    this.moveEndY = 0;

    this.returnPhotonRef = null;
    this.returnStartX = 0;
    this.returnStartY = 0;
    this.returnEndX = 0;
    this.returnEndY = 0;

    this.superposeA = null;
    this.superposeB = null;
    this.superposeAOrigX = 0;
    this.superposeAOrigY = 0;
    this.superposeBOrigX = 0;
    this.superposeBOrigY = 0;
    this.superposeRippleAdded = false;

    this.collapsePhotonRef = null;
    this.collapseRemovedList = [];

    this.shiftRemoved = [];
    this.shiftNewPhotons = [];
    this.shiftFromPositions = new Map();

    this.addPhotonRef = null;

    this.burstParticles = [];
    this.ripples = [];

    this.gameTime = 0;
    this.lastTimestamp = 0;
    this.running = false;
    this.animFrameId = 0;
    this.frameRenderTime = 0;
    this.maxFrameRenderTime = 12;
    this.frameCount = 0;

    this.initGame();
    this.setupInput();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  initGame() {
    this.grid = new Grid();
    this.grid.init();
    this.chainResolver = new ChainResolver(this.grid);
    this.score = 0;
    this.displayScore = 0;
    this.chainCount = 0;
    this.chainLevel = 0;
    this.lastShiftScore = 0;
    this.phase = GamePhase.Idle;
    this.phaseTimer = 0;
    this.burstParticles = [];
    this.ripples = [];
    this.dragPhoton = null;
    this.movePhotonRef = null;
    this.returnPhotonRef = null;
    this.superposeA = null;
    this.superposeB = null;
    this.collapsePhotonRef = null;
    this.collapseRemovedList = [];
    this.shiftRemoved = [];
    this.shiftNewPhotons = [];
    this.addPhotonRef = null;
    this.scoreAnimScale = 1;
    this.chainScale = 1;
    this.syncPhotonPositions();
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.renderer.resize();
    this.syncPhotonPositions();
  }

  syncPhotonPositions() {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const p = this.grid.getPhoton(x, y);
        if (p) {
          const pos = this.renderer.gridToPixel(x, y);
          p.x = pos.x;
          p.y = pos.y;
          p.targetX = pos.x;
          p.targetY = pos.y;
        }
      }
    }
  }

  setupInput() {
    const down = (px: number, py: number) => {
      if (this.phase === GamePhase.GameOver) {
        if (this.renderer.isRestartButtonClicked(px, py)) {
          this.initGame();
        }
        return;
      }
      if (this.phase !== GamePhase.Idle) return;
      const gp = this.renderer.pixelToGrid(px, py);
      if (!gp) return;
      const photon = this.grid.getPhoton(gp.x, gp.y);
      if (!photon) return;
      this.dragPhoton = photon;
      this.dragX = px;
      this.dragY = py;
      this.dragOrigGridX = photon.gridX;
      this.dragOrigGridY = photon.gridY;
      this.dragOrigPixelX = photon.x;
      this.dragOrigPixelY = photon.y;
      this.phase = GamePhase.Dragging;
    };
    const move = (px: number, py: number) => {
      if (this.phase !== GamePhase.Dragging || !this.dragPhoton) return;
      this.dragX = px;
      this.dragY = py;
    };
    const up = () => {
      if (this.phase !== GamePhase.Dragging || !this.dragPhoton) return;
      const gp = this.renderer.pixelToGrid(this.dragX, this.dragY);
      if (gp && this.grid.isEmpty(gp.x, gp.y) && this.grid.isAdjacent(this.dragOrigGridX, this.dragOrigGridY, gp.x, gp.y)) {
        this.beginMove(this.dragPhoton, gp.x, gp.y);
      } else {
        this.beginReturn(this.dragPhoton);
      }
      this.dragPhoton = null;
    };

    this.canvas.addEventListener('mousedown', (e) => down(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
    this.canvas.addEventListener('mouseup', () => up());
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); up(); }, { passive: false });
  }

  beginMove(photon: Photon, toGridX: number, toGridY: number) {
    this.movePhotonRef = photon;
    this.moveStartX = this.dragX;
    this.moveStartY = this.dragY;
    this.grid.movePhoton(this.dragOrigGridX, this.dragOrigGridY, toGridX, toGridY);
    const pos = this.renderer.gridToPixel(toGridX, toGridY);
    this.moveEndX = pos.x;
    this.moveEndY = pos.y;
    this.phase = GamePhase.Moving;
    this.phaseTimer = 0;
  }

  beginReturn(photon: Photon) {
    this.returnPhotonRef = photon;
    this.returnStartX = this.dragX;
    this.returnStartY = this.dragY;
    const pos = this.renderer.gridToPixel(photon.gridX, photon.gridY);
    this.returnEndX = pos.x;
    this.returnEndY = pos.y;
    this.phase = GamePhase.Returning;
    this.phaseTimer = 0;
  }

  startChainCheck() {
    this.chainLevel = 0;
    this.chainCount = 0;
    this.checkNextChain();
  }

  checkNextChain() {
    const event = this.chainResolver.findNextChainEvent();
    if (!event) {
      this.chainCount = 0;
      this.afterChainsResolved();
      return;
    }
    this.chainLevel++;
    this.chainCount = this.chainLevel;
    this.chainScale = 1.6;
    if (event.type === 'superpose') {
      this.beginSuperpose(event);
    } else {
      this.beginCollapse(event);
    }
  }

  beginSuperpose(event: ChainEvent) {
    this.superposeA = event.photonA;
    this.superposeB = event.photonB!;
    this.superposeAOrigX = event.photonA.x;
    this.superposeAOrigY = event.photonA.y;
    this.superposeBOrigX = event.photonB!.x;
    this.superposeBOrigY = event.photonB!.y;
    this.superposeRippleAdded = false;
    this.phase = GamePhase.Superposing;
    this.phaseTimer = 0;
  }

  finishSuperpose() {
    if (!this.superposeA || !this.superposeB) return;
    const midX = (this.superposeAOrigX + this.superposeBOrigX) / 2;
    const midY = (this.superposeAOrigY + this.superposeBOrigY) / 2;
    const cfg = COLOR_CONFIG[this.superposeA.color];
    this.ripples.push({
      x: midX, y: midY, startTime: this.gameTime, duration: 0.5,
      color: `rgba(${cfg.rgb},0.5)`, maxRadius: CELL_SIZE * 0.9
    });
    const result = this.chainResolver.processSuperposition({
      type: 'superpose', photonA: this.superposeA, photonB: this.superposeB
    });
    const pos = this.renderer.gridToPixel(result.gridX, result.gridY);
    result.x = pos.x;
    result.y = pos.y;
    result.scale = 1.2;
    result.targetScale = 1.2;
    result.opacity = 1;
    this.superposeA = null;
    this.superposeB = null;
    this.phase = GamePhase.PostSuperpose;
    this.phaseTimer = 0;
  }

  beginCollapse(event: ChainEvent) {
    this.collapsePhotonRef = event.photonA;
    this.collapseRemovedList = [];
    const x = event.photonA.gridX;
    const y = event.photonA.gridY;
    const color = event.photonA.color;
    this.collapseRemovedList.push(event.photonA);
    const adj = this.grid.getAdjacentCells(x, y);
    for (const n of adj) {
      const nb = this.grid.getPhoton(n.x, n.y);
      if (nb && nb.color === color) this.collapseRemovedList.push(nb);
    }
    this.phase = GamePhase.Collapsing;
    this.phaseTimer = 0;
  }

  finishCollapse() {
    if (!this.collapsePhotonRef) return;
    for (const p of this.collapseRemovedList) {
      this.createBurst(p);
    }
    const removed = this.grid.removePhotonAndAdjacent(
      this.collapsePhotonRef.gridX, this.collapsePhotonRef.gridY
    );
    const pts = this.chainResolver.calculateScore(removed.length, this.chainLevel);
    this.score += pts;
    this.scoreAnimScale = 1.5;
    for (const p of removed) {
      const cfg = COLOR_CONFIG[p.color];
      this.ripples.push({
        x: p.x, y: p.y, startTime: this.gameTime, duration: 0.6,
        color: `rgba(${cfg.rgb},0.4)`, maxRadius: CELL_SIZE
      });
    }
    this.collapsePhotonRef = null;
    this.collapseRemovedList = [];
    this.phase = GamePhase.PostCollapse;
    this.phaseTimer = 0;
  }

  createBurst(photon: Photon) {
    const cfg = COLOR_CONFIG[photon.color];
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 100;
      this.burstParticles.push({
        x: photon.x, y: photon.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? cfg.base : cfg.glow,
        size: 2 + Math.random() * 3
      });
    }
  }

  afterChainsResolved() {
    if (this.score - this.lastShiftScore >= 100) {
      this.lastShiftScore = Math.floor(this.score / 100) * 100;
      this.beginShift();
      return;
    }
    this.addNewPhoton();
  }

  addNewPhoton() {
    const photon = this.grid.addRandomPhoton();
    if (photon) {
      const pos = this.renderer.gridToPixel(photon.gridX, photon.gridY);
      photon.x = pos.x;
      photon.y = pos.y;
      photon.opacity = 0;
      this.addPhotonRef = photon;
      this.phase = GamePhase.Adding;
      this.phaseTimer = 0;
    } else {
      this.checkEndCondition();
    }
  }

  beginShift() {
    const result = this.grid.shiftDown();
    this.shiftRemoved = result.removed;
    this.shiftNewPhotons = result.newPhotons;
    this.shiftFromPositions = new Map();
    for (const p of result.shifted) {
      const fromPos = this.renderer.gridToPixel(p.gridX, p.gridY - 1);
      this.shiftFromPositions.set(p, fromPos);
    }
    for (const p of result.newPhotons) {
      const pos = this.renderer.gridToPixel(p.gridX, p.gridY);
      p.x = pos.x;
      p.y = pos.y - CELL_SIZE;
      p.opacity = 0;
    }
    for (const p of result.removed) {
      const pos = this.renderer.gridToPixel(p.gridX, p.gridY);
      p.x = pos.x;
      p.y = pos.y;
    }
    this.phase = GamePhase.Shifting;
    this.phaseTimer = 0;
  }

  checkEndCondition() {
    if (this.grid.isGameOver()) {
      this.phase = GamePhase.GameOver;
    } else {
      this.phase = GamePhase.Idle;
    }
  }

  update(dt: number) {
    this.gameTime += dt;
    this.phaseTimer += dt;

    if (this.displayScore < this.score) {
      this.displayScore += Math.max(1, (this.score - this.displayScore) * dt * 10);
      if (this.displayScore > this.score) this.displayScore = this.score;
    }
    if (this.scoreAnimScale > 1.01) {
      this.scoreAnimScale += (1 - this.scoreAnimScale) * dt * 10;
    } else {
      this.scoreAnimScale = 1;
    }
    if (this.chainScale > 1.01) {
      this.chainScale += (1 - this.chainScale) * dt * 8;
    } else {
      this.chainScale = 1;
    }

    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) this.burstParticles.splice(i, 1);
    }

    this.ripples = this.ripples.filter(r => this.gameTime - r.startTime < r.duration);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const p = this.grid.getPhoton(x, y);
        if (p) {
          p.updateAnimation(dt);
          if (p.energyLevel >= 2) {
            p.haloAngle += dt * 0.5;
          }
        }
      }
    }

    switch (this.phase) {
      case GamePhase.Dragging: this.updateDragging(); break;
      case GamePhase.Moving: this.updateMoving(dt); break;
      case GamePhase.Returning: this.updateReturning(dt); break;
      case GamePhase.Superposing: this.updateSuperposing(dt); break;
      case GamePhase.PostSuperpose: this.updatePostSuperpose(); break;
      case GamePhase.Collapsing: this.updateCollapsing(); break;
      case GamePhase.PostCollapse: this.updatePostCollapse(); break;
      case GamePhase.Shifting: this.updateShifting(dt); break;
      case GamePhase.Adding: this.updateAdding(); break;
    }
  }

  updateDragging() {
    if (this.dragPhoton) {
      this.dragPhoton.x = this.dragX;
      this.dragPhoton.y = this.dragY;
    }
  }

  updateMoving(dt: number) {
    if (!this.movePhotonRef) return;
    const dur = 0.2;
    const t = Math.min(1, this.phaseTimer / dur);
    const e = this.renderer.easeOutQuad(t);
    this.movePhotonRef.x = this.moveStartX + (this.moveEndX - this.moveStartX) * e;
    this.movePhotonRef.y = this.moveStartY + (this.moveEndY - this.moveStartY) * e;
    if (t >= 1) {
      this.movePhotonRef.x = this.moveEndX;
      this.movePhotonRef.y = this.moveEndY;
      this.movePhotonRef = null;
      this.startChainCheck();
    }
  }

  updateReturning(dt: number) {
    if (!this.returnPhotonRef) return;
    const dur = 0.3;
    const t = Math.min(1, this.phaseTimer / dur);
    const e = this.renderer.easeOutBack(t);
    this.returnPhotonRef.x = this.returnStartX + (this.returnEndX - this.returnStartX) * e;
    this.returnPhotonRef.y = this.returnStartY + (this.returnEndY - this.returnStartY) * e;
    if (t >= 1) {
      this.returnPhotonRef.x = this.returnEndX;
      this.returnPhotonRef.y = this.returnEndY;
      this.returnPhotonRef = null;
      this.phase = GamePhase.Idle;
    }
  }

  updateSuperposing(dt: number) {
    if (!this.superposeA || !this.superposeB) return;
    const dur = 0.6;
    const t = Math.min(1, this.phaseTimer / dur);
    const e = this.renderer.easeInOutCubic(t);
    this.superposeA.x = this.superposeAOrigX + (this.superposeBOrigX - this.superposeAOrigX) * e * 0.5;
    this.superposeA.y = this.superposeAOrigY + (this.superposeBOrigY - this.superposeAOrigY) * e * 0.5;
    this.superposeB.x = this.superposeBOrigX + (this.superposeAOrigX - this.superposeBOrigX) * e * 0.5;
    this.superposeB.y = this.superposeBOrigY + (this.superposeAOrigY - this.superposeBOrigY) * e * 0.5;
    this.superposeA.scale = 1 + e * 0.2;
    this.superposeB.opacity = 1 - e;

    if (t > 0.3 && !this.superposeRippleAdded) {
      this.superposeRippleAdded = true;
      const midX = (this.superposeAOrigX + this.superposeBOrigX) / 2;
      const midY = (this.superposeAOrigY + this.superposeBOrigY) / 2;
      const cfg = COLOR_CONFIG[this.superposeA.color];
      this.ripples.push({
        x: midX, y: midY, startTime: this.gameTime, duration: 0.5,
        color: `rgba(${cfg.rgb},0.5)`, maxRadius: CELL_SIZE * 0.8
      });
    }
    if (t >= 1) this.finishSuperpose();
  }

  updatePostSuperpose() {
    if (this.phaseTimer >= 0.15) this.checkNextChain();
  }

  updateCollapsing() {
    if (!this.collapsePhotonRef) return;
    const dur = 0.4;
    const t = Math.min(1, this.phaseTimer / dur);
    const flash = Math.abs(Math.sin(t * Math.PI * 10));
    this.collapsePhotonRef.opacity = 0.4 + flash * 0.6;
    this.collapsePhotonRef.scale = (this.collapsePhotonRef.targetScale || 1) * (1 + t * 0.3) * (1 + flash * 0.1);

    for (const p of this.collapseRemovedList) {
      if (p !== this.collapsePhotonRef) {
        p.opacity = 0.5 + flash * 0.3;
      }
    }

    if (t >= 1) this.finishCollapse();
  }

  updatePostCollapse() {
    if (this.phaseTimer >= 0.8) this.checkNextChain();
  }

  updateShifting(dt: number) {
    const dur = 0.5;
    const t = Math.min(1, this.phaseTimer / dur);
    const e = this.renderer.easeInOutCubic(t);

    for (const [photon, fromPos] of this.shiftFromPositions) {
      const toPos = this.renderer.gridToPixel(photon.gridX, photon.gridY);
      photon.x = fromPos.x + (toPos.x - fromPos.x) * e;
      photon.y = fromPos.y + (toPos.y - fromPos.y) * e;
    }
    for (const p of this.shiftRemoved) {
      p.opacity = 1 - e;
    }
    for (const p of this.shiftNewPhotons) {
      const toPos = this.renderer.gridToPixel(p.gridX, p.gridY);
      p.y = (toPos.y - CELL_SIZE) + CELL_SIZE * e;
      p.opacity = e;
    }

    if (t >= 1) {
      this.syncPhotonPositions();
      for (const p of this.shiftNewPhotons) p.opacity = 1;
      this.shiftRemoved = [];
      this.shiftNewPhotons = [];
      this.shiftFromPositions.clear();
      this.chainLevel = 0;
      this.checkNextChain();
    }
  }

  updateAdding() {
    if (!this.addPhotonRef) {
      this.checkEndCondition();
      return;
    }
    const dur = 0.3;
    const t = Math.min(1, this.phaseTimer / dur);
    this.addPhotonRef.opacity = t;
    if (t >= 1) {
      this.addPhotonRef.opacity = 1;
      this.addPhotonRef = null;
      this.checkEndCondition();
    }
  }

  render() {
    const ctx = this.ctx;
    const time = this.gameTime;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderer.drawBackground(time);
    this.renderer.drawGrid();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const photon = this.grid.getPhoton(x, y);
        if (!photon) continue;
        if (photon === this.dragPhoton) continue;
        if (this.phase === GamePhase.Superposing && (photon === this.superposeA || photon === this.superposeB)) continue;
        if (this.phase === GamePhase.Collapsing && this.collapseRemovedList.includes(photon)) continue;
        if (this.phase === GamePhase.Returning && photon === this.returnPhotonRef) continue;
        if (this.phase === GamePhase.Moving && photon === this.movePhotonRef) continue;
        if (this.shiftRemoved.includes(photon)) continue;
        if (this.shiftNewPhotons.includes(photon)) continue;
        this.renderer.drawPhoton(photon, time);
      }
    }

    if (this.phase === GamePhase.Moving && this.movePhotonRef) {
      const dur = 0.2;
      const t = Math.min(1, this.phaseTimer / dur);
      const e = this.renderer.easeOutQuad(t);
      const nx = this.moveStartX + (this.moveEndX - this.moveStartX) * e;
      const ny = this.moveStartY + (this.moveEndY - this.moveStartY) * e;
      const prevX = this.movePhotonRef.x;
      const prevY = this.movePhotonRef.y;
      this.movePhotonRef.x = nx;
      this.movePhotonRef.y = ny;
      this.renderer.drawPhoton(this.movePhotonRef, time);
      this.movePhotonRef.x = prevX;
      this.movePhotonRef.y = prevY;
    }

    if (this.phase === GamePhase.Returning && this.returnPhotonRef) {
      const dur = 0.3;
      const t = Math.min(1, this.phaseTimer / dur);
      this.renderer.drawReturningPhoton(
        this.returnPhotonRef,
        this.returnStartX, this.returnStartY,
        this.returnEndX, this.returnEndY,
        t, time
      );
    }

    if (this.phase === GamePhase.Superposing && this.superposeA && this.superposeB) {
      const dur = 0.6;
      const t = Math.min(1, this.phaseTimer / dur);
      this.renderer.drawSuperposeMerge(
        this.superposeA, this.superposeB,
        this.superposeAOrigX, this.superposeAOrigY,
        this.superposeBOrigX, this.superposeBOrigY,
        t, time
      );
    }

    if (this.phase === GamePhase.Collapsing && this.collapsePhotonRef) {
      const prog = Math.min(1, this.phaseTimer / 0.4);
      this.renderer.drawCollapseBurst(this.collapsePhotonRef, prog, time, this.burstParticles);
      for (const p of this.collapseRemovedList) {
        if (p !== this.collapsePhotonRef) {
          const prevO = p.opacity;
          p.opacity = 0.3 + Math.abs(Math.sin(prog * 10 * Math.PI)) * 0.3;
          this.renderer.drawPhoton(p, time);
          p.opacity = prevO;
        }
      }
    }

    for (const p of this.shiftRemoved) {
      this.renderer.drawPhoton(p, time);
    }
    for (const p of this.shiftNewPhotons) {
      this.renderer.drawPhoton(p, time);
    }

    if (this.phase === GamePhase.Dragging && this.dragPhoton) {
      this.renderer.drawDragPhoton(
        this.dragPhoton,
        this.dragX, this.dragY,
        this.dragOrigPixelX, this.dragOrigPixelY,
        time
      );
    }

    this.renderer.drawParticles(this.burstParticles);
    this.renderer.drawRipples(this.ripples, time);
    this.renderer.drawScore(this.score, this.displayScore, this.scoreAnimScale);
    this.renderer.drawChainCounter(this.chainCount, this.chainScale);
    this.renderer.drawNextPreview(this.grid.nextPhotonColor);

    if (this.phase === GamePhase.GameOver) {
      this.renderer.drawGameOver(this.score, time);
    }
  }

  start() {
    this.running = true;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  loop = (timestamp: number) => {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.frameCount++;

    const updateStart = performance.now();
    this.update(dt);
    const renderStart = performance.now();
    this.render();
    const renderEnd = performance.now();

    const frameTime = renderEnd - updateStart;
    this.frameRenderTime = frameTime;
    if (frameTime > this.maxFrameRenderTime) {
      if (this.frameCount % 60 === 0) {
        console.warn(`[QuantumShift] Frame time exceeded ${this.maxFrameRenderTime}ms: ${frameTime.toFixed(2)}ms`);
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
  }
}
