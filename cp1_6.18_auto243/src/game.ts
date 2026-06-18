import { Ship, ShipType, Team, Bullet, Particle, Debris } from './ship';
import { Renderer } from './renderer';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private playerShips: Ship[] = [];
  private aiShips: Ship[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private debris: Debris[] = [];
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private elapsed: number = 0;
  private running: boolean = false;
  private gameOver: boolean = false;

  private selecting: boolean = false;
  private selStartX: number = 0;
  private selStartY: number = 0;
  private selEndX: number = 0;
  private selEndY: number = 0;

  private selCountEl: HTMLElement;
  private playerHpEl: HTMLElement;
  private aiHpEl: HTMLElement;
  private timerEl: HTMLElement;
  private resultPanel: HTMLElement;
  private resultTitle: HTMLElement;
  private resultPlayer: HTMLElement;
  private resultAi: HTMLElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx, canvas.width, canvas.height);

    this.selCountEl = document.getElementById('sel-count')!;
    this.playerHpEl = document.getElementById('player-hp')!;
    this.aiHpEl = document.getElementById('ai-hp')!;
    this.timerEl = document.getElementById('timer')!;
    this.resultPanel = document.getElementById('result-panel')!;
    this.resultTitle = document.getElementById('result-title')!;
    this.resultPlayer = document.getElementById('result-player')!;
    this.resultAi = document.getElementById('result-ai')!;

    this.bindEvents();
    this.resetGame();
  }

  private resetGame() {
    Ship.resetIdCounter();
    this.playerShips = [];
    this.aiShips = [];
    this.bullets = [];
    this.particles = [];
    this.debris = [];
    this.elapsed = 0;
    this.gameOver = false;
    this.resultPanel.style.display = 'none';

    this.createFleet(Team.Player, 80, (i: number) => ({
      type: [ShipType.Assault, ShipType.Frigate, ShipType.Artillery][i % 3],
      x: 100 + (i % 4) * 80,
      y: 200 + Math.floor(i / 4) * 100,
    }));

    this.createFleet(Team.AI, 80, (i: number) => ({
      type: [ShipType.Assault, ShipType.Frigate, ShipType.Artillery][i % 3],
      x: 1200 - 100 - (i % 4) * 80,
      y: 200 + Math.floor(i / 4) * 100,
    }));
  }

  private createFleet(team: Team, _unused: number, configFn: (i: number) => { type: ShipType; x: number; y: number }) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const cfg = configFn(i);
      const ship = new Ship({ type: cfg.type, team, x: cfg.x, y: cfg.y });
      if (team === Team.Player) {
        this.playerShips.push(ship);
      } else {
        this.aiShips.push(ship);
      }
    }
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.getElementById('reset-btn')!.addEventListener('click', () => {
      this.resetGame();
    });
    document.getElementById('restart-btn')!.addEventListener('click', () => {
      this.resetGame();
    });
  }

  private getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      const pos = this.getCanvasPos(e);
      this.selecting = true;
      this.selStartX = pos.x;
      this.selStartY = pos.y;
      this.selEndX = pos.x;
      this.selEndY = pos.y;
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.selecting) {
      const pos = this.getCanvasPos(e);
      this.selEndX = pos.x;
      this.selEndY = pos.y;
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0 && this.selecting) {
      this.selecting = false;
      const left = Math.min(this.selStartX, this.selEndX);
      const right = Math.max(this.selStartX, this.selEndX);
      const top = Math.min(this.selStartY, this.selEndY);
      const bottom = Math.max(this.selStartY, this.selEndY);

      const isDrag = (right - left) > 5 || (bottom - top) > 5;

      for (const ship of this.playerShips) {
        if (!ship.alive) continue;
        if (isDrag) {
          ship.selected = ship.x >= left && ship.x <= right && ship.y >= top && ship.y <= bottom;
        } else {
          const dx = ship.x - this.selStartX;
          const dy = ship.y - this.selStartY;
          ship.selected = Math.sqrt(dx * dx + dy * dy) < ship.size + 5;
        }
      }
    } else if (e.button === 2) {
      e.preventDefault();
      const pos = this.getCanvasPos(e);
      const selectedShips = this.playerShips.filter(s => s.selected && s.alive);
      if (selectedShips.length === 0) return;

      let clickedEnemy: Ship | null = null;
      for (const s of this.aiShips) {
        if (!s.alive) continue;
        const dx = s.x - pos.x;
        const dy = s.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < s.size + 8) {
          clickedEnemy = s;
          break;
        }
      }

      for (const ship of selectedShips) {
        if (clickedEnemy) {
          ship.attackTarget(clickedEnemy.id);
        } else {
          const offset = selectedShips.indexOf(ship);
          const row = Math.floor(offset / 4);
          const col = offset % 4;
          ship.moveTo(pos.x + (col - 1.5) * 30, pos.y + row * 30);
        }
      }
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (!this.gameOver) {
      this.update(dt);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsed += dt;

    const allPlayerAlive = this.playerShips.filter(s => s.alive);
    const allAiAlive = this.aiShips.filter(s => s.alive);

    for (const ship of allPlayerAlive) {
      ship.update(dt, this.aiShips, this.bullets, this.particles, this.debris);
    }
    for (const ship of allAiAlive) {
      ship.update(dt, this.playerShips, this.bullets, this.particles, this.debris);
    }

    this.updateBullets(dt);
    this.updateParticles(dt);
    this.updateDebris(dt);

    const playerAlive = this.playerShips.filter(s => s.alive).length;
    const aiAlive = this.aiShips.filter(s => s.alive).length;

    if (playerAlive === 0 || aiAlive === 0) {
      this.gameOver = true;
      this.showResult(playerAlive, aiAlive);
    }

    this.updateUI();
  }

  private updateBullets(dt: number) {
    const allShips = [...this.playerShips, ...this.aiShips];
    const shipMap = new Map<number, Ship>();
    for (const s of allShips) shipMap.set(s.id, s);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const target = shipMap.get(b.targetShipId);
      if (target && target.alive) {
        const dx = target.x - b.x;
        const dy = target.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < target.size + 3) {
          target.takeDamage(b.damage);
          this.spawnHitParticles(target.x, target.y);
          if (!target.alive) {
            this.spawnDebris(target);
          }
          this.bullets.splice(i, 1);
          continue;
        }
      }

      if (b.x < -20 || b.x > 1220 || b.y < -20 || b.y > 820) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (target && !target.alive) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private spawnHitParticles(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.1,
        maxLife: 0.1,
        length: 8,
        color: '#fff',
      });
    }
  }

  private spawnDebris(ship: Ship) {
    const poly = ship.getPolygon();
    for (let i = 0; i < poly.length; i++) {
      const next = poly[(i + 1) % poly.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.debris.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        alpha: 1,
        points: [
          [poly[i][0], poly[i][1]],
          [next[0], next[1]],
          [(poly[i][0] + next[0]) / 2 + (Math.random() - 0.5) * 6, (poly[i][1] + next[1]) / 2 + (Math.random() - 0.5) * 6],
        ],
        color: ship.color,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 6,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateDebris(dt: number) {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rotation += d.rotationSpeed * dt;
      d.life -= dt;
      d.alpha = d.life / d.maxLife;
      if (d.life <= 0) {
        this.debris.splice(i, 1);
      }
    }
  }

  private updateUI() {
    const selCount = this.playerShips.filter(s => s.selected && s.alive).length;
    this.selCountEl.textContent = String(selCount);

    const playerTotalHp = this.playerShips.reduce((sum, s) => sum + (s.alive ? s.hp : 0), 0);
    const playerMaxHp = this.playerShips.reduce((sum, s) => sum + s.maxHp, 0);
    this.playerHpEl.textContent = `${Math.round(playerTotalHp)} / ${playerMaxHp}`;

    const aiTotalHp = this.aiShips.reduce((sum, s) => sum + (s.alive ? s.hp : 0), 0);
    const aiMaxHp = this.aiShips.reduce((sum, s) => sum + s.maxHp, 0);
    this.aiHpEl.textContent = `${Math.round(aiTotalHp)} / ${aiMaxHp}`;

    const mins = Math.floor(this.elapsed / 60);
    const secs = Math.floor(this.elapsed % 60);
    this.timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private showResult(playerAlive: number, aiAlive: number) {
    const playerWon = playerAlive > 0;
    this.resultTitle.textContent = playerWon ? '🎉 胜利！' : '💀 失败！';
    this.resultPlayer.textContent = `玩家存活舰数: ${playerAlive}`;
    this.resultAi.textContent = `AI存活舰数: ${aiAlive}`;
    this.resultPanel.style.display = 'block';
  }

  private render() {
    const r = this.renderer;
    r.clear();
    r.drawStars();

    for (const ship of this.playerShips) r.drawShip(ship);
    for (const ship of this.aiShips) r.drawShip(ship);

    r.drawBullets(this.bullets);
    r.drawParticles(this.particles);
    r.drawDebris(this.debris);

    if (this.selecting) {
      r.drawSelectionRect(this.selStartX, this.selStartY, this.selEndX, this.selEndY);
    }
  }
}
