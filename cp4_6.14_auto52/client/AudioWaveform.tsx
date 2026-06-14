import { useRef, useEffect } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  themeColor?: string;
}

function AudioWaveform({ isPlaying, themeColor = '#6366f1' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = 4;
    const barGap = 2;
    const barCount = Math.floor(canvas.width / (barWidth + barGap));
    
    if (barsRef.current.length === 0) {
      barsRef.current = Array(barCount).fill(0).map(() => Math.random() * 0.3 + 0.1);
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerY = canvas.height / 2;
      
      barsRef.current.forEach((height, i) => {
        const x = i * (barWidth + barGap);
        const barHeight = height * (canvas.height - 8);
        const y = centerY - barHeight / 2;
        
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, themeColor);
        gradient.addColorStop(1, adjustColor(themeColor, 30));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      });

      if (isPlaying) {
        barsRef.current = barsRef.current.map((bar, i) => {
          const target = Math.random() * 0.8 + 0.2;
          const smoothed = bar + (target - bar) * 0.2;
          return Math.max(0.1, Math.min(1, smoothed));
        });
      } else {
        barsRef.current = barsRef.current.map(bar => {
          const target = 0.15 + Math.sin(Date.now() / 1000 + bar * 10) * 0.05;
          return bar + (target - bar) * 0.1;
        });
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, themeColor]);

  const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <canvas
      ref={canvasRef}
      className="audio-waveform"
      width={260}
      height={40}
    />
  );
}

export default AudioWaveform;
