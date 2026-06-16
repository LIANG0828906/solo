import { useEffect, useRef } from 'react';

interface WaveLayer {
  color: string;
  amplitude: number;
  frequency: number;
  speed: number;
  yOffset: number;
  phase: number;
}

const AuroraCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const waveLayers: WaveLayer[] = [
      {
        color: 'rgba(0, 255, 204, 0.15)',
        amplitude: 80,
        frequency: 0.008,
        speed: 0.015,
        yOffset: 0.25,
        phase: 0,
      },
      {
        color: 'rgba(153, 51, 255, 0.12)',
        amplitude: 100,
        frequency: 0.006,
        speed: 0.012,
        yOffset: 0.45,
        phase: Math.PI / 3,
      },
      {
        color: 'rgba(255, 102, 204, 0.1)',
        amplitude: 120,
        frequency: 0.005,
        speed: 0.01,
        yOffset: 0.65,
        phase: Math.PI / 2,
      },
      {
        color: 'rgba(0, 255, 204, 0.08)',
        amplitude: 60,
        frequency: 0.01,
        speed: 0.02,
        yOffset: 0.35,
        phase: Math.PI,
      },
      {
        color: 'rgba(153, 51, 255, 0.07)',
        amplitude: 90,
        frequency: 0.007,
        speed: 0.014,
        yOffset: 0.55,
        phase: -Math.PI / 4,
      },
    ];

    const drawWave = (layer: WaveLayer, time: number) => {
      const { width, height } = canvas;
      const baseY = height * layer.yOffset;

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 2) {
        const y = baseY
          + Math.sin(x * layer.frequency + time * layer.speed + layer.phase) * layer.amplitude
          + Math.sin(x * layer.frequency * 0.5 + time * layer.speed * 0.7 + layer.phase * 2) * layer.amplitude * 0.5;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, baseY - layer.amplitude, 0, height);
      gradient.addColorStop(0, layer.color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fill();
    };

    let time = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      time += deltaTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0a1a');
      bgGradient.addColorStop(0.5, '#0d0d25');
      bgGradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const layer of waveLayers) {
        drawWave(layer, time);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="aurora-canvas" />;
};

export default AuroraCanvas;
