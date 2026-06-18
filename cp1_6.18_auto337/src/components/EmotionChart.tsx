import React, { useEffect, useRef } from 'react';
import type { RecordingData } from '../lib/store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
}

interface EmotionChartProps {
  data: RecordingData;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#FFD93D',
  calm: '#6BCB77',
  sad: '#4F8FD3',
  angry: '#FF6B6B',
};

export const EmotionChart: React.FC<EmotionChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = 500;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = width / 2.5;

    const pointX = centerX + data.valence * scale;
    const pointY = centerY - data.arousal * scale;

    const mainColor = EMOTION_COLORS[data.emotionCategory] || '#FFFFFF';

    const createParticles = () => {
      const particles: Particle[] = [];
      const count = 20 + Math.floor(Math.random() * 11);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.0;
        const distance = 10 + Math.random() * 15;
        const size = 2 + Math.random() * 3;

        const r = parseInt(mainColor.slice(1, 3), 16);
        const g = parseInt(mainColor.slice(3, 5), 16);
        const b = parseInt(mainColor.slice(5, 7), 16);
        const alpha = 0.4 + Math.random() * 0.4;

        particles.push({
          x: pointX + Math.cos(angle) * distance,
          y: pointY + Math.sin(angle) * distance,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size,
          alpha,
          color: `rgba(${r}, ${g}, ${b}, ${alpha})`,
          trail: [],
        });
      }

      return particles;
    };

    particlesRef.current = createParticles();
    startTimeRef.current = Date.now();

    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width / 2);
      bgGradient.addColorStop(0, '#16213E');
      bgGradient.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;

      for (let i = -2; i <= 2; i++) {
        const x = centerX + i * scale / 2;
        const y = centerY + i * scale / 2;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#8892B0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      ctx.fillStyle = '#8892B0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', centerX + scale - 10, centerY + 20);
      ctx.fillText('-1', centerX - scale + 10, centerY + 20);
      ctx.textAlign = 'right';
      ctx.fillText('1', centerX - 10, centerY - scale + 15);
      ctx.fillText('-1', centerX - 10, centerY + scale - 5);

      ctx.fillStyle = '#667EEA';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('愉悦度', width - 40, centerY + 40);

      ctx.save();
      ctx.translate(40, 40);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('激活度', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#8892B0';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('高唤醒', width - 10, 30);
      ctx.fillText('低唤醒', width - 10, height - 10);
      ctx.textAlign = 'left';
      ctx.fillText('低愉悦', 10, height - 10);
      ctx.textAlign = 'right';
      ctx.fillText('高愉悦', width - 10, height - 10);
    };

    const drawEmotionPoint = () => {
      ctx.save();
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.5;

      const gradient = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 15);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 5;
      ctx.globalAlpha = 0.8;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pointX, pointY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawParticles = (elapsed: number) => {
      const maxDuration = 5000;
      const fadeStart = 3000;

      particlesRef.current.forEach((particle) => {
        particle.trail.unshift({ x: particle.x, y: particle.y, alpha: particle.alpha });
        if (particle.trail.length > 10) {
          particle.trail.pop();
        }

        for (let i = 0; i < particle.trail.length; i++) {
          const trail = particle.trail[i];
          const trailAlpha = (trail.alpha * (1 - i / particle.trail.length)) * 0.5;

          ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${trailAlpha})`);
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, particle.size * (1 - i / particle.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        let alpha = particle.alpha;
        if (elapsed > fadeStart) {
          alpha = alpha * (1 - (elapsed - fadeStart) / (maxDuration - fadeStart));
        }

        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed > 5000) {
        drawGrid();
        drawEmotionPoint();
        return;
      }

      drawGrid();
      drawParticles(elapsed);
      drawEmotionPoint();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
        />
        <div style={styles.legend}>
          <div style={styles.legendTitle}>情绪类别</div>
          <div style={styles.legendItems}>
            {Object.entries(EMOTION_COLORS).map(([key, color]) => (
              <div key={key} style={styles.legendItem}>
                <div style={{ ...styles.legendDot, backgroundColor: color }} />
                <span style={styles.legendText}>
                  {key === 'happy' ? '开心' : key === 'calm' ? '平静' : key === 'sad' ? '忧伤' : '愤怒'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  card: {
    backgroundColor: '#16213E',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  canvas: {
    borderRadius: '12px',
    display: 'block',
  },
  legend: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#0F172A',
    borderRadius: '12px',
  },
  legendTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#E2E2E2',
    marginBottom: '12px',
  },
  legendItems: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  legendText: {
    fontSize: '13px',
    color: '#8892B0',
  },
};
