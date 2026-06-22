import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';

const RADAR_SIZE = 100;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RANGE = 20;

const HUD: React.FC = () => {
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  const position = usePlayerStore((s) => s.position);
  const echoes = usePlayerStore((s) => s.echoes);
  const soundIntensity = usePlayerStore((s) => s.soundIntensity);
  const steps = usePlayerStore((s) => s.steps);

  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

    ctx.fillStyle = 'rgba(26, 26, 46, 0.7)';
    ctx.beginPath();
    ctx.arc(RADAR_CENTER, RADAR_CENTER, RADAR_CENTER, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 0.5;
    for (let r = 15; r < RADAR_CENTER; r += 15) {
      ctx.beginPath();
      ctx.arc(RADAR_CENTER, RADAR_CENTER, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(RADAR_CENTER, 0);
    ctx.lineTo(RADAR_CENTER, RADAR_SIZE);
    ctx.moveTo(0, RADAR_CENTER);
    ctx.lineTo(RADAR_SIZE, RADAR_CENTER);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(RADAR_CENTER, RADAR_CENTER, 2, 0, Math.PI * 2);
    ctx.fill();

    const flashPhase = (Date.now() % 1000) / 1000;
    const flashAlpha = 0.4 + Math.sin(flashPhase * Math.PI * 2) * 0.6;

    for (const echo of echoes) {
      const rad = (echo.angle * Math.PI) / 180;
      const echoDist = echo.intensity * RADAR_CENTER * 0.8;
      const ex = RADAR_CENTER + Math.cos(rad) * echoDist;
      const ey = RADAR_CENTER - Math.sin(rad) * echoDist;

      ctx.fillStyle = `rgba(0, 229, 255, ${flashAlpha})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(0, 229, 255, ${flashAlpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(RADAR_CENTER, RADAR_CENTER, RADAR_CENTER - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [position, echoes]);

  const intensityBarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 16,
    bottom: 20,
    width: 20,
    height: 120,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const fillHeight = (soundIntensity / 100) * 120;
  const intensityFillStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: `${fillHeight}px`,
    background: 'linear-gradient(to top, #00E5FF, #FF6B6B)',
    borderRadius: '0 0 3px 3px',
    transition: 'height 0.1s ease-out',
  };

  const stepCounterStyle: React.CSSProperties = {
    position: 'fixed',
    right: 20,
    bottom: 20,
    color: '#FFFFFF',
    fontSize: '16px',
    fontFamily: 'monospace',
    textShadow: '0 0 6px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4)',
    userSelect: 'none',
  };

  return (
    <>
      <canvas
        ref={radarCanvasRef}
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        style={{
          position: 'fixed',
          left: 16,
          top: 16,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div style={intensityBarStyle}>
        <div style={intensityFillStyle} />
      </div>
      <div style={stepCounterStyle}>
        步数: {steps}
      </div>
    </>
  );
};

export default HUD;
