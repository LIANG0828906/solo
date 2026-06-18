import type { GameLogic } from './GameLogic.js';
import type { WeaponType } from './MazeGenerator.js';

interface Layout {
  gameX: number;
  gameY: number;
  gameW: number;
  gameH: number;
  leftPanelX: number;
  leftPanelW: number;
  rightPanelX: number;
  rightPanelW: number;
  viewScale: number;
  cameraOffsetX: number;
  cameraOffsetY: number;
  uiScale: number;
  isMobile: boolean;
}

interface JoystickState {
  active: boolean;
  baseX: number;
  baseY: number;
  stickX: number;
  stickY: number;
  dx: number;
  dy: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logic: GameLogic;
  private width: number = 0;
  private height: number = 0;
  private time: number = 0;
  joystick: JoystickState = {
    active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, dx: 0, dy: 0
  };

  constructor(canvas: HTMLCanvasElement, logic: GameLogic) {
    this.canvas = canvas;
    const c = canvas.getContext('2d');
    if (!c) throw new Error('No 2D context');
    this.ctx = c;
    this.logic = logic;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupMobileInput();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupMobileInput(): void {
    const isTouch = 'ontouchstart' in window;
    if (!isTouch) return;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < this.width / 2) {
          this.joystick.active = true;
          this.joystick.baseX = t.clientX;
          this.joystick.baseY = t.clientY;
          this.joystick.stickX = t.clientX;
          this.joystick.stickY = t.clientY;
          break;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (this.joystick.active && t.clientX < this.width / 2) {
          const dx = t.clientX - this.joystick.baseX;
          const dy = t.clientY - this.joystick.baseY;
          const d = Math.sqrt(dx * dx + dy * dy);
          const max = 40;
          if (d > max) {
            this.joystick.stickX = this.joystick.baseX + (dx / d) * max;
            this.joystick.stickY = this.joystick.baseY + (dy / d) * max;
            this.joystick.dx = dx / d;
            this.joystick.dy = dy / d;
          } else {
            this.joystick.stickX = t.clientX;
            this.joystick.stickY = t.clientY;
            this.joystick.dx = dx / max;
            this.joystick.dy = dy / max;
          }
        }
      }
    }, { passive: false });

    const endJoy = (e: TouchEvent) => {
      e.preventDefault();
      if (this.joystick.active) {
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
      }
    };
    this.canvas.addEventListener('touchend', endJoy, { passive: false });
    this.canvas.addEventListener('touchcancel', endJoy, { passive: false });
  }

  render(deltaTime: number): void {
    this.time += deltaTime;
    const layout = this.calculateLayout();

    this.ctx.fillStyle = '#0D001A';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawPanels(layout);
    this.drawGameArea(layout);
    this.drawTopBar(layout);
    this.drawMiniMap(layout);
    this.drawEquipmentBar(layout);
    this.drawCenterInfo(layout);

    if (layout.isMobile && this.joystick.active) {
      this.drawJoystick();
    } else if (layout.isMobile) {
      this.drawMobileButtons();
    }

    if (this.logic.inventoryOpen) {
      this.drawInventory();
    }

    if (this.logic.gameState === 'win') {
      this.drawOverlay('胜利！', '你成功逃出了地牢', '#D4AF37');
    } else if (this.logic.gameState === 'dead') {
      this.drawOverlay('你倒下了...', '地牢吞噬了你', '#8B0000');
    }
  }

  private calculateLayout(): Layout {
    const isMobile = 'ontouchstart' in window || this.width < 800;
    const uiScale = isMobile ? Math.min(this.width, this.height) / 800 : 1;

    const totalW = this.width;
    const totalH = this.height;
    const leftW = Math.floor(totalW * 0.15);
    const rightW = Math.floor(totalW * 0.15);
    const gameW = totalW - leftW - rightW;
    const gameH = totalH;
    const gameX = leftW;
    const gameY = 0;

    const maze = this.logic.maze;
    const scaleX = (gameW * 0.95) / maze.width;
    const scaleY = (gameH * 0.9) / maze.height;
    const viewScale = Math.min(scaleX, scaleY, 1.5);

    const visibleW = maze.width * viewScale;
    const visibleH = maze.height * viewScale;
    const playerCX = this.logic.player.x + this.logic.player.size / 2;
    const playerCY = this.logic.player.y + this.logic.player.size / 2;

    let camX = playerCX * viewScale - gameW / 2;
    let camY = playerCY * viewScale - gameH / 2;
    camX = Math.max(0, Math.min(camX, visibleW - gameW));
    camY = Math.max(0, Math.min(camY, visibleH - gameH));
    if (visibleW < gameW) camX = (visibleW - gameW) / 2;
    if (visibleH < gameH) camY = (visibleH - gameH) / 2;

    return {
      gameX, gameY, gameW, gameH,
      leftPanelX: 0, leftPanelW: leftW,
      rightPanelX: leftW + gameW, rightPanelW: rightW,
      viewScale, cameraOffsetX: -camX, cameraOffsetY: -camY,
      uiScale, isMobile
    };
  }

  private drawBackground(): void {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#1A0A2E');
    grad.addColorStop(1, '#0D001A');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawPanels(l: Layout): void {
    this.drawGothicPanel(l.leftPanelX, 0, l.leftPanelW, l.gameH);
    this.drawGothicPanel(l.rightPanelX, 0, l.rightPanelW, l.gameH);
  }

  private drawGothicPanel(x: number, y: number, w: number, h: number): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(13, 0, 26, 0.9)';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.strokeStyle = '#D4AF37';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#D4AF37';
    this.ctx.shadowBlur = 8;
    this.ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    this.ctx.restore();
  }

  private drawGameArea(l: Layout): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(l.gameX, l.gameY, l.gameW, l.gameH);
    ctx.clip();

    const maze = this.logic.maze;
    const s = l.viewScale;
    const ox = l.gameX + l.cameraOffsetX;
    const oy = l.gameY + l.cameraOffsetY;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);

    ctx.fillStyle = '#0D001A';
    ctx.fillRect(0, 0, maze.width, maze.height);

    ctx.fillStyle = '#2A1844';
    for (const r of maze.rooms) {
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
    for (const c of maze.corridors) {
      ctx.fillRect(c.x, c.y, c.width, c.height);
    }

    ctx.fillStyle = '#4A3060';
    for (const r of maze.rooms) {
      ctx.fillRect(r.x + 2, r.y + 2, r.width - 4, 3);
      ctx.fillRect(r.x + 2, r.y + r.height - 5, r.width - 4, 3);
    }

    for (const w of maze.walls) {
      ctx.fillStyle = '#3D2055';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#5A3070';
      ctx.fillRect(w.x, w.y, w.w, 1);
    }

    this.drawExit(maze.exitPos.x, maze.exitPos.y);

    for (const chest of maze.chests) {
      if (!chest.opened) this.drawChest(chest.x, chest.y);
      else this.drawOpenedChest(chest.x, chest.y);
    }

    for (const pickup of this.logic.pickups) {
      if (pickup.type === 'health') this.drawHealthPickup(pickup.x, pickup.y, pickup.pulsePhase);
      else this.drawKeyPickup(pickup.x, pickup.y, pickup.pulsePhase);
    }

    for (const aura of this.logic.getSlowAuras()) {
      this.drawSlowAura(aura.x, aura.y, aura.radius, aura.duration);
    }

    for (const enemy of this.logic.enemyAI.enemies) {
      if (enemy.alive) this.drawEnemy(enemy.x, enemy.y, enemy.state);
    }

    for (const proj of this.logic.getProjectiles()) {
      this.drawProjectile(proj.x, proj.y);
    }

    this.drawPlayer();

    for (const anim of this.logic.feedbackAnims) {
      this.drawFeedbackAnim(anim.x, anim.y, anim.elapsed, anim.duration, anim.type);
    }

    ctx.restore();
    ctx.restore();
  }

  private drawExit(x: number, y: number): void {
    const ctx = this.ctx;
    const pulse = (Math.sin(this.time * 0.005) + 1) / 2;
    const w = 18, h = 30;
    ctx.save();
    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 10 + pulse * 15;
    ctx.fillStyle = this.logic.exitUnlocked ? '#FFD700' : `rgba(212, 175, 55, ${0.5 + pulse * 0.4})`;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6);
    if (!this.logic.exitUnlocked) {
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(x + 3, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawChest(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, 20, 20);
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, y, 20, 6);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, 18, 18);
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(x + 8, y + 8, 4, 5);
    ctx.restore();
  }

  private drawOpenedChest(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#5C3317';
    ctx.fillRect(x, y + 6, 20, 14);
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + 2, y + 8, 16, 10);
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, y, 20, 4);
    ctx.restore();
  }

  private drawHealthPickup(x: number, y: number, phase: number): void {
    const ctx = this.ctx;
    const scale = 1 + Math.sin(phase) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#00FF00';
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 8;
    ctx.fillRect(-5, -2, 10, 4);
    ctx.fillRect(-2, -5, 4, 10);
    ctx.restore();
  }

  private drawKeyPickup(x: number, y: number, phase: number): void {
    const ctx = this.ctx;
    const scale = 1 + Math.sin(phase) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(phase * 0.5);
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? 6 : 3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawSlowAura(x: number, y: number, r: number, dur: number): void {
    const ctx = this.ctx;
    const alpha = Math.min(1, dur / 1000) * 0.3;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(138, 43, 226, ${alpha + 0.2})`);
    grad.addColorStop(0.7, `rgba(75, 0, 130, ${alpha})`);
    grad.addColorStop(1, `rgba(75, 0, 130, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(186, 85, 211, ${alpha + 0.3})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawEnemy(x: number, y: number, state: string): void {
    const ctx = this.ctx;
    const cx = x + 10, cy = y + 10;
    ctx.save();
    ctx.fillStyle = state === 'chase' ? '#FF2020' : '#CC0000';
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = state === 'chase' ? 10 : 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx - 9, cy + 7);
    ctx.lineTo(cx + 9, cy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 3, cy - 2, 2, 2);
    ctx.fillRect(cx + 1, cy - 2, 2, 2);
    ctx.restore();
  }

  private drawProjectile(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFA500';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlayer(): void {
    const ctx = this.ctx;
    const p = this.logic.player;
    const cx = p.x + p.size / 2;
    const cy = p.y + p.size / 2;
    const breathing = 0.85 + Math.sin(this.time * 0.004) * 0.15;
    const flashing = p.invincible && Math.floor(this.time / 80) % 2 === 0;

    ctx.save();
    if (p.shieldTimer > 0) {
      const shieldAlpha = 0.3 + Math.sin(this.time * 0.01) * 0.1;
      ctx.strokeStyle = `rgba(100, 149, 237, ${shieldAlpha + 0.3})`;
      ctx.fillStyle = `rgba(100, 149, 237, ${shieldAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, p.size / 2 + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const glowR = p.size / 2 + 6 + breathing * 3;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowR);
    grad.addColorStop(0, `rgba(255,255,255,${flashing ? 0.9 : 0.7})`);
    grad.addColorStop(0.5, 'rgba(173, 216, 230, 0.35)');
    grad.addColorStop(1, 'rgba(173, 216, 230, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flashing ? '#88CCFF' : '#2196F3';
    ctx.shadowColor = '#4FC3F7';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, p.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.logic.swordAttackActive) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 12;
      const ax = cx + p.facingX * 30;
      const ay = cy + p.facingY * 30;
      ctx.beginPath();
      ctx.arc(ax, ay, 35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawFeedbackAnim(x: number, y: number, elapsed: number, duration: number, type: string): void {
    const ctx = this.ctx;
    const t = elapsed / duration;
    const scale = 1 + t * 0.8;
    const alpha = 1 - t;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (type === 'pickup') {
      ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'attack') {
      ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'open') {
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'hit') {
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawTopBar(l: Layout): void {
    const ctx = this.ctx;
    const p = this.logic.player;
    const barW = 200 * l.uiScale;
    const barH = 16 * l.uiScale;
    const x = l.gameX + 20;
    const y = l.gameY + 20;

    ctx.save();
    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 2, y - 2, barW + 4, barH + 4);
    ctx.restore();

    ctx.fillStyle = '#1A0A2E';
    ctx.fillRect(x, y, barW, barH);
    const ratio = Math.max(0, p.hp / p.maxHp);
    const grad = ctx.createLinearGradient(x, y, x + barW * ratio, y);
    grad.addColorStop(0, '#004400');
    grad.addColorStop(0.5, '#00AA00');
    grad.addColorStop(1, '#44FF44');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW * ratio, barH);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(12 * l.uiScale)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${p.hp}/${p.maxHp}`, x + barW / 2, y + barH - 3);
    ctx.restore();
  }

  private drawMiniMap(l: Layout): void {
    const ctx = this.ctx;
    const size = 150 * l.uiScale;
    const x = l.rightPanelX + (l.rightPanelW - size) / 2;
    const y = l.gameY + 20;
    if (l.rightPanelW < size + 10) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(x, y, size, size);
    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.restore();

    const maze = this.logic.maze;
    const sx = (size - 10) / maze.width;
    const sy = (size - 10) / maze.height;
    const ox = x + 5;
    const oy = y + 5;

    ctx.fillStyle = '#4A3060';
    for (const r of maze.rooms) {
      ctx.fillRect(ox + r.x * sx, oy + r.y * sy, r.width * sx, r.height * sy);
    }
    ctx.fillStyle = '#3A2050';
    for (const c of maze.corridors) {
      ctx.fillRect(ox + c.x * sx, oy + c.y * sy, Math.max(1, c.width * sx), Math.max(1, c.height * sy));
    }

    for (const chest of maze.chests) {
      if (chest.opened) continue;
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(ox + (chest.x + 10) * sx - 2, oy + (chest.y + 10) * sy - 2, 3, 3);
    }
    for (const e of this.logic.enemyAI.enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = '#FF3030';
      ctx.fillRect(ox + (e.x + 10) * sx - 2, oy + (e.y + 10) * sy - 2, 3, 3);
    }
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(ox + maze.exitPos.x * sx - 2, oy + maze.exitPos.y * sy - 2, 4, 4);

    ctx.fillStyle = '#4FC3F7';
    ctx.shadowColor = '#4FC3F7';
    ctx.shadowBlur = 4;
    const pcx = this.logic.player.x + this.logic.player.size / 2;
    const pcy = this.logic.player.y + this.logic.player.size / 2;
    ctx.beginPath();
    ctx.arc(ox + pcx * sx, oy + pcy * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawEquipmentBar(l: Layout): void {
    const ctx = this.ctx;
    const size = 32 * l.uiScale;
    const x = l.rightPanelX + (l.rightPanelW - size) / 2;
    const y = l.gameY + 150 * l.uiScale + 20;
    if (l.rightPanelW < size + 20) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, size + 6, size + 6);
    ctx.restore();

    if (this.logic.currentWeapon) {
      const inv = this.logic.inventory.get(this.logic.currentWeapon);
      const cdRatio = inv && inv.cooldown > 0 ? Math.min(1, inv.cooldown / 2000) : 0;
      this.drawWeaponIcon(this.logic.currentWeapon, x, y, size, cdRatio);

      ctx.save();
      ctx.fillStyle = '#D4AF37';
      ctx.font = `bold ${Math.floor(10 * l.uiScale)}px serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`x${inv?.count ?? 0}`, x + size - 2, y + size + 14);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#555';
      ctx.font = `bold ${Math.floor(10 * l.uiScale)}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('无武器', x + size / 2, y + size / 2 + 4);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(10 * l.uiScale)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('当前武器', x + size / 2, y - 8);
    ctx.restore();
  }

  private drawWeaponIcon(type: WeaponType, x: number, y: number, size: number, cdRatio: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#2A1844';
    ctx.fillRect(x, y, size, size);

    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.lineWidth = 2;

    if (type === 'sword') {
      ctx.strokeStyle = '#C0C0C0';
      ctx.fillStyle = '#E8E8E8';
      ctx.beginPath();
      ctx.moveTo(cx, y + 4);
      ctx.lineTo(cx - 3, cy + 4);
      ctx.lineTo(cx + 3, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy + 4);
      ctx.lineTo(cx + 7, cy + 4);
      ctx.stroke();
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(cx - 2, cy + 5, 4, size - cy - y - 4);
    } else if (type === 'bow') {
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - 2, cy, size / 3, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 2 + Math.cos(-Math.PI / 2.2) * size / 3, cy + Math.sin(-Math.PI / 2.2) * size / 3);
      ctx.lineTo(cx - 2 + Math.cos(Math.PI / 2.2) * size / 3, cy + Math.sin(Math.PI / 2.2) * size / 3);
      ctx.stroke();
      ctx.strokeStyle = '#C0C0C0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx + size / 2 - 2, cy);
      ctx.stroke();
    } else if (type === 'staff') {
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + size / 4, y + size - 4);
      ctx.lineTo(cx - size / 6, y + 8);
      ctx.stroke();
      const gx = cx - size / 6;
      const gy = y + 6;
      ctx.fillStyle = '#9932CC';
      ctx.shadowColor = '#9932CC';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(gx, gy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DDA0DD';
      ctx.beginPath();
      ctx.arc(gx - 1, gy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'shield') {
      ctx.fillStyle = '#6495ED';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#6495ED';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(cx, y + 4);
      ctx.lineTo(cx + size / 3, y + 8);
      ctx.lineTo(cx + size / 3 - 2, cy + 4);
      ctx.lineTo(cx, y + size - 4);
      ctx.lineTo(cx - size / 3 + 2, cy + 4);
      ctx.lineTo(cx - size / 3, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(cx, y + 8);
      ctx.lineTo(cx, cy + 2);
      ctx.moveTo(cx - 5, cy - 4);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.stroke();
    }

    if (cdRatio > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(50, 50, 50, 0.7)`;
      ctx.fillRect(x, y, size, size * cdRatio);
      ctx.translate(cx, cy);
      ctx.rotate(this.time * 0.005);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, size / 3, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawCenterInfo(l: Layout): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${Math.floor(12 * l.uiScale)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    const msg1 = this.logic.exitUnlocked ? '出口已解锁！前往右下角' : `收集3把钥匙解锁出口  (${this.logic.keys}/3)`;
    const msg2 = 'WASD移动 | E拾取/开门 | Q技能 | Tab切武器 | B背包';
    const cx = l.gameX + l.gameW / 2;
    const cy = l.gameY + l.gameH - 40 * l.uiScale;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(msg1, cx, cy);
    if (!l.isMobile) {
      ctx.fillStyle = '#D4AF37';
      ctx.fillText(msg2, cx, cy + 18 * l.uiScale);
    }
    ctx.restore();
  }

  private drawInventory(): void {
    const ctx = this.ctx;
    const w = Math.min(400, this.width * 0.85);
    const h = Math.min(500, this.height * 0.85);
    const x = (this.width - w) / 2;
    const y = (this.height - h) / 2;

    ctx.save();
    ctx.fillStyle = '#00000088';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(26, 10, 46, 0.95)';
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('背包', x + w / 2, y + 30);

    ctx.textAlign = 'right';
    ctx.font = 'bold 14px serif';
    ctx.fillStyle = this.logic.keys >= 3 ? '#00FF00' : '#FFD700';
    ctx.fillText(`钥匙: ${this.logic.keys}/3`, x + w - 20, y + 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px serif';
    ctx.fillText('收集3把钥匙可开出出口', x + w - 20, y + 48);

    const cols = 4, rows = 5;
    const slot = 64;
    const padding = 12;
    const gap = 10;
    const gridW = cols * slot + (cols - 1) * gap;
    const gridX = x + (w - gridW) / 2;
    const gridY = y + 70;

    const types: WeaponType[] = ['sword', 'bow', 'staff', 'shield'];
    let invIdx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sx = gridX + col * (slot + gap);
        const sy = gridY + row * (slot + gap);
        ctx.fillStyle = 'rgba(42, 24, 68, 0.9)';
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx, sy, slot, slot);
        ctx.strokeRect(sx, sy, slot, slot);

        if (invIdx < 20) {
          let wt: WeaponType | null = null;
          let count = 0;
          if (invIdx < types.length) {
            wt = types[invIdx];
            count = this.logic.inventory.get(wt)?.count ?? 0;
          }
          if (wt && count > 0) {
            const inv = this.logic.inventory.get(wt)!;
            const cdR = Math.min(1, inv.cooldown / 2000);
            this.drawWeaponIcon(wt, sx + padding / 2, sy + padding / 2, slot - padding, cdR);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px serif';
            ctx.textAlign = 'right';
            ctx.fillText(`x${count}`, sx + slot - 4, sy + slot - 4);
            if (this.logic.currentWeapon === wt) {
              ctx.strokeStyle = '#00FF00';
              ctx.lineWidth = 3;
              ctx.strokeRect(sx - 2, sy - 2, slot + 4, slot + 4);
            }
          }
        }
        invIdx++;
      }
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.fillText('按 B 关闭背包  |  Tab 切换武器  |  Q 使用技能', x + w / 2, y + h - 18);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private drawJoystick(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.joystick.baseX, this.joystick.baseY, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.shadowColor = '#D4AF37';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.joystick.stickX, this.joystick.stickY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMobileButtons(): void {
    const ctx = this.ctx;
    const scale = Math.min(this.width, this.height) / 800;
    const btnY = this.height - 120 * scale;
    const bSize = 60 * scale;

    const buttons = [
      { label: 'E', x: this.width - 160 * scale, color: '#D4AF37', action: 'e' },
      { label: 'Q', x: this.width - 90 * scale, color: '#FF6666', action: 'q' },
      { label: 'B', x: this.width - 230 * scale, color: '#6699FF', action: 'b' },
      { label: 'T', x: this.width - 300 * scale, color: '#66FF66', action: 'tab' }
    ];

    for (const b of buttons) {
      ctx.save();
      ctx.fillStyle = b.color + '88';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(b.x, btnY, bSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${Math.floor(20 * scale)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, btnY);
      ctx.restore();

      const thisBtn = b;
      this.canvas.ontouchend = null;
      this.canvas.addEventListener('touchstart', ((e: TouchEvent) => {
        for (const t of Array.from(e.changedTouches)) {
          if (t.clientX > this.width / 2) {
            const d = Math.sqrt((t.clientX - thisBtn.x) ** 2 + (t.clientY - btnY) ** 2);
            if (d < bSize / 2 + 10) {
              const evt = new KeyboardEvent('keydown', { key: thisBtn.action });
              window.dispatchEvent(evt);
              setTimeout(() => {
                const evtu = new KeyboardEvent('keyup', { key: thisBtn.action });
                window.dispatchEvent(evtu);
              }, 50);
            }
          }
        }
      }) as EventListener, { once: true });
    }
  }

  private drawOverlay(title: string, subtitle: string, color: string): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.textAlign = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    ctx.font = 'bold 48px serif';
    ctx.fillText(title, this.width / 2, this.height / 2 - 10);
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px serif';
    ctx.fillText(subtitle, this.width / 2, this.height / 2 + 30);
    ctx.fillStyle = '#D4AF37';
    ctx.font = '16px serif';
    ctx.fillText('刷新页面重新开始', this.width / 2, this.height / 2 + 70);
    ctx.restore();
  }
}
