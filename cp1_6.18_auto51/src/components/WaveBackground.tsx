import { useEffect, useRef } from 'react';

const WaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const waves = [
      { amplitude: 40, wavelength: 0.008, speed: 0.02, yOffset: 0.65, color: '#1A3A5C', opacity: 0.3 },
      { amplitude: 55, wavelength: 0.006, speed: 0.015, yOffset: 0.72, color: '#234A72', opacity: 0.45 },
      { amplitude: 70, wavelength: 0.005, speed: 0.01, yOffset: 0.8, color: '#2D5A8A', opacity: 0.6 }
    ];

    let time = 0;
    const PERIOD = 4000;
    let startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      time = (elapsed % PERIOD) / PERIOD * Math.PI * 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = canvas.height * wave.yOffset
            + Math.sin(x * wave.wavelength + time * (wave.speed * 100)) * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        ctx.fillStyle = wave.color;
        ctx.globalAlpha = wave.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}
    />
  );
};

export default WaveBackground;
