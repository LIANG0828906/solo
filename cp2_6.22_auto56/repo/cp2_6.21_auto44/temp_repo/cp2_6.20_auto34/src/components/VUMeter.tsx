import React, { useEffect, useRef } from 'react';

interface VUMeterProps {
  levelLeft: number;
  levelRight: number;
  width?: number;
  height?: number;
}

const VUMeter: React.FC<VUMeterProps> = ({
  levelLeft,
  levelRight,
  width = 120,
  height = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const smoothedLevelRef = useRef({ left: 0, right: 0 });
  const peakHoldRef = useRef({ left: 0, right: 0 });
  const peakDecayRef = useRef({ left: 0, right: 0 });

  const getColor = (value: number): string => {
    if (value < 0.6) {
      const t = value / 0.6;
      const r = Math.floor(34 + t * (234 - 34));
      const g = Math.floor(197 + t * (220 - 197));
      const b = Math.floor(94);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (value < 0.85) {
      const t = (value - 0.6) / 0.25;
      const r = Math.floor(234 + t * (251 - 234));
      const g = Math.floor(220 - t * (220 - 191));
      const b = Math.floor(94 - t * 94);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (value - 0.85) / 0.15;
      const r = Math.floor(251);
      const g = Math.floor(191 - t * 191);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = { top: 15, right: 20, bottom: 25, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barGap = 6;
    const barWidth = (chartWidth - barGap) / 2;

    const drawMeter = () => {
      ctx.clearRect(0, 0, width, height);

      const attack = 0.8;

      smoothedLevelRef.current.left =
        smoothedLevelRef.current.left * (1 - attack) +
        Math.min(levelLeft, 1) * attack;
      smoothedLevelRef.current.right =
        smoothedLevelRef.current.right * (1 - attack) +
        Math.min(levelRight, 1) * attack;

      const currentLeft = smoothedLevelRef.current.left;
      const currentRight = smoothedLevelRef.current.right;

      if (currentLeft > peakHoldRef.current.left) {
        peakHoldRef.current.left = currentLeft;
        peakDecayRef.current.left = 0;
      } else {
        peakDecayRef.current.left += 0.016;
        if (peakDecayRef.current.left > 1.5) {
          peakHoldRef.current.left = Math.max(
            0,
            peakHoldRef.current.left - 0.02
          );
        }
      }

      if (currentRight > peakHoldRef.current.right) {
        peakHoldRef.current.right = currentRight;
        peakDecayRef.current.right = 0;
      } else {
        peakDecayRef.current.right += 0.016;
        if (peakDecayRef.current.right > 1.5) {
          peakHoldRef.current.right = Math.max(
            0,
            peakHoldRef.current.right - 0.02
          );
        }
      }

      const drawBar = (x: number, level: number, peak: number, label: string) => {
        const barHeight = chartHeight;
        const barX = x;
        const barY = padding.top + barHeight;

        const gradient = ctx.createLinearGradient(0, padding.top, 0, barY);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.2, '#f59e0b');
        gradient.addColorStop(0.4, '#84cc16');
        gradient.addColorStop(1, '#22c55e');

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(barX, padding.top, barWidth, barHeight);

        ctx.strokeStyle = '#2d2d44';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
          const y = padding.top + (barHeight / 10) * i;
          ctx.beginPath();
          ctx.moveTo(barX, y);
          ctx.lineTo(barX + barWidth, y);
          ctx.stroke();
        }

        const levelHeight = level * barHeight;
        const levelY = barY - levelHeight;

        ctx.save();
        ctx.beginPath();
        ctx.rect(barX, levelY, barWidth, levelHeight);
        ctx.clip();

        const fillGradient = ctx.createLinearGradient(
          0,
          padding.top,
          0,
          barY
        );
        fillGradient.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        fillGradient.addColorStop(0.25, 'rgba(245, 158, 11, 0.9)');
        fillGradient.addColorStop(0.5, 'rgba(132, 204, 22, 0.9)');
        fillGradient.addColorStop(1, 'rgba(34, 197, 94, 0.9)');

        ctx.fillStyle = fillGradient;
        ctx.fillRect(barX, levelY, barWidth, levelHeight);
        ctx.restore();

        ctx.shadowColor = getColor(level);
        ctx.shadowBlur = 8;
        const peakY = barY - peak * barHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX, peakY - 2, barWidth, 3);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, barX + barWidth / 2, height - 8);
      };

      drawBar(
        padding.left,
        smoothedLevelRef.current.left,
        peakHoldRef.current.left,
        'L'
      );
      drawBar(
        padding.left + barWidth + barGap,
        smoothedLevelRef.current.right,
        peakHoldRef.current.right,
        'R'
      );

      ctx.fillStyle = '#6b7280';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      const labels = ['0dB', '-6dB', '-12dB', '-18dB', '-24dB'];
      for (let i = 0; i < labels.length; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.fillText(labels[i], width - 5, y + 3);
      }

      animationRef.current = requestAnimationFrame(drawMeter);
    };

    drawMeter();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [levelLeft, levelRight, width, height]);

  return (
    <div className="bg-gray-900/50 rounded-lg p-1 border border-gray-700/50">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
      />
    </div>
  );
};

export default VUMeter;
