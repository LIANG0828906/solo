import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { zodiacSigns } from '../data/zodiacSigns';
import { PanelData } from '../types';

export function AstroDisk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const pulsePhaseRef = useRef(0);
  const fadeRef = useRef(1);
  const fadeDirectionRef = useRef(1);
  const { mix, isEclipsing, openPanel } = useAppStore();

  const opacity = 1 - mix;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.4;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.1,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0a0a0a');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationRef.current);

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * fadeRef.current})`;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      zodiacSigns.forEach((sign) => {
        const angle = (sign.angle * Math.PI) / 180;
        const x = Math.cos(angle) * radius * 0.75;
        const y = Math.sin(angle) * radius * 0.75;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);

        const letterOpacity = opacity * fadeRef.current;
        ctx.fillStyle = sign.color;
        ctx.globalAlpha = letterOpacity;
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sign.letter, 0, 0);

        ctx.restore();
      });

      ctx.restore();

      const pulseScale = 1 + 0.3 * Math.sin(pulsePhaseRef.current);
      const northStarSize = 8 * pulseScale;

      const northStarGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, northStarSize * 2
      );
      northStarGradient.addColorStop(0, '#d4af37');
      northStarGradient.addColorStop(0.5, '#b8860b');
      northStarGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, northStarSize * 2, 0, Math.PI * 2);
      ctx.fillStyle = northStarGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, northStarSize * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#fffacd';
      ctx.fill();

      if (isEclipsing) {
        rotationRef.current += 0.02;
        pulsePhaseRef.current += 0.15;

        fadeRef.current += fadeDirectionRef.current * 0.01;
        if (fadeRef.current <= 0.2) {
          fadeDirectionRef.current = 1;
        }
        if (fadeRef.current >= 1) {
          fadeDirectionRef.current = -1;
        }
      } else {
        rotationRef.current *= 0.98;
        pulsePhaseRef.current += 0.03;
        fadeRef.current += (1 - fadeRef.current) * 0.05;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isEclipsing, opacity]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.4;

    zodiacSigns.forEach((sign) => {
      const angle = (sign.angle * Math.PI) / 180 + rotationRef.current;
      const signX = centerX + Math.cos(angle) * radius * 0.75;
      const signY = centerY + Math.sin(angle) * radius * 0.75;

      const dist = Math.sqrt((x - signX) ** 2 + (y - signY) ** 2);
      if (dist < 20) {
        const panelData: PanelData = {
          title: `${sign.letter} - ${sign.name}`,
          azimuth: sign.angle,
          description: sign.description,
          type: 'zodiac',
        };
        openPanel(panelData);
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: opacity,
        mixBlendMode: 'multiply',
        cursor: 'pointer',
      }}
    />
  );
}
