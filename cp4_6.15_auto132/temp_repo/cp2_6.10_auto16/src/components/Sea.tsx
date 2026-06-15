import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { WaveParams, ShipMotion } from '../utils/navigation';

interface SeaProps {
  waveParams: WaveParams;
  shipMotion: ShipMotion;
  headingError: number;
  actualHeading: number;
  isStormMode: boolean;
  isShaking: boolean;
  flagDeflection: number;
  windSpeed: number;
  trackPoints: Array<{ x: number; y: number; timestamp: number }>;
}

const DEG_TO_RAD = Math.PI / 180;

export function Sea({
  waveParams,
  shipMotion,
  headingError,
  actualHeading,
  isStormMode,
  isShaking,
  flagDeflection,
  windSpeed,
  trackPoints
}: SeaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const waveOffsetRef = useRef(0);

  const drawWaves = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    params: WaveParams,
    storm: boolean
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (storm) {
      gradient.addColorStop(0, '#e9967a');
      gradient.addColorStop(0.5, '#cd853f');
      gradient.addColorStop(1, '#8b4513');
    } else {
      gradient.addColorStop(0, '#1a3a5a');
      gradient.addColorStop(0.5, '#1a4a3a');
      gradient.addColorStop(1, '#1a4a2a');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const waveCount = 3;
    const baseY = height * 0.5;
    const speed = storm ? 80 : 40;
    const amplitudeMultiplier = storm ? 1.3 : 1;

    waveOffsetRef.current += speed * 0.016;

    for (let layer = 0; layer < waveCount; layer++) {
      const layerOffset = layer * 0.5;
      const amplitude = (params.amplitude * amplitudeMultiplier * (15 + layer * 10));
      const frequency = (1 / params.period) * (1 + layer * 0.3);
      const directionOffset = params.direction * DEG_TO_RAD * (layer * 0.2);

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 2) {
        const waveX = (x + waveOffsetRef.current) * 0.01;
        const y = baseY + layer * 30 +
          Math.sin(waveX * frequency + directionOffset + time * 0.001 + layerOffset) * amplitude * 0.5 +
          Math.sin(waveX * frequency * 2.3 + directionOffset * 1.5 + time * 0.002) * amplitude * 0.3 +
          Math.sin(waveX * frequency * 0.7 + directionOffset * 0.8 + time * 0.0005) * amplitude * 0.2;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const alpha = 0.15 + layer * 0.15;
      if (storm) {
        ctx.fillStyle = `rgba(205, 133, 63, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(26, 74, 42, ${alpha})`;
      }
      ctx.fill();

      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const waveX = (x + waveOffsetRef.current) * 0.01;
        const y = baseY + layer * 30 +
          Math.sin(waveX * frequency + directionOffset + time * 0.001 + layerOffset) * amplitude * 0.5 +
          Math.sin(waveX * frequency * 2.3 + directionOffset * 1.5 + time * 0.002) * amplitude * 0.3 +
          Math.sin(waveX * frequency * 0.7 + directionOffset * 0.8 + time * 0.0005) * amplitude * 0.2;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = storm ? `rgba(255, 215, 0, ${0.1 + layer * 0.05})` : `rgba(255, 255, 255, ${0.1 + layer * 0.05})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, []);

  const drawShip = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    motion: ShipMotion,
    flagDefl: number,
    wind: number,
    error: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(motion.rollX * DEG_TO_RAD * 0.3);
    ctx.translate(0, motion.heaveZ * 5);

    const shipWidth = 120;
    const shipHeight = 40;

    ctx.fillStyle = '#6b4e3a';
    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-shipWidth / 2, 0);
    ctx.quadraticCurveTo(-shipWidth / 2, shipHeight / 2, 0, shipHeight / 2);
    ctx.quadraticCurveTo(shipWidth / 2, shipHeight / 2, shipWidth / 2, 0);
    ctx.quadraticCurveTo(shipWidth / 2 - 10, -5, 0, -5);
    ctx.quadraticCurveTo(-shipWidth / 2 + 10, -5, -shipWidth / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-shipWidth / 2 + 10, 5 + i * 10);
      ctx.lineTo(shipWidth / 2 - 10, 5 + i * 10);
      ctx.stroke();
    }

    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(-3, -80, 6, 80);

    ctx.save();
    ctx.translate(0, -75);
    const flagWave = Math.sin(Date.now() / 200) * 5;
    const flagAngle = (flagDefl / 90) * 30 + flagWave;
    
    ctx.rotate(flagAngle * DEG_TO_RAD);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(50, 0);
    ctx.lineTo(0, 30);
    ctx.closePath();
    
    const flagGradient = ctx.createLinearGradient(0, 0, 50, 30);
    flagGradient.addColorStop(0, '#e8c89a');
    flagGradient.addColorStop(1, '#d4a76a');
    ctx.fillStyle = flagGradient;
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8b0000';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('宋', 20, 20);
    ctx.restore();

    const bowX = shipWidth / 2;
    const trackLength = 80;
    
    ctx.save();
    ctx.translate(bowX - 5, shipHeight / 4);
    ctx.rotate(error * DEG_TO_RAD * 0.2);

    const trackColor = Math.abs(error) > 15 ? '#8b0000' : '#ffffff';
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    
    if (Math.abs(error) > 15) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(trackLength, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(trackLength, 0);
    ctx.lineTo(trackLength - 8, -5);
    ctx.moveTo(trackLength, 0);
    ctx.lineTo(trackLength - 8, 5);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(bowX - 5, shipHeight / 4);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(trackLength, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, []);

  const drawTrack = useCallback((
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number; timestamp: number }>,
    centerX: number,
    centerY: number
  ) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const offsetX = (p.x - centerX) * 0.5 + centerX;
      const offsetY = (p.y - centerY) * 0.5 + centerY;
      
      if (i === 0) {
        ctx.moveTo(offsetX, offsetY);
      } else {
        ctx.lineTo(offsetX, offsetY);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (timestamp: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      timeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);

      drawWaves(ctx, width, height, timestamp, waveParams, isStormMode);
      drawTrack(ctx, trackPoints, width / 2, height / 2);
      drawShip(ctx, width / 2, height / 2, shipMotion, flagDeflection, windSpeed, headingError);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [drawWaves, drawShip, drawTrack, waveParams, isStormMode, shipMotion, flagDeflection, windSpeed, headingError, trackPoints]);

  return (
    <motion.div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '3px solid var(--color-copper-gold)',
        boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)'
      }}
      animate={isShaking ? {
        x: [0, -3, 3, -2, 2, 0],
        y: [0, 2, -2, 3, -3, 0]
      } : {}}
      transition={{
        duration: 0.2,
        ease: 'easeInOut'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </motion.div>
  );
}
