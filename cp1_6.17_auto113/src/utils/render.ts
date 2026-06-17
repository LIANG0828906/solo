import {
  Microbe,
  MicrobeType,
  Ripple,
  StatsPoint,
  MICROBE_COLORS,
  STATS_WINDOW_SECONDS,
} from '../types';

export function drawMicrobe(
  ctx: CanvasRenderingContext2D,
  m: Microbe,
  scale: number
): void {
  const color = MICROBE_COLORS[m.type];
  const x = m.x * scale;
  const y = m.y * scale;
  const r = m.radius * scale;

  ctx.save();

  ctx.shadowColor = color;
  ctx.shadowBlur = 15;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;

  switch (m.type) {
    case MicrobeType.COCCUS: {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case MicrobeType.BACILLUS: {
      const direction = m.direction ?? 0;
      ctx.translate(x, y);
      ctx.rotate(direction);
      const bacillusWidth = r * 2.5;
      const bacillusHeight = r * 1.2;
      ctx.beginPath();
      const rx = bacillusHeight / 2;
      ctx.moveTo(-bacillusWidth / 2 + rx, -bacillusHeight / 2);
      ctx.lineTo(bacillusWidth / 2 - rx, -bacillusHeight / 2);
      ctx.quadraticCurveTo(bacillusWidth / 2, -bacillusHeight / 2, bacillusWidth / 2, -bacillusHeight / 2 + rx);
      ctx.lineTo(bacillusWidth / 2, bacillusHeight / 2 - rx);
      ctx.quadraticCurveTo(bacillusWidth / 2, bacillusHeight / 2, bacillusWidth / 2 - rx, bacillusHeight / 2);
      ctx.lineTo(-bacillusWidth / 2 + rx, bacillusHeight / 2);
      ctx.quadraticCurveTo(-bacillusWidth / 2, bacillusHeight / 2, -bacillusWidth / 2, bacillusHeight / 2 - rx);
      ctx.lineTo(-bacillusWidth / 2, -bacillusHeight / 2 + rx);
      ctx.quadraticCurveTo(-bacillusWidth / 2, -bacillusHeight / 2, -bacillusWidth / 2 + rx, -bacillusHeight / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case MicrobeType.SPIRILLUM: {
      const spiralPhase = m.spiralPhase ?? 0;
      const spiralRadius = (m.spiralRadius ?? r * 0.6) * scale;
      const spiralAngle = m.spiralAngle ?? m.direction ?? 0;
      ctx.translate(x, y);
      ctx.rotate(spiralAngle);
      ctx.beginPath();
      const segments = 6;
      const segmentLength = (r * 3) / segments;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 3 + spiralPhase;
        const px = -r * 1.5 + t * r * 3;
        const py = Math.sin(angle) * spiralRadius;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          const prevT = (i - 1) / segments;
          const prevAngle = prevT * Math.PI * 3 + spiralPhase;
          const prevPx = -r * 1.5 + prevT * r * 3;
          const prevPy = Math.sin(prevAngle) * spiralRadius;
          const cpx1 = prevPx + segmentLength / 3;
          const cpy1 = prevPy;
          const cpx2 = px - segmentLength / 3;
          const cpy2 = py;
          ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, px, py);
        }
      }
      ctx.lineWidth = r * 0.6;
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.stroke();
      break;
    }
  }

  if (m.flashing) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    switch (m.type) {
      case MicrobeType.COCCUS: {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case MicrobeType.BACILLUS: {
        const direction2 = m.direction ?? 0;
        ctx.translate(x, y);
        ctx.rotate(direction2);
        const bw = r * 2.5;
        const bh = r * 1.2;
        const rx2 = bh / 2;
        ctx.beginPath();
        ctx.moveTo(-bw / 2 + rx2, -bh / 2);
        ctx.lineTo(bw / 2 - rx2, -bh / 2);
        ctx.quadraticCurveTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + rx2);
        ctx.lineTo(bw / 2, bh / 2 - rx2);
        ctx.quadraticCurveTo(bw / 2, bh / 2, bw / 2 - rx2, bh / 2);
        ctx.lineTo(-bw / 2 + rx2, bh / 2);
        ctx.quadraticCurveTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - rx2);
        ctx.lineTo(-bw / 2, -bh / 2 + rx2);
        ctx.quadraticCurveTo(-bw / 2, -bh / 2, -bw / 2 + rx2, -bh / 2);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case MicrobeType.SPIRILLUM: {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const sp = m.spiralPhase ?? 0;
        const sr = (m.spiralRadius ?? r * 0.6) * scale;
        const sa = m.spiralAngle ?? m.direction ?? 0;
        ctx.translate(x, y);
        ctx.rotate(sa);
        ctx.beginPath();
        const segs = 6;
        const segLen = (r * 3) / segs;
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          const angle = t * Math.PI * 3 + sp;
          const ppx = -r * 1.5 + t * r * 3;
          const ppy = Math.sin(angle) * sr;
          if (i === 0) {
            ctx.moveTo(ppx, ppy);
          } else {
            const prevT = (i - 1) / segs;
            const prevAngle = prevT * Math.PI * 3 + sp;
            const prevPx = -r * 1.5 + prevT * r * 3;
            const prevPy = Math.sin(prevAngle) * sr;
            const cpx1 = prevPx + segLen / 3;
            const cpy1 = prevPy;
            const cpx2 = ppx - segLen / 3;
            const cpy2 = ppy;
            ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, ppx, ppy);
          }
        }
        ctx.lineWidth = r * 0.6;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
    }
  }

  ctx.restore();
}

