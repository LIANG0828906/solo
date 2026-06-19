import { useRef, useEffect, memo } from 'react';
import type { SlotVoteCount, TimeSlot } from '@/types';

interface PieChartProps {
  slotCounts: SlotVoteCount[];
  timeSlots: TimeSlot[];
  size?: number;
}

const COLORS = [
  '#8B5CF6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#84CC16',
];

const PieChart = memo(function PieChart({
  slotCounts,
  timeSlots,
  size = 200,
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const prevValuesRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const total = slotCounts.reduce((sum, s) => sum + s.count, 0);
    const targetValues = slotCounts.map((s) => (total > 0 ? s.count : 0));

    if (prevValuesRef.current.length !== targetValues.length) {
      prevValuesRef.current = new Array(targetValues.length).fill(0);
    }

    let progress = 0;
    const duration = 800;
    const startTime = performance.now();

    const draw = (currentValues: number[]) => {
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 8;
      const innerRadius = radius * 0.6;

      let startAngle = -Math.PI / 2;
      const currentTotal = currentValues.reduce((a, b) => a + b, 0);

      if (currentTotal === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        return;
      }

      slotCounts.forEach((slot, index) => {
        if (currentValues[index] === 0) return;

        const sliceAngle = (currentValues[index] / currentTotal) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();

        const color = COLORS[index % COLORS.length];
        ctx.fillStyle = color;
        ctx.fill();

        startAngle = endAngle;
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
    };

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      progress = Math.min(elapsed / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValues = targetValues.map((target, i) => {
        const prev = prevValuesRef.current[i] || 0;
        return prev + (target - prev) * easeProgress;
      });

      draw(currentValues);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValuesRef.current = [...targetValues];
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [slotCounts, size]);

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="drop-shadow-lg"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-dark-100">
            {slotCounts.reduce((sum, s) => sum + s.count, 0)}
          </div>
          <div className="text-xs text-dark-400">总投票</div>
        </div>
      </div>

      <div className="space-y-2 flex-1 max-h-48 overflow-y-auto">
        {slotCounts.map((slot, index) => {
          const timeSlot = timeSlots.find((t) => t.id === slot.slotId);
          return (
            <div key={slot.slotId} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-dark-200 truncate">
                  {timeSlot?.date || slot.slotId}
                </div>
                <div className="text-dark-500 text-xs">
                  {timeSlot?.startTime} - {timeSlot?.endTime}
                </div>
              </div>
              <div className="text-dark-300 font-medium flex-shrink-0">
                {slot.count}人
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default PieChart;
