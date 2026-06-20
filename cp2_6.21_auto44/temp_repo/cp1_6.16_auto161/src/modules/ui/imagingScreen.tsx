import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';

function wavelengthToRgb(wavelength: number): string {
  let r = 0, g = 0, b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }
  const factor = wavelength >= 380 && wavelength < 420
    ? 0.3 + 0.7 * (wavelength - 380) / (420 - 380)
    : wavelength >= 645 && wavelength <= 780
    ? 0.3 + 0.7 * (780 - wavelength) / (780 - 645)
    : 1;
  return `rgb(${Math.round(r * factor * 255)}, ${Math.round(g * factor * 255)}, ${Math.round(b * factor * 255)})`;
}

export default function ImagingScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const { traceResult } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenRef.current;

    const ctx = canvas.getContext('2d');
    const offCtx = offscreen.getContext('2d');
    if (!ctx || !offCtx) return;

    const w = canvas.width;
    const h = canvas.height;
    offscreen.width = w;
    offscreen.height = h;

    ctx.fillStyle = '#0D0D12';
    ctx.fillRect(0, 0, w, h);
    offCtx.clearRect(0, 0, w, h);

    const gridSize = 40;
    ctx.strokeStyle = 'rgba(58, 58, 69, 0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(102, 217, 239, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const scale = 3;
    const cx = w / 2;
    const cy = h / 2;

    const hits = traceResult?.screenHits || [];
    let maxDist = 0;
    let avgX = 0, avgY = 0;

    if (hits.length > 0) {
      const sumX = hits.reduce((s, h) => s + h.x * h.intensity, 0);
      const sumY = hits.reduce((s, h) => s + h.y * h.intensity, 0);
      const sumI = hits.reduce((s, h) => s + h.intensity, 0);
      if (sumI > 0) {
        avgX = sumX / sumI;
        avgY = sumY / sumI;
      }

      let sumDist = 0;
      hits.forEach((hit) => {
        const dx = hit.x - avgX;
        const dy = hit.y - avgY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        sumDist += dist * hit.intensity;
        if (dist > maxDist) maxDist = dist;
      });
      const avgDist = sumI > 0 ? sumDist / sumI : 0;
      maxDist = Math.max(maxDist, avgDist * 2);
    }

    hits.forEach((hit) => {
      const x = cx + hit.x * scale;
      const y = cy + hit.y * scale;
      const color = wavelengthToRgb(hit.wavelength);
      const alpha = Math.min(hit.intensity, 1);

      const radius = 8;
      const grad = offCtx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, color.replace('rgb(', 'rgba(').replace(')', `, ${alpha * 0.9})`));
      grad.addColorStop(0.5, color.replace('rgb(', 'rgba(').replace(')', `, ${alpha * 0.3})`));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(x, y, radius, 0, Math.PI * 2);
      offCtx.fill();
    });

    ctx.filter = 'blur(2px)';
    ctx.drawImage(offscreen, 0, 0);
    ctx.filter = 'none';

    ctx.drawImage(offscreen, 0, 0);

    if (hits.length > 0) {
      const spotRadius = maxDist * scale;
      const spotCx = cx + avgX * scale;
      const spotCy = cy + avgY * scale;

      ctx.strokeStyle = 'rgba(230, 219, 116, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(spotCx, spotCy, Math.max(spotRadius, 6), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const diameter = (maxDist * 2).toFixed(2);
      const text = `弥散斑直径: ${diameter} mm`;
      ctx.font = '11px -apple-system, monospace';
      const textW = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
      ctx.fillRect(spotCx + 10, spotCy - 8, textW + 12, 20);
      ctx.strokeStyle = 'rgba(230, 219, 116, 0.5)';
      ctx.strokeRect(spotCx + 10, spotCy - 8, textW + 12, 20);

      ctx.fillStyle = '#E6DB74';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, spotCx + 16, spotCy + 2);
    }

    const labelOffset = 24;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';
    const range = 40;
    for (let i = -range; i <= range; i += 10) {
      if (i === 0) continue;
      ctx.fillText(`${i}mm`, cx + i * scale, h - 6);
      ctx.fillText(`${i}mm`, 16, cy - i * scale);
    }
    ctx.fillStyle = '#555';
    ctx.fillText('0', cx, h - 6);
    ctx.fillText('0', 10, cy);
    ctx.textAlign = 'start';

    ctx.strokeStyle = 'rgba(58, 58, 69, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    if (hits.length === 0) {
      ctx.fillStyle = '#444';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('点击"开始光线追迹"查看光斑', cx, cy - 20);
      ctx.font = '11px system-ui';
      ctx.fillStyle = '#333';
      ctx.fillText('共 0 条光线到达成像面', cx, cy + 10);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '10px monospace';
      ctx.fillText(`光线数: ${hits.length}  质心: (${avgX.toFixed(2)}, ${avgY.toFixed(2)})mm`, 10, 18);
    }
  }, [traceResult]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: '#1F1F28', backgroundColor: '#2A2A35' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: '#E0E0E0' }}>
          成像光斑
        </h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#66D9EF' }} />
          <span className="text-xs" style={{ color: '#666' }}>实时</span>
        </div>
      </div>
      <div
        className="flex-1 p-3 flex items-center justify-center"
        style={{ backgroundColor: '#181820' }}
      >
        <div
          className="rounded-lg overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)' }}
        >
          <canvas
            ref={canvasRef}
            width={360}
            height={360}
            className="block"
          />
        </div>
      </div>
    </div>
  );
}
