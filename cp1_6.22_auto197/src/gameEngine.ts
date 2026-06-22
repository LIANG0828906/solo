import type { PlayerState, InputState, LevelData, RippleEffect, PressurePlate, Door, PushableBox } from './types';
import { updatePhysics } from './physics';
import { TimelineManager, CloneManager, type RewindResult } from './timeline';
import { GameRenderer } from './renderer';

export interface EngineState {
  player: PlayerState;
  lives: number;
  isRecording: boolean;
  hasRewound: boolean;
  isFlashing: boolean;
  completed: boolean;
  gameOver: boolean;
  plates: PressurePlate[];
  doors: Door[];
  boxes: PushableBox[];
}

const PLAYER_W = 28;
const PLAYER_H = 28;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  private timeline: TimelineManager;
  private cloneManager: CloneManager;
  private level: LevelData;

  private player: PlayerState;
  private input: InputState = { left: false, right: false, jump: false, jumpPressed: false };
  private prevJump: boolean = false;
  private lives: number = 3;
  private isRecording: boolean = false;
  private hasRewound: boolean = false;
  private isFlashing: boolean = false;
  private flashTimer: number = 0;
  private completed: boolean = false;
  private gameOver: boolean = false;
  private pulseTime: number = 0;
  private ripples: RippleEffect[] = [];
  private initialBoxes: PushableBox[];
  private initialPlates: PressurePlate[];
  private initialDoors: Door[];

  private rafId: number = 0;
  private lastTime: number = 0;
  private onStateChange?: (state: EngineState) => void;
  private onComplete?: () => void;
  private onGameOver?: () => void;
  private running: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    onStateChange?: (state: EngineState) => void,
    onComplete?: () => void,
    onGameOver?: () => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.renderer = new GameRenderer(ctx, level.width, level.height);
    this.timeline = new TimelineManager();
    this.cloneManager = new CloneManager();
    this.level = level;

    this.player = {
      x: level.spawn.x,
      y: level.spawn.y,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      onGround: false,
      facingRight: true
    };

    this.initialBoxes = level.boxes.map(b => ({ ...b }));
    this.initialPlates = level.plates.map(p => ({ ...p, activated: false }));
    this.initialDoors = level.doors.map(d => ({ ...d, open: false, timer: 0 }));

    this.onStateChange = onStateChange;
    this.onComplete = onComplete;
    this.onGameOver = onGameOver;

    this.resetLevel(false);
  }

  setInput(input: Partial<InputState>): void {
    this.input = { ...this.input, ...input };
  }

  toggleRecording(): void {
    if (this.completed || this.gameOver) return;
    if (!this.timeline.isRecording()) {
      this.timeline.startRecording(this.player);
      this.isRecording = true;
      this.hasRewound = false;
      this.cloneManager.resetClones();
    } else {
      const result = this.timeline.stopRecording();
      this.isRecording = false;
      if (result) {
        this.performRewind(result);
      }
    }
    this.emitState();
  }

  private performRewind(result: RewindResult): void {
    this.cloneManager.createClone(result);
    this.hasRewound = true;
    this.player = { ...result.startPlayerState };
    this.boxes = this.initialBoxes.map(b => ({ ...b }));
    this.plates = this.initialPlates.map(p => ({ ...p }));
    this.doors = this.initialDoors.map(d => ({ ...d }));
    this.addRipple(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
  }

  private addRipple(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 200,
      alpha: 1,
      duration: 0.5,
      elapsed: 0
    });
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange({
        player: { ...this.player },
        lives: this.lives,
        isRecording: this.isRecording,
        hasRewound: this.hasRewound,
        isFlashing: this.isFlashing,
        completed: this.completed,
        gameOver: this.gameOver,
        plates: this.plates.map(p => ({ ...p })),
        doors: this.doors.map(d => ({ ...d })),
        boxes: this.boxes.map(b => ({ ...b }))
      });
    }
  }

  get boxes(): PushableBox[] {
    return this.initialBoxes;
  }

  set boxes(b: PushableBox[]) {
    this.initialBoxes = b;
  }

  get plates(): PressurePlate[] {
    return this.initialPlates;
  }

  set plates(p: PressurePlate[]) {
    this.initialPlates = p;
  }

  get doors(): Door[] {
    return this.initialDoors;
  }

  set doors(d: Door[]) {
    this.initialDoors = d;
  }

  resetLevel(resetLives: boolean = true): void {
    this.player = {
      x: this.level.spawn.x,
      y: this.level.spawn.y,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      onGround: false,
      facingRight: true
    };
    this.boxes = this.level.boxes.map(b => ({ ...b }));
    this.plates = this.level.plates.map(p => ({ ...p, activated: false }));
    this.doors = this.level.doors.map(d => ({ ...d, open: false, timer: 0 }));
    this.cloneManager.resetClones();
    this.timeline = new TimelineManager();
    this.isRecording = false;
    this.hasRewound = false;
    this.completed = false;
    this.ripples = [];
    if (resetLives) {
      this.lives = 3;
    }
    this.gameOver = false;
    this.isFlashing = false;
    this.flashTimer = 0;
    this.emitState();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      if (!this.running) return;
      const dt = Math.min((time - this.lastTime) / 16.667, 2);
      this.lastTime = time;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private update(dt: number): void {
    if (this.completed || this.gameOver) {
      this.pulseTime += 0.016 * dt;
      this.updateRipples(dt);
      return;
    }

    this.input.jumpPressed = this.input.jump && !this.prevJump;
    this.prevJump = this.input.jump;

    const start = performance.now();

    const result = updatePhysics(
      this.player,
      this.input,
      this.level.platforms,
      this.plates,
      this.doors,
      this.boxes,
      this.level.goal,
      dt
    );

    const elapsed = performance.now() - start;
    if (elapsed > 5) {
      console.warn(`Physics took ${elapsed.toFixed(2)}ms`);
    }

    if (this.timeline.isRecording()) {
      this.timeline.recordFrame(this.input, this.player);
    }

    this.player = result.player;
    this.boxes = result.boxes;
    this.plates = result.plates;
    this.doors = result.doors;

    this.updateClones();

    if (result.hitSpike && !this.isFlashing) {
      this.handleDeath();
    }

    if (result.reachedGoal) {
      this.completed = true;
      this.addRipple(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);
      if (this.onComplete) {
        setTimeout(() => this.onComplete?.(), 800);
      }
    }

    if (this.isFlashing) {
      this.flashTimer -= 0.016 * dt;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
        this.flashTimer = 0;
        this.player = {
          x: this.level.spawn.x,
          y: this.level.spawn.y,
          vx: 0,
          vy: 0,
          w: PLAYER_W,
          h: PLAYER_H,
          onGround: false,
          facingRight: true
        };
      }
    }

    this.pulseTime += 0.016 * dt;
    this.updateRipples(dt);
    this.emitState();
  }

  private updateClones(): void {
    const clones = this.cloneManager.getAllClones();
    for (const clone of clones) {
      const frameData = this.cloneManager.getNextFrameData(clone.id);
      if (!frameData) continue;

      const newClone: PlayerState = { ...clone.playerState };
      newClone.vx = frameData.vx;
      newClone.vy = frameData.vy;

      if (frameData.vx > 0.1) newClone.facingRight = true;
      else if (frameData.vx < -0.1) newClone.facingRight = false;

      if (frameData.jumpPressed && newClone.onGround) {
        newClone.vy = -13;
        newClone.onGround = false;
      }

      newClone.vy += 0.6;
      if (newClone.vy > 15) newClone.vy = 15;

      const solids = this.getSolidsForClone();
      this.resolveCollisionForClone(newClone, solids);

      for (const plate of this.plates) {
        const cloneRect = { x: newClone.x, y: newClone.y, w: newClone.w, h: newClone.h };
        if (this.rectIntersect(cloneRect, plate)) {
          plate.activated = true;
        }
      }

      for (const door of this.doors) {
        let shouldOpen = false;
        for (const plate of this.plates) {
          if (plate.linkedDoorIds.includes(door.id) && plate.activated) {
            shouldOpen = true;
            if (door.isTimed) {
              door.timer = door.maxTimer;
            }
          }
        }
        if (door.isTimed && !shouldOpen && door.timer > 0) {
          shouldOpen = true;
          door.timer -= 1 / 60;
          if (door.timer < 0) door.timer = 0;
        }
        if (!door.isTimed) {
          door.open = door.open || shouldOpen;
        } else {
          door.open = shouldOpen;
        }
      }

      this.cloneManager.updateClone(clone.id, newClone);
    }

    for (const door of this.doors) {
      let anyPlateActive = false;
      for (const plate of this.plates) {
        if (plate.linkedDoorIds.includes(door.id) && plate.activated) {
          anyPlateActive = true;
          break;
        }
      }
      const playerRect = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };
      let playerOnPlate = false;
      for (const plate of this.plates) {
        if (plate.linkedDoorIds.includes(door.id) && this.rectIntersect(playerRect, plate)) {
          playerOnPlate = true;
          break;
        }
      }
      for (const box of this.boxes) {
        for (const plate of this.plates) {
          if (plate.linkedDoorIds.includes(door.id) && this.rectIntersect(box, plate)) {
            playerOnPlate = true;
            break;
          }
        }
      }

      if (door.isTimed) {
        if (anyPlateActive || playerOnPlate) {
          door.open = true;
          door.timer = door.maxTimer;
        } else if (door.timer > 0) {
          door.open = true;
          door.timer -= 1 / 60;
          if (door.timer < 0) {
            door.timer = 0;
            door.open = false;
          }
        } else {
          door.open = false;
        }
      } else {
        door.open = anyPlateActive || playerOnPlate;
      }
    }
  }

  private rectIntersect(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private getSolidsForClone(): { x: number; y: number; w: number; h: number }[] {
    const solids: { x: number; y: number; w: number; h: number }[] = [];
    for (const p of this.level.platforms) {
      if (p.type === 'solid') solids.push(p);
    }
    for (const d of this.doors) {
      if (!d.open) solids.push(d);
    }
    for (const b of this.boxes) solids.push(b);
    return solids;
  }

  private resolveCollisionForClone(
    obj: { x: number; y: number; w: number; h: number; vx: number; vy: number; onGround: boolean },
    solids: { x: number; y: number; w: number; h: number }[]
  ): void {
    obj.x += obj.vx;
    for (const solid of solids) {
      if (this.rectIntersect(obj, solid)) {
        if (obj.vx > 0) obj.x = solid.x - obj.w;
        else if (obj.vx < 0) obj.x = solid.x + solid.w;
        obj.vx = 0;
      }
    }
    obj.y += obj.vy;
    obj.onGround = false;
    for (const solid of solids) {
      if (this.rectIntersect(obj, solid)) {
        if (obj.vy > 0) {
          obj.y = solid.y - obj.h;
          obj.onGround = true;
        } else if (obj.vy < 0) {
          obj.y = solid.y + solid.h;
        }
        obj.vy = 0;
      }
    }
  }

  private updateRipples(dt: number): void {
    this.ripples = this.ripples.filter(r => {
      r.elapsed += 0.016 * dt;
      return r.elapsed < r.duration;
    });
  }

  private handleDeath(): void {
    this.lives--;
    this.isFlashing = true;
    this.flashTimer = 1.2;
    this.addRipple(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2);

    if (this.lives <= 0) {
      this.gameOver = true;
      setTimeout(() => this.onGameOver?.(), 1500);
    }
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawPlatforms(this.level.platforms);
    this.renderer.drawGoal(this.level.goal, (Math.sin(this.pulseTime * 3) + 1) / 2);
    this.renderer.drawPlates(this.plates);
    this.renderer.drawDoors(this.doors);
    this.renderer.drawBoxes(this.boxes);

    const clones = this.cloneManager.getAllClones();
    for (const clone of clones) {
      this.renderer.drawClone(clone.playerState);
    }

    this.renderer.drawPlayer(this.player, this.isFlashing, this.flashTimer);
    this.renderer.drawRipples(this.ripples);
    this.renderer.drawHUD(this.level.name, this.isRecording, this.hasRewound, this.lives);
    this.renderer.drawControlsHint();

    if (this.completed) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(26, 32, 44, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#F6E05E';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('关卡通过！', this.canvas.width / 2, this.canvas.height / 2 - 20);
      this.ctx.fillStyle = '#E2E8F0';
      this.ctx.font = '18px sans-serif';
      this.ctx.fillText('即将进入下一关...', this.canvas.width / 2, this.canvas.height / 2 + 30);
      this.ctx.restore();
    }

    if (this.gameOver) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(26, 32, 44, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#F56565';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 20);
      this.ctx.fillStyle = '#E2E8F0';
      this.ctx.font = '18px sans-serif';
      this.ctx.fillText('返回主菜单...', this.canvas.width / 2, this.canvas.height / 2 + 30);
      this.ctx.restore();
    }
  }
}
