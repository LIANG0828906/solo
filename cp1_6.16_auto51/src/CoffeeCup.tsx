import { useEffect, useRef } from 'react';
import type { Particle } from './MilkParticle';

interface CoffeeCupProps {
  particles: Particle[];
  cupSize: number;
  onReset: () => void;
}

export function CoffeeCup({ particles, cupSize, onReset }: CoffeeCupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cupRadius = cupSize / 2 - 10;
  const cupCenter = { x: cupSize / 2, y: cupSize / 2 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cupSize, cupSize);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cupCenter.x, cupCenter.y, cupRadius, 0, Math.PI * 2);
    ctx.clip();

    const gradient = ctx.createRadialGradient(
      cupCenter.x,
      cupCenter.y - cupRadius * 0.2,
      0,
      cupCenter.x,
      cupCenter.y,
      cupRadius
    );
    gradient.addColorStop(0, '#5D4037');
    gradient.addColorStop(0.5, '#4E342E');
    gradient.addColorStop(1, '#3E2723');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cupSize, cupSize);

    particles.forEach((p) => {
      if (p.opacity <= 0) return;

      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
        ctx.lineWidth = p.radius * 0.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      if (!p.isSettled) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.settledRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }
    });

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cupCenter.x, cupCenter.y, cupRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 8;
    ctx.stroke();

    const rimGradient = ctx.createRadialGradient(
      cupCenter.x,
      cupCenter.y,
      cupRadius - 5,
      cupCenter.x,
      cupCenter.y,
      cupRadius + 10
    );
    rimGradient.addColorStop(0, 'rgba(62, 39, 35, 0)');
    rimGradient.addColorStop(0.5, 'rgba(62, 39, 35, 0.1)');
    rimGradient.addColorStop(1, 'rgba(62, 39, 35, 0)');

    ctx.beginPath();
    ctx.arc(cupCenter.x, cupCenter.y, cupRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = rimGradient;
    ctx.fill();
  }, [particles, cupSize, cupRadius, cupCenter.x, cupCenter.y]);

  return (
    <div style={{ position: 'relative', width: cupSize, height: cupSize }}>
      <canvas
        ref={canvasRef}
        width={cupSize}
        height={cupSize}
        style={{
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(62, 39, 35, 0.3)'
        }}
      />
      <button
        onClick={onReset}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '-50px',
          transform: 'translateX(-50%)',
          padding: '10px 24px',
          backgroundColor: '#6F4E37',
          color: '#F5F0E1',
          border: '2px solid #3E2723',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(62, 39, 35, 0.2)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(62, 39, 35, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(62, 39, 35, 0.2)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
        }}
      >
        开始新练习
      </button>
    </div>
  );
}
