import {
  GameState,
  CarState,
  Particle,
  TrailPoint,
  TerrainType,
  LapRecord,
} from './GameEngine';
import { TerrainManager } from './TerrainManager';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

const BG_COLOR = '#1a1a2e';
const ACCENT_COLOR = '#e94560';
const CAR_BODY_COLOR = '#e94560';
const CAR_WHEEL_COLOR = '#222';

const TERRAIN_COLORS: Record<TerrainType, string> = {
  asphalt: '#3a3a4a',
  sand: '#c2b280',
  snow: '#e8e8e8',
  mud: '#5c4033',
};

const TERRAIN_NAMES: Record<TerrainType, string> = {
  asphalt: '沥青',
  sand: '沙地',
  snow: '雪地',
  mud: '泥地',
};

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private terrainManager: TerrainManager;
  private displaySpeed: number;
  private lastTime: number;
  private dashOffset: number;
  private cameraX: number;
  private cameraY: number;
  private cameraZoom: number;

  constructor(canvas: HTMLCanvasElement, terrainManager: TerrainManager) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.terrainManager = terrainManager;
    this.displaySpeed = 0;
    this.lastTime = 0;
    this.dashOffset = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraZoom = 1;
  }

  render(
    state: GameState,
    leaderboard: LapRecord[],
    camera: CameraState,
    time: number
  ): void {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.updateCamera(camera, deltaTime);
    this.dashOffset = (time / 50) % 20;

    const targetSpeed = Math.abs(state.car.speed);
    this.displaySpeed += (targetSpeed - this.displaySpeed) * Math.min(deltaTime / 100, 1);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();

    this.ctx.save();
    this.applyCameraTransform();

    this.drawTrack();
    this.drawTrackBoundaries();
    this.drawStartLine();
    this.drawParticles(state.particles);
    this.drawTrail(state.trail, time);
    this.drawCar(state.car);

    this.ctx.restore();

    this.drawHUD(state);
    this.drawLeaderboard(leaderboard, state.bestLapTime);
    this.drawMinimap(state);
  }

  private updateCamera(target: CameraState, deltaTime: number): void {
    const smooth = Math.min(deltaTime / 150, 1);
    this.cameraX += (target.x - this.cameraX) * smooth;
    this.cameraY += (target.y - this.cameraY) * smooth;
    this.cameraZoom += (target.zoom - this.cameraZoom) * smooth;
  }

  private applyCameraTransform(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(this.cameraZoom, this.cameraZoom);
    this.ctx.translate(-this.cameraX, -this.cameraY);
  }

  private drawBackground(): void {
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawTrack(): void {
    const center = this.terrainManager.getTrackCenter();
    const semiMajor = this.terrainManager.getTrackSemiMajor();
    const semiMinor = this.terrainManager.getTrackSemiMinor();
    const width = this.terrainManager.getTrackWidth();

    const outerA = semiMajor + width / 2;
    const outerB = semiMinor + width / 2;
    const innerA = semiMajor - width / 2;
    const innerB = semiMinor - width / 2;

    const terrainAngles: { type: TerrainType; start: number; end: number }[] = [
      { type: 'asphalt', start: 0, end: Math.PI / 2 },
      { type: 'sand', start: Math.PI / 2, end: Math.PI },
      { type: 'snow', start: Math.PI, end: (Math.PI * 3) / 2 },
      { type: 'mud', start: (Math.PI * 3) / 2, end: Math.PI * 2 },
    ];

    for (const zone of terrainAngles) {
      this.ctx.beginPath();

      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const angle = zone.start + ((zone.end - zone.start) * i) / steps;
        const x = center.x + Math.cos(angle) * outerA;
        const y = center.y + Math.sin(angle) * outerB;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      for (let i = steps; i >= 0; i--) {
        const angle = zone.start + ((zone.end - zone.start) * i) / steps;
        const x = center.x + Math.cos(angle) * innerA;
        const y = center.y + Math.sin(angle) * innerB;
        this.ctx.lineTo(x, y);
      }

      this.ctx.closePath();
      this.ctx.fillStyle = TERRAIN_COLORS[zone.type];
      this.ctx.fill();
    }
  }

  private drawTrackBoundaries(): void {
    const center = this.terrainManager.getTrackCenter();
    const semiMajor = this.terrainManager.getTrackSemiMajor();
    const semiMinor = this.terrainManager.getTrackSemiMinor();
    const width = this.terrainManager.getTrackWidth();

    const outerA = semiMajor + width / 2;
    const outerB = semiMinor + width / 2;
    const innerA = semiMajor - width / 2;
    const innerB = semiMinor - width / 2;

    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.lineDashOffset = -this.dashOffset;

    this.drawEllipsePath(center.x, center.y, outerA, outerB);
    this.ctx.stroke();

    this.drawEllipsePath(center.x, center.y, innerA, innerB);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawEllipsePath(cx: number, cy: number, a: number, b: number): void {
    this.ctx.beginPath();
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = cx + Math.cos(angle) * a;
      const y = cy + Math.sin(angle) * b;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
  }

  private drawStartLine(): void {
    const center = this.terrainManager.getTrackCenter();
    const semiMajor = this.terrainManager.getTrackSemiMajor();
    const semiMinor = this.terrainManager.getTrackSemiMinor();
    const width = this.terrainManager.getTrackWidth();
    const startAngle = this.terrainManager.getStartLineAngle();

    const innerA = semiMajor - width / 2;
    const innerB = semiMinor - width / 2;
    const outerA = semiMajor + width / 2;
    const outerB = semiMinor + width / 2;

    const cos = Math.cos(startAngle);
    const sin = Math.sin(startAngle);

    const innerX = center.x + innerA * cos;
    const innerY = center.y + innerB * sin;
    const outerX = center.x + outerA * cos;
    const outerY = center.y + outerB * sin;

    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    this.ctx.moveTo(innerX, innerY);
    this.ctx.lineTo(outerX, outerY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawParticles(particles: Particle[]): void {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawTrail(trail: TrailPoint[], time: number): void {
    if (trail.length < 2) return;

    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      const age = time - curr.timestamp;
      const maxAge = 5000;
      const alpha = Math.max(0, 1 - age / maxAge);

      this.ctx.save();
      this.ctx.strokeStyle = ACCENT_COLOR;
      this.ctx.globalAlpha = alpha * 0.6;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(prev.x, prev.y);
      this.ctx.lineTo(curr.x, curr.y);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawCar(car: CarState): void {
    this.ctx.save();
    this.ctx.translate(car.x, car.y);
    this.ctx.rotate(car.angle - Math.PI / 2);

    const halfW = car.width / 2;
    const halfH = car.height / 2;

    this.ctx.fillStyle = CAR_WHEEL_COLOR;
    const wheelW = 6;
    const wheelH = 10;
    const wheelOffsetY = halfH - 12;

    this.ctx.fillRect(-halfW - wheelW / 2, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
    this.ctx.fillRect(halfW - wheelW / 2, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
    this.ctx.fillRect(-halfW - wheelW / 2, wheelOffsetY - wheelH / 2, wheelW, wheelH);
    this.ctx.fillRect(halfW - wheelW / 2, wheelOffsetY - wheelH / 2, wheelW, wheelH);

    this.ctx.fillStyle = CAR_BODY_COLOR;
    this.ctx.fillRect(-halfW, -halfH, car.width, car.height);

    this.ctx.restore();
  }

  private drawHUD(state: GameState): void {
    const padding = 20;

    this.drawLapInfo(state.lap, state.lapTime, padding, this.canvas.height - padding - 80);
    this.drawTerrainLabel(state.currentTerrain, padding, this.canvas.height - padding - 40);
    this.drawTerrainBar(state.terrainLapTimes, padding, this.canvas.height - padding - 16, 180);
    this.drawSpeedometer(
      this.displaySpeed,
      state.currentPhysics.maxSpeed,
      this.canvas.width - padding - 100,
      this.canvas.height - padding - 100
    );

    if (state.bestLapTime !== null) {
      this.drawBestLap(state.bestLapTime, this.canvas.width - padding - 240, padding + 10);
    }
  }

  private drawTerrainLabel(terrain: TerrainType, x: number, y: number): void {
    const color = TERRAIN_COLORS[terrain];
    const name = TERRAIN_NAMES[terrain];

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, 120, 32);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 4, y + 4, 24, 24);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(name, x + 36, y + 16);
    this.ctx.restore();
  }

  private drawLapInfo(lap: number, lapTime: number, x: number, y: number): void {
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`圈数: ${lap}`, x, y);
    this.ctx.fillText(`时间: ${this.formatTime(lapTime)}`, x, y + 24);
    this.ctx.restore();
  }

  private drawTerrainBar(
    terrainTimes: Record<TerrainType, number>,
    x: number,
    y: number,
    width: number
  ): void {
    const total =
      terrainTimes.asphalt +
      terrainTimes.sand +
      terrainTimes.snow +
      terrainTimes.mud;

    if (total === 0) return;

    const height = 12;
    const types: TerrainType[] = ['asphalt', 'sand', 'snow', 'mud'];

    let currentX = x;

    this.ctx.save();
    for (const type of types) {
      const ratio = terrainTimes[type] / total;
      const w = width * ratio;
      if (w > 0) {
        this.ctx.fillStyle = TERRAIN_COLORS[type];
        this.ctx.fillRect(currentX, y, w, height);
        currentX += w;
      }
    }

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  private drawSpeedometer(
    speed: number,
    maxSpeed: number,
    centerX: number,
    centerY: number
  ): void {
    const radius = 45;
    const progress = Math.min(speed / maxSpeed, 1);

    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    this.ctx.strokeStyle = ACCENT_COLOR;
    this.ctx.lineWidth = 6;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(Math.round(speed).toString(), centerX, centerY);

    this.ctx.font = '10px monospace';
    this.ctx.fillText('km/h', centerX, centerY + 18);

    this.ctx.restore();
  }

  private drawBestLap(time: number, x: number, y: number): void {
    this.ctx.save();
    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`最佳: ${this.formatTime(time)}`, x, y);
    this.ctx.restore();
  }

  private drawLeaderboard(
    leaderboard: LapRecord[],
    bestLapTime: number | null
  ): void {
    const padding = 20;
    const x = this.canvas.width - padding - 220;
    const y = padding;
    const width = 220;
    const rowHeight = 50;
    const headerHeight = 30;
    const maxRows = 5;

    const sorted = [...leaderboard].sort((a, b) => a.time - b.time).slice(0, maxRows);

    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(x, y, width, headerHeight + rowHeight * maxRows);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('排行榜', x + 10, y + headerHeight / 2);

    for (let i = 0; i < maxRows; i++) {
      const rowY = y + headerHeight + i * rowHeight;

      if (i >= sorted.length) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, rowY);
        this.ctx.lineTo(x + width, rowY);
        this.ctx.stroke();
        continue;
      }

      const record = sorted[i];
      const isNewRecord = bestLapTime !== null && record.time <= bestLapTime;

      if (isNewRecord) {
        const gradient = this.ctx.createLinearGradient(x, rowY, x + width, rowY);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, rowY, width, rowHeight - 1);
      }

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.beginPath();
      this.ctx.moveTo(x, rowY);
      this.ctx.lineTo(x + width, rowY);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px monospace';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(`#${i + 1}`, x + 10, rowY + 6);

      this.ctx.font = '12px monospace';
      this.ctx.fillText(this.formatTime(record.time), x + 50, rowY + 8);

      const totalTime =
        record.terrainTimes.asphalt +
        record.terrainTimes.sand +
        record.terrainTimes.snow +
        record.terrainTimes.mud;

      if (totalTime > 0) {
        const barX = x + 10;
        const barY = rowY + 28;
        const barW = width - 20;
        const barH = 8;

        const types: TerrainType[] = ['asphalt', 'sand', 'snow', 'mud'];
        let currentX = barX;

        for (const type of types) {
          const ratio = record.terrainTimes[type] / totalTime;
          const w = barW * ratio;
          if (w > 0) {
            this.ctx.fillStyle = TERRAIN_COLORS[type];
            this.ctx.fillRect(currentX, barY, w, barH);
            currentX += w;
          }
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barW, barH);
      }
    }

    this.ctx.restore();
  }

  private drawMinimap(state: GameState): void {
    const padding = 20;
    const size = 150;
    const x = padding;
    const y = padding;

    const center = this.terrainManager.getTrackCenter();
    const semiMajor = this.terrainManager.getTrackSemiMajor();
    const semiMinor = this.terrainManager.getTrackSemiMinor();
    const width = this.terrainManager.getTrackWidth();

    const scale = Math.min(size / (semiMajor * 2 + width + 40), size / (semiMinor * 2 + width + 40));

    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(x, y, size, size);

    const offsetX = x + size / 2;
    const offsetY = y + size / 2;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.drawMinimapEllipse(
      offsetX,
      offsetY,
      (semiMajor + width / 2) * scale,
      (semiMinor + width / 2) * scale
    );
    this.ctx.stroke();

    this.drawMinimapEllipse(
      offsetX,
      offsetY,
      (semiMajor - width / 2) * scale,
      (semiMinor - width / 2) * scale
    );
    this.ctx.stroke();

    if (state.trail.length > 1) {
      this.ctx.strokeStyle = ACCENT_COLOR;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      for (let i = 0; i < state.trail.length; i++) {
        const point = state.trail[i];
        const px = offsetX + (point.x - center.x) * scale;
        const py = offsetY + (point.y - center.y) * scale;
        if (i === 0) {
          this.ctx.moveTo(px, py);
        } else {
          this.ctx.lineTo(px, py);
        }
      }
      this.ctx.stroke();
    }

    const carX = offsetX + (state.car.x - center.x) * scale;
    const carY = offsetY + (state.car.y - center.y) * scale;

    this.ctx.fillStyle = CAR_BODY_COLOR;
    this.ctx.beginPath();
    this.ctx.arc(carX, carY, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawMinimapEllipse(cx: number, cy: number, a: number, b: number): void {
    this.ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = cx + Math.cos(angle) * a;
      const y = cy + Math.sin(angle) * b;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
}
