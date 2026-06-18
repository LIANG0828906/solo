import React, { useEffect, useRef, useState } from 'react';
import type { Seat } from '../hooks/useSseData';

interface StatsPanelProps {
  seats: Seat[];
  recentSpeed: number;
}

const FIREWORK_COLORS = [
  '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
  '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
  '#64FFDA', '#69F0AE', '#B2FF59', '#FFEE58',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ seats, recentSpeed }) => {
  const totalSeats = seats.length;
  const checkedInCount = seats.filter(s => s.checkedIn).length;
  const checkInRate = totalSeats > 0 ? (checkedInCount / totalSeats) * 100 : 0;
  const remaining = totalSeats - checkedInCount;
  const estimatedWaitTime = recentSpeed > 0 && remaining > 0
    ? Math.ceil(remaining / recentSpeed)
    : 0;

  const shouldGlow = checkInRate >= 80 && checkInRate < 100;

  const fireworksCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const firedFireworksRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (checkInRate >= 100 && !firedFireworksRef.current && totalSeats > 0) {
      firedFireworksRef.current = true;
      triggerFireworks();
    }
    if (checkInRate < 100) {
      firedFireworksRef.current = false;
    }
  }, [checkInRate, totalSeats]);

  const triggerFireworks = () => {
    setShowFireworks(true);
    particlesRef.current = [];

    const particleCount = Math.min(80, 60 + Math.floor(Math.random() * 21));

    for (let i = 0; i < particleCount; i++) {
      const cx = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
      const cy = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;

      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        life: 1,
        maxLife: 180 + Math.random() * 60,
        size: 2 + Math.random() * 3,
      });
    }

    animateFireworks();

    setTimeout(() => {
      setShowFireworks(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }, 3000);
  };

  const animateFireworks = () => {
    const canvas = fireworksCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) return false;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      ctx.globalAlpha = 1;

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    render();
  };

  return (
    <>
      <div className={`card stats-panel ${shouldGlow ? 'glow-border' : ''}`}>
        <h3 className="section-title">实时统计</h3>

        <div className="stat-item">
          <span className="stat-label">已签到人数</span>
          <span className="stat-value">
            {checkedInCount} <span style={{ fontSize: '16px', color: '#616161', fontWeight: 'normal' }}>/ {totalSeats}</span>
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">签到率</span>
          <span className="stat-value small">{checkInRate.toFixed(1)}%</span>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${checkInRate}%` }}
            />
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">预估排队时长</span>
          <span className="stat-value small">
            {estimatedWaitTime > 0 ? `${estimatedWaitTime} 分钟` : '—'}
          </span>
          <span style={{ fontSize: '12px', color: '#9E9E9E' }}>
            最近签到速度: {recentSpeed.toFixed(1)} 人/分钟
          </span>
        </div>
      </div>

      {showFireworks && (
        <div className="fireworks-container">
          <canvas
            ref={fireworksCanvasRef}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
    </>
  );
};
