import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
}

interface Nebula {
  x: number;
  y: number;
  r: number;
  color: string;
  speed: number;
  angle: number;
  radius: number;
}

export function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

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

    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.3 + 0.1,
      });
    }

    const nebulaColors = [
      'rgba(139, 92, 246, 0.15)',
      'rgba(59, 130, 246, 0.12)',
      'rgba(236, 72, 153, 0.1)',
      'rgba(16, 185, 129, 0.08)',
    ];

    const nebulas: Nebula[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 200 + 100;
      nebulas.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        r: Math.random() * 200 + 150,
        color: nebulaColors[i % nebulaColors.length],
        speed: (Math.random() - 0.5) * 0.001,
        angle,
        radius,
      });
    }

    let time = 0;

    const animate = () => {
      time += 0.005;

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < nebulas.length; i++) {
        const n = nebulas[i];
        n.angle += n.speed;
        n.x = centerX + Math.cos(n.angle) * n.radius + Math.sin(time + i) * 30;
        n.y = centerY + Math.sin(n.angle) * n.radius + Math.cos(time + i) * 30;

        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        gradient.addColorStop(0, n.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const star of stars) {
        star.alpha = 0.3 + Math.sin(time * 2 + star.x * 0.01) * 0.3 + 0.2;
        star.x += star.speed * 0.1;
        if (star.x > canvas.width) star.x = 0;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
