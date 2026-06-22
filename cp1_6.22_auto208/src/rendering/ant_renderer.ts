import { AntAgent } from '../core/ant_agent';
import { CameraState } from './map_renderer';
import { SpatialHash } from '../core/spatial_hash';

export class AntRenderer {
  private ctx: CanvasRenderingContext2D;
  private animationTime: number = 0;
  private antSpatialHash: SpatialHash<AntAgent>;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.antSpatialHash = new SpatialHash<AntAgent>(120);
  }

  render(
    deltaTime: number,
    ants: Map<string, AntAgent>,
    canvas: HTMLCanvasElement,
    camera: CameraState
  ): void {
    this.animationTime += deltaTime;
    const ctx = this.ctx;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    this.antSpatialHash.clear();
    ants.forEach((ant) => {
      this.antSpatialHash.insert(ant, ant.position);
    });

    const viewMargin = 100 / camera.zoom;
    const viewLeft = camera.x - canvas.width / 2 / camera.zoom - viewMargin;
    const viewTop = camera.y - canvas.height / 2 / camera.zoom - viewMargin;
    const viewWidth = canvas.width / camera.zoom + viewMargin * 2;
    const viewHeight = canvas.height / camera.zoom + viewMargin * 2;

    const visibleAnts = this.antSpatialHash.queryRect(viewLeft, viewTop, viewWidth, viewHeight);

    visibleAnts.forEach((ant) => {
      this.renderAnt(ant);
    });

    ctx.restore();
  }

  private renderAnt(ant: AntAgent): void {
    const ctx = this.ctx;
    const { position, type, carrying, selected } = ant;

    const angle = Math.atan2(ant.velocity.y, ant.velocity.x);
    const baseSize = type === 'soldier' ? 7 : 5;
    const bobOffset = Math.sin(this.animationTime * 8 + ant.id.charCodeAt(ant.id.length - 1)) * 0.5;

    ctx.save();
    ctx.translate(position.x, position.y + bobOffset);
    ctx.rotate(angle);

    if (selected) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
    }

    const bodyColor = type === 'soldier' ? '#FF4500' : '#00FF7F';
    const darkColor = type === 'soldier' ? '#CC3300' : '#00CC66';

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(-baseSize * 0.8, 0, baseSize * 0.6, baseSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseSize * 0.7, baseSize * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(baseSize * 0.8, 0, baseSize * 0.5, baseSize * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'soldier') {
      ctx.strokeStyle = '#FF6347';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(baseSize * 1.2, -baseSize * 0.3);
      ctx.lineTo(baseSize * 1.8, -baseSize * 0.7);
      ctx.moveTo(baseSize * 1.2, baseSize * 0.3);
      ctx.lineTo(baseSize * 1.8, baseSize * 0.7);
      ctx.stroke();
    }

    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    const legWave = Math.sin(this.animationTime * 12 + ant.id.charCodeAt(0)) * baseSize * 0.3;
    for (let i = -1; i <= 1; i++) {
      const legX = i * baseSize * 0.5;
      ctx.beginPath();
      ctx.moveTo(legX, -baseSize * 0.4);
      ctx.lineTo(legX - baseSize * 0.3, -baseSize * 1.1 + (i === 0 ? legWave : -legWave));
      ctx.moveTo(legX, baseSize * 0.4);
      ctx.lineTo(legX - baseSize * 0.3, baseSize * 1.1 + (i === 0 ? -legWave : legWave));
      ctx.stroke();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(baseSize * 1.0, -baseSize * 0.2, 1.5, 0, Math.PI * 2);
    ctx.arc(baseSize * 1.0, baseSize * 0.2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (carrying) {
      const flash = (Math.sin(this.animationTime * 6) + 1) / 2;
      ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + flash * 0.3})`;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-baseSize * 1.1, 0, baseSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    if (selected) {
      ctx.save();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -this.animationTime * 10;
      ctx.beginPath();
      ctx.arc(position.x, position.y, baseSize * 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}
