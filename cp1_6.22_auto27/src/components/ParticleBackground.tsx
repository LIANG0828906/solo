import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

const COLORS = ['#FF6B35', '#7B2CBF', '#FFB199', '#C8A2D8', '#FFD700'];

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    particlesRef.current = particles;

    const particleElements = particles.map((p, idx) => {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.width = `${p.size}px`;
      el.style.height = `${p.size}px`;
      el.style.backgroundColor = p.color;
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.style.animationDelay = `${idx * 0.5}s`;
      container.appendChild(el);
      return el;
    });

    const animate = () => {
      particlesRef.current.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        if (particleElements[idx]) {
          particleElements[idx].style.left = `${p.x}px`;
          particleElements[idx].style.top = `${p.y}px`;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particleElements.forEach((el) => el.remove());
    };
  }, []);

  return <div ref={containerRef} className="particle-bg" />;
}
