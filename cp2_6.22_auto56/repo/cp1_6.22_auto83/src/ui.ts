
export type AlertLevel = 'safe' | 'warning' | 'danger';

export interface UIData {
  collectedFiles: number;
  totalFiles: number;
  alertLevel: AlertLevel;
}

export class UIRenderer {
  private alertFlashTimer: number = 0;
  private alertFlashDir: number = 1;

  update(dt: number): void {
    this.alertFlashTimer += dt * this.alertFlashDir * 4;
    if (this.alertFlashTimer > 1) {
      this.alertFlashTimer = 1;
      this.alertFlashDir = -1;
    } else if (this.alertFlashTimer < 0.3) {
      this.alertFlashTimer = 0.3;
      this.alertFlashDir = 1;
    }
  }

  render(ctx: CanvasRenderingContext2D, data: UIData, viewportW: number, viewportH: number): void {
    const padding = 20;
    const panelW = 240;
    const panelH = 110;
    const px = viewportW - panelW - padding;
    const py = padding;
    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 20, 0.78)';
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.6)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.fill();
    ctx.stroke();
    this.renderFileIcon(ctx, px + 22, py + 28);
    ctx.fillStyle = '#e8e8e8';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${data.collectedFiles} / ${data.totalFiles}`, px + 54, py + 30);
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#999';
    ctx.fillText('机密文件', px + 54, py + 50);
    const alertY = py + 78;
    this.renderAlertLevel(ctx, px + 22, alertY, data.alertLevel);
    ctx.restore();
  }

  private renderFileIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const size = 26;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#f0f0e8';
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    ctx.beginPath();
    ctx.moveTo(size / 2, -size / 2);
    ctx.lineTo(size / 2 - 8, -size / 2);
    ctx.lineTo(size / 2, -size / 2 + 8);
    ctx.closePath();
    ctx.fillStyle = '#d0d0c8';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.stroke();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-size / 2 + 4, -size / 2 + 8 + i * 6);
      ctx.lineTo(size / 2 - 4, -size / 2 + 8 + i * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderAlertLevel(ctx: CanvasRenderingContext2D, x: number, y: number, level: AlertLevel): void {
    let color: string;
    let label: string;
    switch (level) {
      case 'safe':
        color = '#4ade80';
        label = '● 安 全';
        break;
      case 'warning':
        color = '#facc15';
        label = '● 警 戒';
        break;
      case 'danger':
        color = '#f87171';
        label = '● 追 捕';
        break;
    }
    const flash = level === 'safe' ? 1 : this.alertFlashTimer;
    ctx.fillStyle = '#888';
    ctx.font = '13px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('警报等级：', x, y);
    ctx.fillStyle = color;
    ctx.globalAlpha = flash;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(label, x + 78, y);
    ctx.globalAlpha = 1;
    if (level !== 'safe') {
      ctx.save();
      ctx.globalAlpha = flash * 0.25;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + 78 + 10, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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
}

export class ParticleSystem {
  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }[] = [];

  emitBurst(cx: number, cy: number, count: number): void {
    const colors = ['#ff4466', '#44ff88', '#4488ff', '#ffcc33', '#ff66cc', '#66ffff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 320;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.5 + Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      const s = p.size * alpha;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      ctx.restore();
    }
  }

  isActive(): boolean {
    return this.particles.length > 0;
  }
}

export class EndScreenManager {
  fadeAlpha: number = 0;
  showText: boolean = false;
  textAlpha: number = 0;
  state: 'idle' | 'fadeOut' | 'showText' | 'done' = 'idle';
  isVictory: boolean = true;
  private timer: number = 0;

  start(isVictory: boolean): void {
    this.state = 'fadeOut';
    this.isVictory = isVictory;
    this.fadeAlpha = 0;
    this.showText = false;
    this.textAlpha = 0;
    this.timer = 0;
  }

  reset(): void {
    this.state = 'idle';
    this.fadeAlpha = 0;
    this.showText = false;
    this.textAlpha = 0;
    this.timer = 0;
  }

  update(dt: number): void {
    if (this.state === 'fadeOut') {
      const duration = this.isVictory ? 0.4 : 1.6;
      this.timer += dt;
      this.fadeAlpha = Math.min(1, this.timer / duration);
      if (this.timer >= duration) {
        this.state = 'showText';
        this.timer = 0;
      }
    } else if (this.state === 'showText') {
      this.timer += dt;
      this.showText = true;
      this.textAlpha = Math.min(1, this.timer / 0.8);
      if (this.timer >= 0.8) {
        this.state = 'done';
      }
    }
  }

  isFinished(): boolean {
    return this.state === 'done';
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.state === 'idle') return;
    ctx.save();
    ctx.fillStyle = this.isVictory ? `rgba(20,30,20,${this.fadeAlpha * 0.85})` : `rgba(0,0,0,${this.fadeAlpha})`;
    ctx.fillRect(0, 0, w, h);
    if (this.showText) {
      ctx.globalAlpha = this.textAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (this.isVictory) {
        const glow = 1 + Math.sin(Date.now() / 150) * 0.05;
        ctx.save();
        ctx.translate(w / 2, h / 2 - 40);
        ctx.scale(glow, glow);
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.fillText('任务成功', 0, 0);
        ctx.restore();
        ctx.fillStyle = '#a0f0b0';
        ctx.font = '26px "Courier New", monospace';
        ctx.fillText('所有机密文件已获取', w / 2, h / 2 + 30);
      } else {
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.fillText('任务失败', w / 2, h / 2 - 40);
        ctx.fillStyle = '#f0a0a0';
        ctx.shadowBlur = 0;
        ctx.font = '26px "Courier New", monospace';
        ctx.fillText('你已被敌人发现', w / 2, h / 2 + 30);
      }
      ctx.fillStyle = '#888';
      ctx.font = '18px "Courier New", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText('按 R 键重新开始', w / 2, h / 2 + 90);
    }
    ctx.restore();
  }
}
