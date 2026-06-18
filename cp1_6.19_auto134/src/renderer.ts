import { dataState, Ship, GravityWave, Star } from './dataspace';

const LOG_PANEL_WIDTH = 200;
const LOG_PANEL_HEIGHT = 150;
const LOG_PANEL_BG = '#2D3436';
const TOPBAR_HEIGHT = 40;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private virtualWidth: number;
  private virtualHeight: number;
  private scale: number;
  private offsetX: number;
  private offsetY: number;
  private buttonHovered: boolean = false;
  private buttonPressed: boolean = false;
  private logPanelCollapsed: boolean = false;
  private topbarCollapsed: boolean = false;
  private smallScreen: boolean = false;

  constructor(canvas: HTMLCanvasElement, virtualWidth = 800, virtualHeight = 600) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    this.canvas.width = Math.floor(cssWidth * dpr);
    this.canvas.height = Math.floor(cssHeight * dpr);
    this.canvas.style.width = cssWidth + 'px';
    this.canvas.style.height = cssHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scaleX = cssWidth / this.virtualWidth;
    const scaleY = cssHeight / this.virtualHeight;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (cssWidth - this.virtualWidth * this.scale) / 2;
    this.offsetY = (cssHeight - this.virtualHeight * this.scale) / 2;

    this.smallScreen = cssWidth < 700;
  }

  screenToVirtual(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }

  setButtonHovered(hovered: boolean): void {
    this.buttonHovered = hovered;
  }

  setButtonPressed(pressed: boolean): void {
    this.buttonPressed = pressed;
  }

  toggleLogPanel(): void {
    this.logPanelCollapsed = !this.logPanelCollapsed;
  }

  toggleTopbar(): void {
    this.topbarCollapsed = !this.topbarCollapsed;
  }

  isSmallScreen(): boolean {
    return this.smallScreen;
  }

  getLogPanelCollapsed(): boolean {
    return this.logPanelCollapsed;
  }

  isButtonPressed(): boolean {
    return this.buttonPressed;
  }

  render(currentTime: number): void {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    this.drawBackground(ctx);
    this.drawStars(ctx, currentTime);
    this.drawNebulas(ctx);
    this.drawGravityWaves(ctx, currentTime);
    this.drawWormholes(ctx, currentTime);
    this.drawGuide(ctx);
    this.drawFleet(ctx);
    this.drawFormationLines(ctx);

    ctx.restore();
    ctx.save();

    this.drawTopbar(ctx, currentTime);
    this.drawIntegrityIndicator(ctx, currentTime);
    this.drawLogPanel(ctx, currentTime);

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.virtualHeight);
    gradient.addColorStop(0, '#0B0B1A');
    gradient.addColorStop(1, '#1A1A3A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
  }

  private drawStars(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const stars = dataState.getStars();
    stars.forEach((star: Star) => {
      const twinkle = Math.sin(
        (currentTime / 1000 / star.twinklePeriod) * Math.PI * 2 + star.twinklePhase
      );
      const opacity = star.baseOpacity + twinkle * 0.2 * star.baseOpacity;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, opacity))})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawNebulas(ctx: CanvasRenderingContext2D): void {
    const nebulas = dataState.getNebulas();
    nebulas.forEach(nebula => {
      const gradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.radius
      );
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.5)');
      gradient.addColorStop(0.5, 'rgba(106, 30, 180, 0.35)');
      gradient.addColorStop(1, 'rgba(75, 0, 130, 0.05)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawWormholes(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const wormholes = dataState.getWormholes();
    wormholes.forEach(wh => {
      const progress = (currentTime % 1200) / 1200;
      const rotation = progress * Math.PI * 2;

      ctx.save();
      ctx.translate(wh.x, wh.y);

      const outerRadius = 24;
      const innerRadius = 8;
      const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.08;

      const gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius * pulseScale);
      gradient.addColorStop(0, 'rgba(255, 69, 0, 0.9)');
      gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

      ctx.rotate(rotation);
      for (let i = 0; i < 6; i++) {
        const startAngle = (i / 6) * Math.PI * 2;
        const endAngle = startAngle + Math.PI / 3 - 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius * pulseScale, startAngle, endAngle);
        ctx.arc(0, 0, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius - 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private drawGravityWaves(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const waves = dataState.getGravityWaves();
    waves.forEach((wave: GravityWave) => {
      const progress = Math.min(1, (currentTime - wave.startTime) / wave.duration);
      const radius = progress * wave.maxRadius;
      const opacity = 0.8 * (1 - progress);

      ctx.strokeStyle = `rgba(180, 120, 255, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (progress > 0.3) {
        const innerProgress = progress - 0.3;
        const innerOpacity = 0.5 * (1 - innerProgress / 0.7);
        ctx.strokeStyle = `rgba(200, 150, 255, ${innerOpacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  private drawGuide(ctx: CanvasRenderingContext2D): void {
    const pos = dataState.getGuidePosition();
    const size = 12;
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(pos.x - size / 2, pos.y);
    ctx.lineTo(pos.x + size / 2, pos.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - size / 2);
    ctx.lineTo(pos.x, pos.y + size / 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawFormationLines(ctx: CanvasRenderingContext2D): void {
    const lead = dataState.getLeadShip();
    if (!lead) return;
    const escorts = dataState.getEscortShips();
    ctx.strokeStyle = 'rgba(0, 206, 209, 0.2)';
    ctx.lineWidth = 1;
    escorts.forEach(escort => {
      ctx.beginPath();
      ctx.moveTo(lead.x, lead.y);
      ctx.lineTo(escort.x, escort.y);
      ctx.stroke();
    });
    for (let i = 0; i < escorts.length; i++) {
      const next = (i + 1) % escorts.length;
      ctx.beginPath();
      ctx.moveTo(escorts[i].x, escorts[i].y);
      ctx.lineTo(escorts[next].x, escorts[next].y);
      ctx.stroke();
    }
  }

  private drawFleet(ctx: CanvasRenderingContext2D): void {
    const ships = dataState.getShips();
    ships.forEach(ship => {
      if (ship.status === 'warping') return;
      if (ship.type === 'lead') {
        this.drawLeadShip(ctx, ship);
      } else {
        this.drawEscortShip(ctx, ship);
      }
    });
  }

  private drawLeadShip(ctx: CanvasRenderingContext2D, ship: Ship): void {
    const size = 14;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const angle = Math.atan2(ship.targetY - ship.y, ship.targetX - ship.x);
    ctx.rotate(angle);
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size * 0.7);
    ctx.lineTo(-size * 0.6, 0);
    ctx.lineTo(0, -size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawEscortShip(ctx: CanvasRenderingContext2D, ship: Ship): void {
    const size = 10;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const lead = dataState.getLeadShip();
    let angle = 0;
    if (lead) {
      angle = Math.atan2(lead.y - ship.y, lead.x - ship.x);
    }
    ctx.rotate(angle);
    if (ship.status === 'disturbed' && ship.disturbedUntil > performance.now()) {
      ctx.shadowColor = '#FF6666';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = '#00CED1';
      ctx.shadowBlur = 5;
    }
    ctx.fillStyle = ship.status === 'disturbed' && ship.disturbedUntil > performance.now()
      ? '#FF8888'
      : '#00CED1';
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.7);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, -size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#40E0D0';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  private drawTopbar(ctx: CanvasRenderingContext2D, currentTime: number): void {
    const collapsed = this.smallScreen && this.topbarCollapsed;
    const cssWidth = this.canvas.width / (window.devicePixelRatio || 1);

    if (collapsed) {
      this.drawTopbarIcon(ctx, currentTime);
      return;
    }

    const barHeight = TOPBAR_HEIGHT;
    ctx.fillStyle = 'rgba(26, 26, 58, 0.5)';
    ctx.fillRect(0, 0, cssWidth, barHeight);

    const btnWidth = 120;
    const btnHeight = 28;
    const btnX = 16;
    const btnY = (barHeight - btnHeight) / 2;

    let btnColor = '#FFBF00';
    if (this.buttonHovered) {
      btnColor = '#FFD700';
    }
    if (this.buttonPressed) {
      ctx.save();
      ctx.translate(btnX + btnWidth / 2, btnY + btnHeight / 2);
      ctx.scale(0.95, 0.95);
      ctx.translate(-(btnX + btnWidth / 2), -(btnY + btnHeight / 2));
    }

    ctx.fillStyle = btnColor;
    this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6);
    ctx.fill();

    ctx.fillStyle = '#1A1A3A';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('跃迁探索', btnX + btnWidth / 2, btnY + btnHeight / 2 + 1);

    if (this.buttonPressed) {
      ctx.restore();
    }

    ctx.fillStyle = '#B0B0D0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      '鼠标悬停/拖动移动引导标 | 舰队自动跟随',
      btnX + btnWidth + 20,
      barHeight / 2
    );
  }

  private drawTopbarIcon(ctx: CanvasRenderingContext2D, _currentTime: number): void {
    const size = 36;
    const padding = 8;
    ctx.fillStyle = 'rgba(26, 26, 58, 0.7)';
    this.roundRect(ctx, padding, padding, size, size, 6);
    ctx.fill();
    ctx.fillStyle = '#FFBF00';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('跃', padding + size / 2, padding + size / 2);
  }

  private drawIntegrityIndicator(ctx: CanvasRenderingContext2D, _currentTime: number): void {
    const cssHeight = this.canvas.height / (window.devicePixelRatio || 1);
    const x = 12;
    const y = cssHeight - 60;
    const width = 140;
    const height = 44;

    ctx.fillStyle = 'rgba(45, 52, 54, 0.85)';
    this.roundRect(ctx, x, y, width, height, 6);
    ctx.fill();

    const integrity = dataState.getFormationIntegrity();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('阵型完整度', x + 10, y + 16);

    ctx.fillStyle = '#1A1A3A';
    this.roundRect(ctx, x + 10, y + 24, width - 20, 12, 3);
    ctx.fill();

    const barColor = integrity > 70 ? '#00FF00' : integrity > 40 ? '#FFBF00' : '#FF4444';
    const fillWidth = (width - 20) * (integrity / 100);
    ctx.fillStyle = barColor;
    this.roundRect(ctx, x + 10, y + 24, fillWidth, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${integrity}%`, x + width / 2, y + 33);
  }

  private drawLogPanel(ctx: CanvasRenderingContext2D, _currentTime: number): void {
    const cssWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = this.canvas.height / (window.devicePixelRatio || 1);
    const collapsed = this.smallScreen && this.logPanelCollapsed;
    const margin = 12;

    if (collapsed) {
      const size = 36;
      const x = cssWidth - margin - size;
      const y = cssHeight - margin - size;
      ctx.fillStyle = 'rgba(45, 52, 54, 0.9)';
      this.roundRect(ctx, x, y, size, size, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('日', x + size / 2, y + size / 2);
      return;
    }

    const x = cssWidth - margin - LOG_PANEL_WIDTH;
    const y = cssHeight - margin - LOG_PANEL_HEIGHT;

    ctx.fillStyle = LOG_PANEL_BG;
    this.roundRect(ctx, x, y, LOG_PANEL_WIDTH, LOG_PANEL_HEIGHT, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 22);
    ctx.lineTo(x + LOG_PANEL_WIDTH, y + 22);
    ctx.stroke();

    ctx.fillStyle = '#FFBF00';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('事件日志', x + 10, y + 15);

    const logs = dataState.getLogs();
    const lineHeight = 14;
    const contentY = y + 28;
    const maxLines = Math.floor((LOG_PANEL_HEIGHT - 32) / lineHeight);

    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';

    logs.slice(0, maxLines).forEach((log, idx) => {
      const opacity = log.opacity;
      if (opacity <= 0) return;

      const date = new Date(log.timestamp);
      const timeStr = `[${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}]`;

      ctx.globalAlpha = opacity;

      ctx.fillStyle = 'rgba(180, 180, 200, 0.8)';
      ctx.fillText(timeStr, x + 8, contentY + idx * lineHeight);

      ctx.fillStyle = '#FFFFFF';
      const msgX = x + 8 + 52;
      const maxWidth = LOG_PANEL_WIDTH - 16 - 52;
      let msg = log.message;
      if (ctx.measureText(msg).width > maxWidth) {
        while (ctx.measureText(msg + '...').width > maxWidth && msg.length > 3) {
          msg = msg.slice(0, -1);
        }
        msg += '...';
      }
      ctx.fillText(msg, msgX, contentY + idx * lineHeight);

      ctx.globalAlpha = 1;
    });
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
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

  isPointInWarpButton(screenX: number, screenY: number): boolean {
    const collapsed = this.smallScreen && this.topbarCollapsed;
    if (collapsed) {
      const size = 36;
      const padding = 8;
      return screenX >= padding && screenX <= padding + size &&
             screenY >= padding && screenY <= padding + size;
    }
    const btnWidth = 120;
    const btnHeight = 28;
    const btnX = 16;
    const btnY = (TOPBAR_HEIGHT - btnHeight) / 2;
    return screenX >= btnX && screenX <= btnX + btnWidth &&
           screenY >= btnY && screenY <= btnY + btnHeight;
  }

  isPointInLogIcon(screenX: number, screenY: number): boolean {
    if (!(this.smallScreen && this.logPanelCollapsed)) return false;
    const cssWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const cssHeight = this.canvas.height / (window.devicePixelRatio || 1);
    const size = 36;
    const margin = 12;
    const x = cssWidth - margin - size;
    const y = cssHeight - margin - size;
    return screenX >= x && screenX <= x + size &&
           screenY >= y && screenY <= y + size;
  }

  isPointInTopbarIcon(screenX: number, screenY: number): boolean {
    if (!(this.smallScreen && this.topbarCollapsed)) return false;
    const size = 36;
    const padding = 8;
    return screenX >= padding && screenX <= padding + size &&
           screenY >= padding && screenY <= padding + size;
  }
}