export function drawRipple(
  ctx: CanvasRenderingContext2D,
  r: Ripple,
  scale: number
): void {
  const color = MICROBE_COLORS[r.type];
  const x = r.x * scale;
  const y = r.y * scale;
  const baseRadius = 10 * scale;
  const maxRadius = 80 * scale;
  const currentRadius = baseRadius + (maxRadius - baseRadius) * r.progress;
  const alpha = Math.max(0, 1 - r.progress);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawStatsChart(
  ctx: CanvasRenderingContext2D,
  stats: StatsPoint[],
  w: number,
  h: number
): void {
  ctx.save();

  const radius = 12;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(w - radius, 0);
  ctx.quadraticCurveTo(w, 0, w, radius);
  ctx.lineTo(w, h - radius);
  ctx.quadraticCurveTo(w, h, w - radius, h);
  ctx.lineTo(radius, h);
  ctx.quadraticCurveTo(0, h, 0, h - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = '#0F1D33E0';
  ctx.fill();
  ctx.strokeStyle = '#2C3E50';
  ctx.lineWidth = 1;
  ctx.stroke();

  const padding = { top: 15, right: 15, bottom: 25, left: 35 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.strokeStyle = 'rgba(44, 62, 80, 0.5)';
  ctx.lineWidth = 1;
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#8899AA';

  for (let i = 0; i <= 5; i++) {
    const yRatio = i / 5;
    const y = padding.top + chartH * (1 - yRatio);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(i * 20)), 4, y + 3);
  }

  for (let i = 0; i <= 3; i++) {
    const xRatio = i / 3;
    const x = padding.left + chartW * xRatio;
    const secLabel = String(Math.round(STATS_WINDOW_SECONDS * (1 - xRatio)));
    const textW = ctx.measureText(secLabel).width;
    ctx.fillText(secLabel, x - textW / 2, h - 8);
  }

  const drawLine = (key: 'coccus' | 'bacillus' | 'spirillum', color: string) => {
    if (stats.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < stats.length; i++) {
      const point = stats[i];
      const now = Date.now();
      const timeDiff = Math.max(0, STATS_WINDOW_SECONDS * 1000 - (now - point.time));
      const xRatio = timeDiff / (STATS_WINDOW_SECONDS * 1000);
      const x = padding.left + chartW * xRatio;

      const value = point[key];
      const yRatio = Math.min(1, Math.max(0, value / 100));
      const y = padding.top + chartH * (1 - yRatio);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  drawLine('coccus', MICROBE_COLORS[MicrobeType.COCCUS]);
  drawLine('bacillus', MICROBE_COLORS[MicrobeType.BACILLUS]);
  drawLine('spirillum', MICROBE_COLORS[MicrobeType.SPIRILLUM]);

  ctx.restore();
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;

  const length = 12;
  const gap = 4;

  ctx.beginPath();
  ctx.moveTo(x - length, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + length, y);
  ctx.moveTo(x, y - length);
  ctx.lineTo(x, y - gap);
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + length);
  ctx.stroke();

  ctx.restore();
}
