import type { PlayerState, DamageNumber, WeaponType } from './types';
import { WEAPONS } from './player';

export class HUD {
  private ctx: CanvasRenderingContext2D;
  private canvasW: number;
  private canvasH: number;
  private lastRenderedState: string = '';
  private isMobile: boolean;
  private hudScale: number = 1;

  constructor(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, isMobile: boolean) {
    this.ctx = ctx;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.isMobile = isMobile;
    this.hudScale = isMobile ? 0.7 : 1;
  }

  resize(canvasW: number, canvasH: number): void {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.isMobile = canvasW < 768;
    this.hudScale = this.isMobile ? 0.7 : 1;
  }

  private getStateHash(state: PlayerState): string {
    return [
      state.health, state.maxHealth,
      state.mana, state.maxMana,
      state.stamina, state.maxStamina,
      state.currentWeapon,
      Math.floor(state.weaponTransition * 10),
      state.potions
    ].join(',');
  }

  needsRender(state: PlayerState): boolean {
    const hash = this.getStateHash(state);
    if (hash !== this.lastRenderedState) {
      this.lastRenderedState = hash;
      return true;
    }
    return false;
  }

  render(state: PlayerState, force: boolean = false): void {
    if (!force && !this.needsRender(state)) return;

    const s = this.hudScale;
    const padX = 20 * s;
    const padY = 20 * s;
    const barW = 240 * s;
    const barH = 18 * s;
    const gap = 8 * s;
    const fontSize = Math.max(8, 10 * s);

    this.ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
    this.ctx.textBaseline = 'top';

    this.drawBar(padX, padY, barW, barH, state.health / state.maxHealth, '#ff2020', '#8b0000', 'HP');
    this.drawBar(padX, padY + barH + gap, barW, barH, state.mana / state.maxMana, '#4080ff', '#2020aa', 'MP');
    this.drawBar(padX, padY + (barH + gap) * 2, barW, barH, state.stamina / state.maxStamina, '#40ff60', '#008040', 'SP');

    this.drawWeaponIndicator(state.currentWeapon, state.weaponTransition);
    this.drawKeyHints();
    this.drawPotionCount(state.potions);
  }

