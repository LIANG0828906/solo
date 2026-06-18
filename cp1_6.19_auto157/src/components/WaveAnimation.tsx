import { useEffect, useRef } from 'react';

const waveStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '120px',
  pointerEvents: 'none',
  zIndex: 1,
};

export default function WaveAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (let layer = 0; layer < 3; layer++) {
        const alpha = 0.08 + layer * 0.04;
        const amp = 8 + layer * 4;
        const freq = 0.008 + layer * 0.003;
        const speed = 0.03 + layer * 0.01;
        const yBase = 30 + layer * 25;

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
          const y = yBase + Math.sin(x * freq + t * speed) * amp + Math.sin(x * freq * 0.5 + t * speed * 1.3) * (amp * 0.5);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(74, 144, 217, ${alpha})`;
        ctx.fill();
      }

      t += 1;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={waveStyle} />;
}
