import type { InputState, Particle } from '../types';
import { useGameStore } from '../store/gameStore';
import { EntityManager, spawnDebris, spawnEngineParticles, spawnLaserTrail, spawnVictoryParticles, generateStars } from './EntityManager';

const SCROLL_SPEED = 120;
const GRAVITY_PULL = 0.02;
const SHIP_COLLISION_RADIUS = 18;

export class GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId = 0;
  private lastTime = 0;
  private input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    shield: false,
  };
  private entityManager: EntityManager;
  private engineParticleTimer = 0;
  private laserTrailTimer = 0;
  private initialized = false;
  private cameraY = 0;

  constructor() {
    this.entityManager = new EntityManager();
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.setupInput();
    this.initialized = true;
  }

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private setupInput() {
    const keyMap: Record<string, keyof InputState> = {
      KeyW: 'up',
      KeyS: 'down',
      KeyA: 'left',
      KeyD: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      Space: 'shield',
    };

    window.addEventListener('keydown', (e) => {
      const key = keyMap[e.code];
      if (key) {
        e.preventDefault();
        this.input[key] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = keyMap[e.code];
      if (key) {
        this.input[key] = false;
      }
    });
  }

  start() {
    if (!this.initialized) return;
    const store = useGameStore.getState();
    const w = window.innerWidth;
    const h = window.innerHeight;
    useGameStore.setState({
      shipX: w / 2,
      shipY: 0,
      stars: generateStars(w, h),
    });
    this.cameraY = -h / 2 + 100;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.animFrameId);
  }

  reset() {
    const store = useGameStore.getState();
    store.reset();
    const w = window.innerWidth;
    const h = window.innerHeight;
    useGameStore.setState({
      shipX: w / 2,
      shipY: 0,
      stars: generateStars(w, h),
    });
    this.cameraY = -h / 2 + 100;
  }

  private loop = () => {
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastTime = now;

    this.update(dt);
    this.render();

    useGameStore.setState((s) => ({ frameCount: s.frameCount + 1 }));
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const state = useGameStore.getState();
    if (state.phase !== 'playing') return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    this.updateShip(dt, w, h);
    this.updateShield(dt);
    this.updateScroll(dt);
    this.updateDifficulty();
    this.checkCollisions(w, h);
    this.entityManager.update(dt, w, h);
    this.spawnEngineParticles(dt);
    this.spawnLaserTrails(dt);
    this.checkVictory(h);

    const sd = useGameStore.getState().shieldHit;
    if (sd.timer > 0) {
      useGameStore.setState({ shieldHit: { timer: sd.timer - dt } });
    }
    const dmg = useGameStore.getState().screenDamage;
    if (dmg.timer > 0) {
      useGameStore.setState({ screenDamage: { timer: dmg.timer - dt, lifeLost: dmg.lifeLost } });
    }
  }

  private updateShip(dt: number, w: number, h: number) {
    const state = useGameStore.getState();
    let { shipX, shipY, shipVx, shipVy } = state;
    const speed = state.shipSpeed;

    if (this.input.up) shipVy -= speed * dt;
    if (this.input.down) shipVy += speed * dt;
    if (this.input.left) shipVx -= speed * dt;
    if (this.input.right) shipVx += speed * dt;

    shipVx *= 0.92;
    shipVy *= 0.92;

    shipX += shipVx * dt;
    shipY += shipVy * dt;

    const margin = 30;
    shipX = Math.max(margin, Math.min(w - margin, shipX));

    const topBound = state.shipY - h * 0.3;
    const bottomBound = state.shipY + h * 0.3;
    shipY = Math.max(topBound, Math.min(bottomBound, shipY));

    this.handleGravityPull(dt);

    useGameStore.setState({ shipX, shipY, shipVx, shipVy });
  }

  private handleGravityPull(dt: number) {
    const state = useGameStore.getState();
    const { shipX, shipY, escapeProgress } = state;

    let inGravity = false;
    let escapeP = escapeProgress.progress;

    for (const gw of state.gravityWells) {
      const dx = gw.x - shipX;
      const dy = gw.y - shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < gw.radius + 50) {
        inGravity = true;
        const pull = GRAVITY_PULL * (1 - dist / (gw.radius + 50));
        const nx = dx / dist;
        const ny = dy / dist;
        const svx = state.shipVx + nx * pull * 60 * dt;
        const svy = state.shipVy + ny * pull * 60 * dt;
        useGameStore.setState({ shipVx: svx, shipVy: svy });

        if (this.input.up || this.input.down || this.input.left || this.input.right) {
          escapeP = Math.min(1, escapeP + dt * 0.3);
        }

        if (dist < 15) {
          this.onLifeLost();
          useGameStore.setState({
            shipY: shipY + 100,
            escapeProgress: { progress: 0, active: false },
          });
          return;
        }

        if (escapeP >= 1) {
          useGameStore.setState({
            energy: Math.min(state.maxEnergy, state.energy + 20),
            escapeProgress: { progress: 0, active: false },
          });
          useGameStore.getState().addEvent('Escaped gravity well! Energy +20', '#aa44ff');
          return;
        }

        useGameStore.setState({ escapeProgress: { progress: escapeP, active: true } });
        return;
      }
    }

    if (!inGravity && escapeProgress.active) {
      escapeP = Math.max(0, escapeP - dt * 0.5);
      useGameStore.setState({
        escapeProgress: { progress: escapeP, active: escapeP > 0 },
      });
    }
  }

  private updateShield(dt: number) {
    const state = useGameStore.getState();

    if (this.input.shield && !state.shieldActive && state.shieldCooldown <= 0 && state.energy >= 10) {
      useGameStore.setState({
        shieldActive: true,
        shieldDuration: state.shieldDurationMax,
        energy: state.energy - 10,
      });
      this.input.shield = false;
    }

    if (state.shieldActive) {
      const dur = state.shieldDuration - dt;
      if (dur <= 0) {
        useGameStore.setState({
          shieldActive: false,
          shieldDuration: 0,
          shieldCooldown: state.shieldCooldownMax,
        });
      } else {
        useGameStore.setState({ shieldDuration: dur });
      }
    }

    if (state.shieldCooldown > 0) {
      useGameStore.setState({ shieldCooldown: state.shieldCooldown - dt });
    }
  }

  private updateScroll(dt: number) {
    useGameStore.setState((s) => ({
      distance: s.distance + SCROLL_SPEED * dt,
    }));
  }

  private updateDifficulty() {
    const dist = useGameStore.getState().distance;
    const diff = Math.floor(dist / 1000) + 1;
    if (diff !== useGameStore.getState().difficulty) {
      useGameStore.setState({ difficulty: diff });
    }
  }

  private checkCollisions(w: number, h: number) {
    const state = useGameStore.getState();
    const { shipX, shipY, shieldActive } = state;

    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      const dx = a.x - shipX;
      const dy = a.y - shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < a.radius + SHIP_COLLISION_RADIUS) {
        if (shieldActive) {
          useGameStore.setState((s) => ({
            asteroids: s.asteroids.filter((x) => x.id !== a.id),
            shield: Math.max(0, s.shield - 15),
            shieldHit: { timer: 0.3 },
          }));
          useGameStore.getState().addEvent('Shield absorbed asteroid hit!', '#00ffaa');
          const deb = spawnDebris(a.x, a.y);
          useGameStore.setState((s) => ({ debris: [...s.debris, ...deb] }));
        } else {
          this.onHit(a.x, a.y);
          useGameStore.setState((s) => ({
            asteroids: s.asteroids.filter((x) => x.id !== a.id),
          }));
          const deb = spawnDebris(a.x, a.y);
          useGameStore.setState((s) => ({ debris: [...s.debris, ...deb] }));
        }
      }
    }

    for (let i = state.pirateLasers.length - 1; i >= 0; i--) {
      const l = state.pirateLasers[i];
      const dx = l.x - shipX;
      const dy = l.y - shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < SHIP_COLLISION_RADIUS + 5) {
        if (shieldActive) {
          useGameStore.setState((s) => ({
            pirateLasers: s.pirateLasers.filter((x) => x.id !== l.id),
            shield: Math.max(0, s.shield - 10),
            shieldHit: { timer: 0.2 },
          }));
          useGameStore.getState().addEvent('Shield blocked laser!', '#00ffaa');
        } else {
          this.onHit(l.x, l.y);
          useGameStore.setState((s) => ({
            pirateLasers: s.pirateLasers.filter((x) => x.id !== l.id),
          }));
        }
      }
    }

    for (let i = state.energyOrbs.length - 1; i >= 0; i--) {
      const orb = state.energyOrbs[i];
      const dx = orb.x - shipX;
      const dy = orb.y - shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < orb.radius + SHIP_COLLISION_RADIUS) {
        const newEnergy = Math.min(state.maxEnergy, state.energy + 30);
        useGameStore.setState((s) => ({
          energyOrbs: s.energyOrbs.filter((x) => x.id !== orb.id),
          energy: newEnergy,
        }));
        useGameStore.getState().addEvent('Energy orb collected! Energy +30%', '#ffcc00');
      }
    }
  }

  private onHit(_hx: number, _hy: number) {
    const state = useGameStore.getState();
    const newShield = Math.max(0, state.shield - 20);
    useGameStore.setState({ shield: newShield });
    state.damageCargo();
    useGameStore.getState().addEvent('Ship hit! Cargo damaged!', '#ff4444');

    if (newShield <= 0) {
      this.onLifeLost();
    }
  }

  private onLifeLost() {
    const state = useGameStore.getState();
    const newLives = state.lives - 1;
    useGameStore.setState({
      lives: newLives,
      shield: 100,
      screenDamage: { timer: 1, lifeLost: newLives },
    });
    useGameStore.getState().addEvent('Life lost!', '#ff0000');

    if (newLives <= 0) {
      useGameStore.setState({ phase: 'gameover' });
    }
  }

  private spawnEngineParticles(dt: number) {
    this.engineParticleTimer += dt;
    if (this.engineParticleTimer >= 0.05) {
      this.engineParticleTimer = 0;
      const state = useGameStore.getState();
      if (state.phase === 'playing') {
        const particles = spawnEngineParticles(
          state.shipX,
          state.shipY + 20,
          2,
          state.difficulty
        );
        this.entityManager.addParticles(particles);
      }
    }
  }

  private spawnLaserTrails(dt: number) {
    this.laserTrailTimer += dt;
    if (this.laserTrailTimer >= 0.05) {
      this.laserTrailTimer = 0;
      const state = useGameStore.getState();
      const trails: Particle[] = [];
      for (const l of state.pirateLasers) {
        trails.push(spawnLaserTrail(l.x, l.y));
      }
      if (trails.length > 0) {
        this.entityManager.addParticles(trails);
      }
    }
  }

  private checkVictory(_h: number) {
    const state = useGameStore.getState();
    if (state.distance >= state.maxDistance && state.phase === 'playing') {
      const totalIntegrity = state.cargo.reduce((sum, c) => sum + c.integrity, 0);
      const maxIntegrity = state.cargo.length * 100;
      const score = Math.round((totalIntegrity / maxIntegrity) * 1000);

      const w = window.innerWidth;
      const particles = spawnVictoryParticles(w / 2, window.innerHeight / 3);
      this.entityManager.addParticles(particles);

      useGameStore.setState({
        phase: 'victory',
        score,
      });
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const state = useGameStore.getState();

    const camY = state.shipY - h * 0.65;

    ctx.fillStyle = '#0B0D17';
    ctx.fillRect(0, 0, w, h);

    this.renderStars(ctx, w, h, state);
    ctx.save();
    ctx.translate(0, -camY);
    this.renderGravityWells(ctx, state);
    this.renderEnergyOrbs(ctx, state);
    this.renderAsteroids(ctx, state);
    this.renderDebris(ctx, state);
    this.renderPirates(ctx, state);
    this.renderLasers(ctx, state);
    this.renderParticles(ctx, state);
    this.renderShip(ctx, state);
    this.renderShield(ctx, state);
    this.renderFinishLine(ctx, state, w);
    ctx.restore();

    if (state.shieldHit.timer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${state.shieldHit.timer * 0.5})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (state.screenDamage.timer > 0) {
      this.renderScreenDamage(ctx, w, h, state.screenDamage.timer);
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D, _w: number, _h: number, state: ReturnType<typeof useGameStore.getState>) {
    const camY = state.shipY - window.innerHeight * 0.65;
    for (const star of state.stars) {
      const sy = star.y;
      const alpha = star.brightness * (0.5 + 0.5 * Math.sin(performance.now() / 1000 * star.twinkleSpeed + star.twinkleOffset));
      ctx.fillStyle = star.color + alpha.toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(star.x, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderAsteroids(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const a of state.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);

      if (a.type === 'moving') {
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = a.type === 'moving' ? '#6b3322' : '#3a3a4a';
      ctx.strokeStyle = a.type === 'moving' ? '#ff6644' : '#555566';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const v = a.vertices;
      ctx.moveTo(v[0], v[1]);
      for (let i = 1; i < v.length / 2; i++) {
        ctx.lineTo(v[i * 2], v[i * 2 + 1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private renderDebris(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const d of state.debris) {
      const alpha = d.life / d.maxLife;
      ctx.fillStyle = `rgba(100,100,120,${alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderPirates(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const p of state.pirates) {
      ctx.save();
      ctx.translate(p.x, p.y);

      const flash = Math.sin(performance.now() / 100) > 0 ? 0.8 : 1;
      ctx.fillStyle = `rgba(200,30,30,${flash})`;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(15, 10);
      ctx.lineTo(8, 5);
      ctx.lineTo(8, 15);
      ctx.lineTo(-8, 15);
      ctx.lineTo(-8, 5);
      ctx.lineTo(-15, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff8800';
      const engineFlash = 3 + Math.random() * 3;
      if (p.side === 'left') {
        ctx.fillRect(-3, 14, 6, engineFlash);
      } else {
        ctx.fillRect(-3, 14, 6, engineFlash);
      }

      ctx.restore();
    }
  }

  private renderLasers(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const l of state.pirateLasers) {
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 6;

      if (l.trail.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(l.trail[0].x, l.trail[0].y);
        for (let i = 1; i < l.trail.length; i++) {
          ctx.lineTo(l.trail[i].x, l.trail[i].y);
        }
        ctx.lineTo(l.x, l.y);
        ctx.stroke();
      }

      ctx.fillStyle = '#ff6666';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  private renderGravityWells(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const gw of state.gravityWells) {
      const gradient = ctx.createRadialGradient(gw.x, gw.y, 0, gw.x, gw.y, gw.radius);
      gradient.addColorStop(0, 'rgba(120,40,200,0.4)');
      gradient.addColorStop(0.5, 'rgba(80,20,160,0.2)');
      gradient.addColorStop(1, 'rgba(60,10,120,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(gw.x, gw.y, gw.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(150,60,255,${0.3 + 0.2 * Math.sin(gw.flowAngle)})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const startAngle = gw.flowAngle + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(gw.x, gw.y, gw.radius * (0.4 + i * 0.2), startAngle, startAngle + 1.2);
        ctx.stroke();
      }
    }
  }

  private renderEnergyOrbs(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const orb of state.energyOrbs) {
      const pulse = 0.7 + 0.3 * Math.sin(orb.pulse);
      const r = orb.radius * pulse;

      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 15;

      const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
      gradient.addColorStop(0, 'rgba(255,220,50,0.9)');
      gradient.addColorStop(0.6, 'rgba(255,180,0,0.6)');
      gradient.addColorStop(1, 'rgba(255,150,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    for (const p of state.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderShip(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    const { shipX: x, shipY: y } = state;
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#8899bb';
    ctx.strokeStyle = '#aabbdd';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-18, 8);
    ctx.lineTo(-14, 14);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-6, 18);
    ctx.lineTo(6, 18);
    ctx.lineTo(6, 10);
    ctx.lineTo(14, 14);
    ctx.lineTo(18, 8);
    ctx.lineTo(8, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderShield(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>) {
    if (!state.shieldActive) return;
    const { shipX: x, shipY: y, shield, shieldDuration, shieldDurationMax } = state;
    const alpha = 0.3 + 0.1 * Math.sin(performance.now() / 100);

    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(0,255,170,${alpha})`;
    ctx.lineWidth = 2;

    const radius = 30;
    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const nextAngle = ((i + 1) / sides) * Math.PI * 2 - Math.PI / 2;
      const midAngle = (angle + nextAngle) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(midAngle) * radius * 0.5, Math.sin(midAngle) * radius * 0.5);
      ctx.strokeStyle = `rgba(0,255,170,${alpha * 0.3})`;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderFinishLine(ctx: CanvasRenderingContext2D, state: ReturnType<typeof useGameStore.getState>, w: number) {
    const finishY = -state.maxDistance + SCROLL_SPEED * (state.maxDistance / SCROLL_SPEED);
    const realFinishY = -state.maxDistance;

    const camY = state.shipY - window.innerHeight * 0.65;
    const screenY = realFinishY - camY;
    if (screenY > -100 && screenY < window.innerHeight + 100) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
      ctx.strokeStyle = `rgba(0,255,170,${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, realFinishY, 50 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0,255,170,${0.3 + pulse * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, realFinishY, 70 + pulse * 15, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private renderScreenDamage(ctx: CanvasRenderingContext2D, w: number, h: number, timer: number) {
    const alpha = Math.min(timer, 0.5);
    ctx.strokeStyle = `rgba(200,50,30,${alpha})`;
    ctx.lineWidth = 3;

    const cx = 60;
    const cy = h - 80;
    const cracks = [
      [[0, 0], [20, -30], [35, -25]],
      [[0, 0], [-15, -35], [-5, -50]],
      [[0, 0], [25, 10], [40, 5]],
      [[0, 0], [-10, 20], [-30, 25]],
    ];

    for (const crack of cracks) {
      ctx.beginPath();
      ctx.moveTo(cx + crack[0][0], cy + crack[0][1]);
      for (let i = 1; i < crack.length; i++) {
        ctx.lineTo(cx + crack[i][0], cy + crack[i][1]);
      }
      ctx.stroke();
    }
  }
}
