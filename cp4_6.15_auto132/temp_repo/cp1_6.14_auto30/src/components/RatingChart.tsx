import { useEffect, useRef } from 'react';

interface Props {
  distribution: Record<number, number>;
  avg: number;
  size?: number;
}

export default function RatingChart({ distribution, avg, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const prevAnglesRef = useRef<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;
    const lineWidth = size * 0.1;
    const segments = [5, 4, 3, 2, 1];
    const colors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

    const targetAngles: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let startAngle = -Math.PI / 2;
    segments.forEach((s) => {
      const count = distribution[s] || 0;
      const pct = total > 0 ? count / total : 0;
      targetAngles[s] = pct * Math.PI * 2;
      startAngle += targetAngles[s];
    });

    const prevAngles = { ...prevAnglesRef.current };
    const duration = 800;
    const startTime = performance.now();

    const drawFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#fef3c7');
      bgGrad.addColorStop(1, '#fed7aa');
      ctx.beginPath();
      ctx.arc(cx, cy, radius - lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;

      let angle = -Math.PI / 2;
      segments.forEach((s, i) => {
        const prevSweep = prevAngles[s] || 0;
        const targetSweep = targetAngles[s] || 0;
        const currentSweep = prevSweep + (targetSweep - prevSweep) * ease;
        if (currentSweep <= 0.001) return;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, angle, angle + currentSweep);
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = lineWidth;
        ctx.lineCap = currentSweep >= Math.PI * 1.99 ? 'butt' : 'round';
        ctx.stroke();
        angle += currentSweep;
      });

      const displayAvg = total > 0 ? avg * ease : 0;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f97316';
      ctx.font = `bold ${size * 0.22}px "Playfair Display", Georgia, serif`;
      ctx.fillText(displayAvg.toFixed(1), cx, cy - 4);
      ctx.fillStyle = '#64748b';
      ctx.font = `${size * 0.09}px "Noto Sans SC", sans-serif`;
      ctx.fillText(`共 ${total} 条评分`, cx, cy + size * 0.14);
      ctx.restore();

      if (progress < 1) {
        animRef.current = requestAnimationFrame(drawFrame);
      } else {
        prevAnglesRef.current = { ...targetAngles };
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animRef.current);
  }, [distribution, avg, size]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
      <div className="grid grid-cols-5 gap-3 mt-5 w-full">
        {[5, 4, 3, 2, 1].map((s) => {
          const count = distribution[s] || 0;
          const total = Object.values(distribution).reduce((a, b) => a + b, 0);
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const colorMap: Record<number, string> = {
            5: 'bg-orange-500', 4: 'bg-orange-400', 3: 'bg-orange-300', 2: 'bg-orange-200', 1: 'bg-orange-100'
          };
          return (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-0.5 text-xs font-medium text-city-dark">
                <span>{s}</span>
                <span className="text-amber-400">★</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorMap[s]} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-city-light">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