  private drawBar(
    x: number, y: number, w: number, h: number,
    ratio: number, c1: string, c2: string, label: string
  ): void {
    const ctx = this.ctx;
    const r = h / 2;

    ctx.fillStyle = 'rgba(20, 10, 30, 0.85)';
    this.roundRect(x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = '#3fff7f';
    ctx.lineWidth = 2;
    this.roundRect(x, y, w, h, r);
    ctx.stroke();

    const fillW = Math.max(0, Math.min(w - 4, (w - 4) * ratio));
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(x + 2, y + 2, x + 2, y + h - 2);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      this.roundRect(x + 2, y + 2, fillW, h - 4, r - 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 8, y + 3);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
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

  private drawWeaponIndicator(weapon: WeaponType, transition: number): void {
    const ctx = this.ctx;
    const s = this.hudScale;
    const iconSize = 48 * s;
    const gap = 12 * s;
    const weapons: WeaponType[] = ['melee', 'bow', 'staff'];
    const totalW = weapons.length * iconSize + (weapons.length - 1) * gap;
    const startX = (this.canvasW - totalW) / 2;
    const y = this.canvasH - iconSize - 20 * s;
    const fontSize = Math.max(8, 10 * s);

    weapons.forEach((w, i) => {
      const x = startX + i * (iconSize + gap);
      const isActive = w === weapon;
      const activeAlpha = isActive ? transition : 0;
      const inactiveAlpha = isActive ? 1 - transition : 0.4;

      ctx.fillStyle = 'rgba(20, 10, 30, 0.85)';
      this.roundRect(x, y, iconSize, iconSize, 6 * s);
      ctx.fill();

      ctx.strokeStyle = isActive ? '#ffff00' : '#3fff7f';
      ctx.lineWidth = isActive ? 3 : 2;
      this.roundRect(x, y, iconSize, iconSize, 6 * s);
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = isActive ? 1 : inactiveAlpha;
      this.drawWeaponIcon(w, x + iconSize / 2, y + iconSize / 2, iconSize * 0.6);
      ctx.restore();

      ctx.fillStyle = isActive ? '#ffff00' : '#7fff7f';
      ctx.textAlign = 'center';
      ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
      ctx.fillText(`${i + 1}`, x + iconSize / 2, y + iconSize + 4);

      if (isActive && activeAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = activeAlpha;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        this.roundRect(x, y, iconSize, iconSize, 6 * s);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  private drawWeaponIcon(type: WeaponType, cx: number, cy: number, size: number): void {
    const ctx = this.ctx;
    const w = WEAPONS[type];

    ctx.save();
    ctx.translate(cx, cy);

    if (type === 'melee') {
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = w.color;
      ctx.fillRect(-size * 0.05, -size * 0.4, size * 0.1, size * 0.65);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-size * 0.12, -size * 0.4, size * 0.24, size * 0.08);
      ctx.fillRect(-size * 0.05, size * 0.25, size * 0.1, size * 0.18);
    } else if (type === 'bow') {
      ctx.strokeStyle = w.color;
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.4, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = Math.max(1, size * 0.03);
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI / 3) * size * 0.4, Math.sin(-Math.PI / 3) * size * 0.4);
      ctx.lineTo(Math.cos(Math.PI / 3) * size * 0.4, Math.sin(Math.PI / 3) * size * 0.4);
      ctx.stroke();
    } else if (type === 'staff') {
      ctx.strokeStyle = w.color;
      ctx.lineWidth = Math.max(3, size * 0.12);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.4);
      ctx.lineTo(0, size * 0.3);
      ctx.stroke();
      ctx.fillStyle = '#ff66ff';
      ctx.beginPath();
      ctx.arc(0, -size * 0.48, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 102, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(0, -size * 0.48, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawKeyHints(): void {
    const ctx = this.ctx;
    const s = this.hudScale;
    const hints = this.isMobile
      ? [['Joy', 'Move'], ['ATK', 'Attack']]
      : [['WASD', 'Move'], ['LMB', 'Attack'], ['1/2/3', 'Weapon'], ['Q', 'Potion']];
    const fontSize = Math.max(7, 8 * s);
    const padX = 8 * s;
    const padY = 5 * s;
    const gap = 6 * s;

    ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'left';

    let totalW = 0;
    const widths: number[] = [];
    hints.forEach(([k, _]) => {
      const w = ctx.measureText(k).width + padX * 2 + 2;
      widths.push(w);
      totalW += w + gap;
    });
    totalW -= gap;

    let x = (this.canvasW - totalW) / 2;
    const y = this.canvasH - 60 * s - (this.isMobile ? 10 : 80 * s);

    hints.forEach(([key, desc], i) => {
      const w = widths[i];
      const h = 20 * s;

      ctx.fillStyle = 'rgba(20, 10, 30, 0.85)';
      this.roundRect(x, y, w, h, 3);
      ctx.fill();

      ctx.strokeStyle = '#3fff7f';
      ctx.lineWidth = 1;
      this.roundRect(x, y, w, h, 3);
      ctx.stroke();

      ctx.fillStyle = '#ffff66';
      ctx.fillText(key, x + padX, y + padY);

      ctx.fillStyle = '#7fff7f';
      ctx.font = `${Math.max(6, 7 * s)}px 'Press Start 2P', monospace`;
      ctx.fillText(desc, x + w + gap / 2, y + padY + 1);
      ctx.font = `${fontSize}px 'Press Start 2P', monospace`;

      x += w + gap;
    });
  }

  private drawPotionCount(count: number): void {
    const ctx = this.ctx;
    const s = this.hudScale;
    const x = this.canvasW - 80 * s;
    const y = 20 * s;
    const fontSize = Math.max(8, 10 * s);

    ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(20, 10, 30, 0.85)';
    this.roundRect(x, y, 60 * s, 28 * s, 4);
    ctx.fill();
    ctx.strokeStyle = '#3fff7f';
    ctx.lineWidth = 2;
    this.roundRect(x, y, 60 * s, 28 * s, 4);
    ctx.stroke();

    ctx.fillStyle = '#ff5050';
    ctx.beginPath();
    ctx.arc(x + 16 * s, y + 14 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8080';
    ctx.fillRect(x + 12 * s, y + 4 * s, 8 * s, 4 * s);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`x${count}`, x + 28 * s, y + 9 * s);
  }

  renderDamageNumbers(damageNumbers: DamageNumber[]): void {
    const ctx = this.ctx;
    const s = this.hudScale;
    const fontSize = Math.max(10, 14 * s);

    ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    damageNumbers.forEach(d => {
      const t = d.age / d.lifetime;
      const alpha = 1 - t;
      const scale = 1 + Math.sin(t * Math.PI) * 0.3;
      const y = d.y + d.vy * d.age;
      const x = d.x + d.vx * d.age;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale * s, scale * s);
      ctx.globalAlpha = alpha;

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(`${d.value}`, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${d.value}`, 0, 0);

      ctx.restore();
    });

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
  }
}
