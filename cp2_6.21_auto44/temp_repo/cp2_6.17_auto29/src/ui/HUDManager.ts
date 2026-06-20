export interface HUDRenderArgs {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  cooldown: boolean;
  cooldownProgress: number;
  fragments: number;
  totalFragments: number;
  healthFlash: number;
  healthShake: number;
  energyShake: number;
  viewW: number;
  viewH: number;
  time: number;
}

function shake(offset: number, t: number, amount: number): number {
  if (t <= 0) return 0;
  return (Math.sin(t * 0.8) + Math.cos(t * 1.3)) * amount * (t / offset);
}

export class HUDManager {
  ctx: CanvasRenderingContext2D;
  prevHealth: number = 5;
  prevEnergy: number = 100;
  prevFragments: number = 0;
  healthShakeT: number = 0;
  energyShakeT: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(args: HUDRenderArgs) {
    const ctx = this.ctx;
    const {
      health, maxHealth, energy, maxEnergy, cooldown, cooldownProgress,
      fragments, totalFragments, healthFlash, viewW, viewH, time,
    } = args;

    if (health !== this.prevHealth) {
      this.healthShakeT = 150;
      this.prevHealth = health;
    }
    if (this.healthShakeT > 0) this.healthShakeT = Math.max(0, this.healthShakeT - 16);

    if (energy !== this.prevEnergy) {
      this.energyShakeT = 150;
      this.prevEnergy = energy;
    }
    if (this.energyShakeT > 0) this.energyShakeT = Math.max(0, this.energyShakeT - 16);

    ctx.save();
    const hShakeX = shake(150, this.healthShakeT, 2);
    const hShakeY = shake(150, this.healthShakeT, 1.5);

    ctx.save();
    ctx.translate(16 + hShakeX, 16 + hShakeY);

    const cellW = 28;
    const cellH = 16;
    const gap = 4;
    for (let i = 0; i < maxHealth; i++) {
      const x = i * (cellW + gap);
      const filled = i < health;
      const ratio = i / maxHealth;
      const r = Math.floor(80 + (220 - 80) * ratio);
      const g = Math.floor(220 - (220 - 60) * ratio);
      const b = Math.floor(100 - (100 - 60) * ratio);
      if (filled) {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else {
        ctx.fillStyle = '#2A1A2E';
      }
      ctx.fillRect(x, 0, cellW, cellH);
      ctx.strokeStyle = filled ? 'rgba(255,255,255,0.4)' : 'rgba(120,80,160,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, 0.5, cellW - 1, cellH - 1);
      if (filled) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x + 2, 2, cellW - 4, 2);
      }
    }
    if (healthFlash > 0) {
      ctx.fillStyle = `rgba(255,40,60,${Math.min(0.6, healthFlash / 200 * 0.6)})`;
      ctx.fillRect(-2, -2, maxHealth * (cellW + gap) + 4, cellH + 4);
    }
    ctx.fillStyle = '#B090E0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${health}/${maxHealth}`, 0, cellH + 14);
    ctx.restore();

    ctx.save();
    ctx.translate(16, 52);
    ctx.save();
    const pulse = 0.8 + Math.sin(time / 200) * 0.2;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8 * pulse;
    ctx.fillStyle = `rgba(255,215,0,${pulse})`;
    ctx.beginPath();
    const cx = 10, cy = 10;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const rr = i % 2 === 0 ? 10 : 4;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.fillStyle = '#E0D080';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    const bonusText = fragments >= 5 ? ' + BONUS!' : '';
    ctx.fillText(`${fragments} / ${totalFragments}${bonusText}`, 26, 14);
    ctx.restore();

    ctx.save();
    const eShakeX = shake(150, this.energyShakeT, 2);
    const eShakeY = shake(150, this.energyShakeT, 1);
    const barX = viewW - 240 + eShakeX;
    const barY = viewH - 48 + eShakeY;
    const barW = 220;
    const barH = 22;

    ctx.fillStyle = 'rgba(20,10,30,0.8)';
    ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 24);

    ctx.fillStyle = '#1A1024';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#44AAFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

    const energyPct = energy / maxEnergy;
    if (energyPct > 0) {
      const grd = ctx.createLinearGradient(barX, barY, barX, barY + barH);
      grd.addColorStop(0, '#66EEFF');
      grd.addColorStop(0.5, '#2288FF');
      grd.addColorStop(1, '#1144AA');
      ctx.fillStyle = grd;
      ctx.fillRect(barX + 2, barY + 2, (barW - 4) * energyPct, barH - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(barX + 2, barY + 2, (barW - 4) * energyPct, 3);
    }

    if (cooldown) {
      ctx.fillStyle = `rgba(255,40,60,${0.4 + Math.sin(time / 80) * 0.1})`;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = '#FF4466';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
      ctx.fillStyle = '#FF8899';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COOLING', barX + barW / 2, barY + 15);
    } else {
      ctx.fillStyle = '#80D0FF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CHRONO', barX + 4, barY - 6);
      ctx.textAlign = 'right';
      ctx.fillStyle = energyPct < 0.2 ? '#FFAA44' : '#AADDFF';
      ctx.fillText(`${Math.floor(energy)}`, barX + barW - 4, barY - 6);
    }

    if (!cooldown && energyPct < 1) {
      ctx.strokeStyle = 'rgba(120,200,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(barX + barW, barY + barH / 2, 14, -Math.PI / 2, -Math.PI / 2 + (1 - energyPct) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(180,150,220,0.6)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← → / A D: 移动   ↑ / W / Space: 跳跃   SHIFT: 时间力场', viewW / 2, viewH - 10);
    ctx.restore();

    ctx.restore();
  }
}
