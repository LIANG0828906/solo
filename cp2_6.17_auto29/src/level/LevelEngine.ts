import type {
  Entity,
  PlatformEntity,
  CrumblingEntity,
  SpikeEntity,
  DroneEntity,
  TurretEntity,
  BulletEntity,
  FragmentEntity,
  ExitEntity,
} from '../store/gameStore';
import { useGameStore } from '../store/gameStore';
import {
  buildDemoLevel,
  drawBackground,
  drawPlatform,
  drawCrumbling,
  drawSpike,
  drawDrone,
  drawTurret,
  drawBullet,
  drawFragment,
  drawExit,
  drawPlayer,
  drawChronoField,
  GRAVITY,
  PLAYER_W,
  PLAYER_H,
  MOVE_SPEED,
  CHRONO_RADIUS,
  type PlayerState,
} from './EntityFactory';
import { HUDManager } from '../ui/HUDManager';

const VIEW_W = 960;
const VIEW_H = 640;
const LEVEL_W = 2400;
const LEVEL_H = 800;

function aabb(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function distSq(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export class LevelEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  hud: HUDManager;
  running: boolean = false;
  rafId: number = 0;
  lastTime: number = 0;
  keys: Set<string> = new Set();
  time: number = 0;
  offscreen: HTMLCanvasElement;
  offCtx: CanvasRenderingContext2D;
  jumpQueued: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
    this.hud = new HUDManager(ctx);

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = VIEW_W;
    this.offscreen.height = VIEW_H;
    const offCtx = this.offscreen.getContext('2d');
    if (!offCtx) throw new Error('Offscreen canvas not supported');
    this.offCtx = offCtx;

    const demo = buildDemoLevel();
    useGameStore.setState((s) => ({ levels: [demo] }));

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy() {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const acceptKeys = new Set(['arrowleft', 'arrowright', 'arrowup', 'a', 'd', 'w', ' ', 'shift', 'space']);
    if (acceptKeys.has(k)) e.preventDefault();
    if (!this.keys.has(k)) {
      if (k === 'arrowup' || k === 'w' || k === ' ' || k === 'space') {
        this.jumpQueued = true;
      }
    }
    this.keys.add(k);
    if (k === 'shift') {
      useGameStore.getState().toggleChronoField(true);
    }
  };

  onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys.delete(k);
    if (k === 'shift') {
      useGameStore.getState().toggleChronoField(false);
    }
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(50, t - this.lastTime);
      this.lastTime = t;
      this.time += dt;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  update(dt: number) {
    const state = useGameStore.getState();
    if (state.currentScreen !== 'playing') return;

    state.updateState(dt);
    const s = useGameStore.getState();

    let inputVx = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) inputVx -= MOVE_SPEED;
    if (this.keys.has('arrowright') || this.keys.has('d')) inputVx += MOVE_SPEED;
    s.setPlayerInput(inputVx, this.jumpQueued);
    this.jumpQueued = false;

    const ps = { ...useGameStore.getState().player };
    ps.vy += GRAVITY * (dt / 1000);
    if (ps.invincible > 0) ps.invincible = Math.max(0, ps.invincible - dt);
    if (ps.onGround && Math.abs(ps.vx) > 5) {
      ps.animFrame += dt / 70;
    } else {
      ps.animFrame = 0;
    }

    const newEntities = s.entities.map((e) => ({ ...e })) as Entity[];

    const chronoActive = s.chronoField.active && !s.chronoField.cooldown;
    const chronoCX = ps.x + PLAYER_W / 2;
    const chronoCY = ps.y + PLAYER_H / 2;
    const chronoR2 = CHRONO_RADIUS * CHRONO_RADIUS;

    let newPlayerX = ps.x + ps.vx * (dt / 1000);
    let newPlayerY = ps.y + ps.vy * (dt / 1000);
    let newVy = ps.vy;
    let onGround = false;

    const solids: { x: number; y: number; w: number; h: number }[] = [];
    for (const e of newEntities) {
      if (e.type === 'platform') solids.push({ x: e.x, y: e.y, w: e.w, h: e.h });
      else if (e.type === 'crumbling') {
        const c = e as CrumblingEntity;
        if (c.visible || c.fadeTimer > 0) solids.push({ x: c.x, y: c.y, w: c.w, h: c.h });
      }
    }

    newPlayerX = Math.max(0, Math.min(LEVEL_W - PLAYER_W, newPlayerX));

    const playerRectX = { x: newPlayerX, y: ps.y, w: PLAYER_W, h: PLAYER_H };
    for (const solid of solids) {
      if (aabb(playerRectX, solid)) {
        if (ps.vx > 0) newPlayerX = solid.x - PLAYER_W;
        else if (ps.vx < 0) newPlayerX = solid.x + solid.w;
      }
    }

    const playerRectY = { x: newPlayerX, y: newPlayerY, w: PLAYER_W, h: PLAYER_H };
    for (const solid of solids) {
      if (aabb(playerRectY, solid)) {
        if (ps.vy > 0) {
          newPlayerY = solid.y - PLAYER_H;
          newVy = 0;
          onGround = true;
          for (const e of newEntities) {
            if (e.type === 'crumbling') {
              const c = e as CrumblingEntity;
              if (c.x === solid.x && c.y === solid.y && c.visible && !c.stepped) {
                c.stepped = true;
                c.stepTimer = 1500;
              }
            }
          }
        } else if (ps.vy < 0) {
          newPlayerY = solid.y + solid.h;
          newVy = 0;
        }
      }
    }

    if (newPlayerY > LEVEL_H) {
      ps.health = 0;
    }

    let playerRect = { x: newPlayerX, y: newPlayerY, w: PLAYER_W, h: PLAYER_H };

    for (let i = newEntities.length - 1; i >= 0; i--) {
      const e = newEntities[i];
      const chronoPause = chronoActive && e.affectedByChrono && distSq(e.x + e.w / 2, e.y + e.h / 2, chronoCX, chronoCY) < chronoR2;

      if (e.type === 'crumbling') {
        const c = e as CrumblingEntity;
        if (c.stepped && c.stepTimer > 0) {
          c.stepTimer -= dt;
          if (c.stepTimer <= 0) {
            c.fadeTimer = 300;
          }
        }
        if (c.fadeTimer > 0) {
          c.fadeTimer -= dt;
          if (c.fadeTimer <= 0) {
            c.visible = false;
            c.respawnTimer = 2500;
          }
        }
        if (!c.visible && c.respawnTimer > 0) {
          c.respawnTimer -= dt;
          if (c.respawnTimer <= 0) {
            c.visible = true;
            c.stepped = false;
            c.stepTimer = 0;
            c.fadeTimer = 0;
          }
        }
      } else if (e.type === 'spike') {
        const sp = e as SpikeEntity;
        sp.cycleTimer += dt;
        if (sp.phase === 'safe' && sp.cycleTimer >= 3000) {
          sp.phase = 'warn';
          sp.animTimer = 0;
          sp.cycleTimer = 0;
        } else if (sp.phase === 'warn') {
          sp.animTimer += dt;
          if (sp.animTimer >= 500) {
            sp.phase = 'danger';
            sp.animTimer = 0;
          }
        } else if (sp.phase === 'danger' && sp.cycleTimer >= 2000) {
          sp.phase = 'retract';
          sp.animTimer = 0;
          sp.cycleTimer = 0;
        } else if (sp.phase === 'retract') {
          sp.animTimer += dt;
          if (sp.animTimer >= 500) {
            sp.phase = 'safe';
            sp.animTimer = 0;
          }
        }
      } else if (e.type === 'drone' && !chronoPause) {
        const d = e as DroneEntity;
        d.animTimer += dt;
        d.x += d.direction * d.speed * (dt / 1000);
        if (d.x < d.patrolStart) {
          d.x = d.patrolStart;
          d.direction = 1;
        } else if (d.x > d.patrolEnd - d.w) {
          d.x = d.patrolEnd - d.w;
          d.direction = -1;
        }
      } else if (e.type === 'turret') {
        const t = e as TurretEntity;
        t.fireTimer += dt;
        if (t.fireTimer >= t.fireInterval) {
          t.fireTimer = 0;
          const bx = t.x + t.w / 2;
          const by = t.y + t.h - 14;
          let dir = -1;
          if (ps.x + PLAYER_W / 2 > bx) dir = 1;
          newEntities.push({
            id: `bullet_${Math.random().toString(36).slice(2, 8)}`,
            type: 'bullet',
            x: bx - 5,
            y: by - 3,
            w: 10,
            h: 6,
            vx: 200 * dir,
            vy: 0,
            life: 4000,
            affectedByChrono: false,
          } as BulletEntity);
        }
      } else if (e.type === 'bullet') {
        const b = e as BulletEntity;
        b.life -= dt;
        b.x += b.vx * (dt / 1000);
        b.y += b.vy * (dt / 1000);
        if (b.life <= 0 || b.x < -100 || b.x > LEVEL_W + 100 || b.y > LEVEL_H) {
          newEntities.splice(i, 1);
          continue;
        }
      } else if (e.type === 'fragment') {
        const f = e as FragmentEntity;
        f.pulseTimer += dt / 1000;
      }

      if (ps.invincible <= 0) {
        if (e.type === 'drone' && aabb(playerRect, e)) {
          ps.health = Math.max(0, ps.health - 1);
          ps.invincible = 1200;
          useGameStore.setState((st) => ({
            uiAnim: { ...st.uiAnim, healthFlash: 200, healthShake: 150 },
          }));
        } else if (e.type === 'bullet' && aabb(playerRect, e)) {
          ps.health = Math.max(0, ps.health - 1);
          ps.invincible = 1000;
          newEntities.splice(i, 1);
          useGameStore.setState((st) => ({
            uiAnim: { ...st.uiAnim, healthFlash: 200, healthShake: 150 },
          }));
        } else if (e.type === 'spike') {
          const sp = e as SpikeEntity;
          if (sp.phase === 'danger') {
            const hitRect = { x: sp.x, y: sp.y, w: sp.w, h: sp.h };
            if (aabb(playerRect, hitRect)) {
              ps.health = Math.max(0, ps.health - 1);
              ps.invincible = 1200;
              useGameStore.setState((st) => ({
                uiAnim: { ...st.uiAnim, healthFlash: 200, healthShake: 150 },
              }));
            }
          }
        }
      }

      if (e.type === 'fragment' && !e.collected && aabb(playerRect, e)) {
        (e as FragmentEntity).collected = true;
        useGameStore.setState((st) => ({ collectedFragments: st.collectedFragments + 1 }));
      }

      if (e.type === 'exit' && aabb(playerRect, e)) {
        useGameStore.getState().showResult();
      }
    }

    ps.x = newPlayerX;
    ps.y = newPlayerY;
    ps.vy = newVy;
    ps.onGround = onGround;
    ps.isJumping = !onGround;
    if (onGround) ps.vy = 0;

    if (ps.health <= 0) {
      setTimeout(() => useGameStore.getState().resetLevel(), 500);
      ps.health = 5;
      ps.invincible = 1500;
    }

    let camX = ps.x + PLAYER_W / 2 - VIEW_W / 2;
    camX = Math.max(0, Math.min(LEVEL_W - VIEW_W, camX));

    useGameStore.setState({
      player: ps,
      entities: newEntities,
      cameraX: camX,
    });
  }

  render() {
    const s = useGameStore.getState();
    const ctx = this.ctx;
    const camX = s.cameraX;

    if (s.currentScreen === 'playing' || s.currentScreen === 'result') {
      if (s.chronoField.active && !s.chronoField.cooldown) {
        const offCtx = this.offCtx;
        drawBackground(offCtx, camX, VIEW_W, VIEW_H, this.time);
        offCtx.save();
        offCtx.translate(-camX, 0);
        for (const e of s.entities) {
          if (e.type === 'platform') drawPlatform(offCtx, e);
          else if (e.type === 'crumbling') drawCrumbling(offCtx, e);
          else if (e.type === 'spike') drawSpike(offCtx, e);
          else if (e.type === 'exit') drawExit(offCtx, e, this.time);
          else if (e.type === 'fragment') drawFragment(offCtx, e, this.time);
        }
        offCtx.restore();
        const img = offCtx.getImageData(0, 0, VIEW_W, VIEW_H);
        this.distortImage(img, VIEW_W, VIEW_H, s.chronoPulseTime);
        ctx.putImageData(img, 0, 0);
        ctx.save();
        ctx.translate(-camX, 0);
      } else {
        drawBackground(ctx, camX, VIEW_W, VIEW_H, this.time);
        ctx.save();
        ctx.translate(-camX, 0);
        for (const e of s.entities) {
          if (e.type === 'platform') drawPlatform(ctx, e);
          else if (e.type === 'crumbling') drawCrumbling(ctx, e);
          else if (e.type === 'spike') drawSpike(ctx, e);
          else if (e.type === 'exit') drawExit(ctx, e, this.time);
          else if (e.type === 'fragment') drawFragment(ctx, e, this.time);
        }
      }

      const chronoActive = s.chronoField.active && !s.chronoField.cooldown;
      const pcx = s.player.x + PLAYER_W / 2;
      const pcy = s.player.y + PLAYER_H / 2;
      const cr2 = CHRONO_RADIUS * CHRONO_RADIUS;

      for (const e of s.entities) {
        if (e.type === 'drone') {
          const paused = chronoActive && distSq(e.x + e.w / 2, e.y + e.h / 2, pcx, pcy) < cr2;
          drawDrone(ctx, e, paused);
        } else if (e.type === 'turret') {
          drawTurret(ctx, e);
        } else if (e.type === 'bullet') {
          drawBullet(ctx, e);
        }
      }

      const pState: PlayerState = {
        x: s.player.x,
        y: s.player.y,
        w: PLAYER_W,
        h: PLAYER_H,
        vx: s.player.vx,
        vy: s.player.vy,
        facing: s.player.facing,
        isJumping: s.player.isJumping,
        onGround: s.player.onGround,
        animFrame: s.player.animFrame,
        health: s.player.health,
        invincible: s.player.invincible,
      };
      drawPlayer(ctx, pState);

      if (chronoActive) {
        drawChronoField(ctx, pcx, pcy, s.chronoPulseTime);
      }

      ctx.restore();

      this.hud.render({
        health: s.player.health,
        maxHealth: s.player.maxHealth,
        energy: s.chronoField.energy,
        maxEnergy: s.chronoField.maxEnergy,
        cooldown: s.chronoField.cooldown,
        cooldownProgress: s.chronoField.cooldown ? s.chronoField.cooldownTimer / 2000 : 0,
        fragments: s.collectedFragments,
        totalFragments: s.totalFragmentsInLevel,
        healthFlash: s.uiAnim.healthFlash,
        healthShake: s.uiAnim.healthShake,
        energyShake: s.uiAnim.energyShake,
        viewW: VIEW_W,
        viewH: VIEW_H,
        time: this.time,
      });
    }
  }

  distortImage(img: ImageData, W: number, H: number, pulse: number) {
    const data = img.data;
    const copy = new Uint8ClampedArray(data);
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) * 0.6;
    const strength = 8 + Math.sin(pulse * Math.PI * 2) * 3;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxR) {
          const t = 1 - dist / maxR;
          const factor = t * t * strength;
          const angle = Math.atan2(dy, dx);
          const srcX = Math.round(x - Math.cos(angle) * factor);
          const srcY = Math.round(y - Math.sin(angle) * factor);
          if (srcX >= 0 && srcX < W && srcY >= 0 && srcY < H) {
            const dstI = (y * W + x) * 4;
            const srcI = (srcY * W + srcX) * 4;
            data[dstI] = copy[srcI];
            data[dstI + 1] = copy[srcI + 1];
            data[dstI + 2] = copy[srcI + 2];
            data[dstI + 3] = copy[srcI + 3];
          }
        }
      }
    }
  }
}
