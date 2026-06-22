import { ShipState } from './ship';
import { Reef, WaveZone } from './obstacle';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export interface RendererState {
  time: number;
}

export function createRendererState(): RendererState {
  return { time: 0 };
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  ship: ShipState,
  reefs: Reef[],
  waves: WaveZone[],
  state: RendererState,
  dt: number
): RendererState {
  const newState = { ...state, time: state.time + dt };

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawOceanBackground(ctx, newState.time);
  drawWaveZones(ctx, waves, newState.time);
  drawReefs(ctx, reefs);
  drawShip(ctx, ship);

  return newState;
}

function drawOceanBackground(ctx: CanvasRenderingContext2D, time: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#1565C0');
  gradient.addColorStop(0.5, '#1976D2');
  gradient.addColorStop(1, '#1E88E5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 15; i++) {
    const baseY = (i / 15) * CANVAS_HEIGHT + 20;
    const offset = Math.sin(time * 1.2 + i * 0.7) * 8;
    ctx.beginPath();
    ctx.moveTo(0, baseY + offset);

    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const y = baseY + offset + Math.sin(time * 1.5 + x * 0.02 + i * 0.5) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaveZones(ctx: CanvasRenderingContext2D, waves: WaveZone[], time: number): void {
  for (const wave of waves) {
    ctx.save();
    ctx.translate(wave.x, wave.y);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, wave.a);
    gradient.addColorStop(0, 'rgba(30, 136, 229, 0.7)');
    gradient.addColorStop(0.6, 'rgba(13, 71, 161, 0.55)');
    gradient.addColorStop(1, 'rgba(13, 71, 161, 0.3)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, wave.a, wave.b, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    const driftOffset = Math.sin(time * 1.8 + wave.phase) * (wave.a * 0.3);

    for (let i = 0; i < 3; i++) {
      const lineOffset = driftOffset + (i - 1) * wave.a * 0.25;
      ctx.beginPath();
      ctx.ellipse(lineOffset, 0, wave.a * 0.7, wave.b * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawReefs(ctx: CanvasRenderingContext2D, reefs: Reef[]): void {
  for (const reef of reefs) {
    ctx.save();
    ctx.globalAlpha = reef.opacity * 0.7;

    ctx.fillStyle = '#5D4037';
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 1;

    ctx.beginPath();
    const points = reef.points;
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

function drawShip(ctx: CanvasRenderingContext2D, ship: ShipState): void {
  ctx.save();
  ctx.translate(ship.x, ship.y + ship.sinkY);
  ctx.rotate(ship.heading + ship.tiltAngle);
  ctx.globalAlpha = ship.sinkOpacity;

  const shipColor = ship.isHit ? '#D32F2F' : '#8D6E63';

  ctx.fillStyle = shipColor;
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(-15, -15);
  ctx.lineTo(-15, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(5, -6);
  ctx.lineTo(5, 6);
  ctx.lineTo(-9, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawSinkingOverlay(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const opacity = Math.min(1, time / 0.8);
  ctx.globalAlpha = opacity;
  ctx.fillText('⛵ 已沉没', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#B0BEC5';
  ctx.fillText('点击「重新起航」再次出航', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);

  ctx.restore();
}

export function drawIdleOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌊 准备起航', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#E3F2FD';
  ctx.fillText('点击下方「起航」按钮开始航行', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);

  ctx.restore();
}

export function getHealthColor(health: number): string {
  if (health >= 61) return '#4CAF50';
  if (health >= 31) return '#FFC107';
  return '#F44336';
}
