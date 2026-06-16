import React, { useRef, useEffect, useCallback } from 'react';

interface WaveformProps {
  progress: number;
  isPlaying: boolean;
  audioData?: Uint8Array;
}

const Waveform: React.FC<WaveformProps> = React.memo(({ progress, isPlaying, audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const generateWaveformData = useCallback((baseProgress: number, time: number, width: number): number[] => {
    const points: number[] = [];
    const segmentCount = 100;

    for (let i = 0; i <= segmentCount; i++) {
      const x = i / segmentCount;
      const distanceFromProgress = Math.abs(x - baseProgress);

      let amplitude = 0;
      if (x <= baseProgress) {
        const rhythm = Math.sin(time * 3 + x * 20) * 0.3 + 0.7;
        amplitude = (1 - distanceFromProgress * 1.5) * rhythm * 0.6;
        amplitude += Math.sin(time * 5 + x * 30) * 0.15;
        amplitude += Math.sin(time * 2 + x * 10) * 0.1;
      } else {
        amplitude = 0.05 + Math.sin(time * 2 + x * 15) * 0.03;
      }

      points.push(Math.max(0.02, amplitude));
    }

    return points;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    if (isPlaying) {
      timeRef.current += 0.016;
    }

    const amplitudes = generateWaveformData(progress, timeRef.current, width);
    const segmentWidth = width / (amplitudes.length - 1);

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(progress, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(Math.min(progress + 0.05, 1), 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < amplitudes.length; i++) {
      const x = i * segmentWidth;
      const amp = amplitudes[i] * height * 0.4;
      const y = centerY - amp;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * segmentWidth;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, centerY - amplitudes[i - 1] * height * 0.4, cpX, (centerY - amplitudes[i - 1] * height * 0.4 + y) / 2);
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }

    for (let i = amplitudes.length - 1; i >= 0; i--) {
      const x = i * segmentWidth;
      const amp = amplitudes[i] * height * 0.4;
      const y = centerY + amp;

      if (i === amplitudes.length - 1) {
        ctx.lineTo(x, y);
      } else {
        const nextX = (i + 1) * segmentWidth;
        const cpX = (nextX + x) / 2;
        ctx.quadraticCurveTo(nextX, centerY + amplitudes[i + 1] * height * 0.4, cpX, (centerY + amplitudes[i + 1] * height * 0.4 + y) / 2);
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }

    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < amplitudes.length; i++) {
      const x = i * segmentWidth;
      const amp = amplitudes[i] * height * 0.4;
      const y = centerY - amp;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * segmentWidth;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, centerY - amplitudes[i - 1] * height * 0.4, cpX, (centerY - amplitudes[i - 1] * height * 0.4 + y) / 2);
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }
    ctx.stroke();

    const scanX = progress * width;
    ctx.strokeStyle = 'rgba(230, 57, 70, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scanX, 10);
    ctx.lineTo(scanX, height - 10);
    ctx.stroke();

    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.arc(scanX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [progress, isPlaying, generateWaveformData]);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '80px',
        display: 'block',
        willChange: 'transform',
      }}
    />
  );
});

Waveform.displayName = 'Waveform';

export default Waveform;
