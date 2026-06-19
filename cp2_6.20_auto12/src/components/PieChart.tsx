import { useRef, useEffect, memo, useMemo } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
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

  const sortedSlots = useMemo(() => {
    return [...slotCounts].sort((a, b) => b.count - a.count);
  }, [slotCounts]);

  const totalVotes = useMemo(() => {
    return slotCounts.reduce((sum, s) => sum + s.count, 0);
  }, [slotCounts]);

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

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.stroke();

        if (currentValues[index] / currentTotal >= 0.08) {
          const midAngle = startAngle + sliceAngle / 2;
          const labelRadius = (radius + innerRadius) / 2;
          const labelX = centerX + Math.cos(midAngle) * labelRadius;
          const labelY = centerY + Math.sin(midAngle) * labelRadius;

          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 2;
          const pct = Math.round((currentValues[index] / currentTotal) * 100);
          ctx.fillText(`${pct}%`, labelX, labelY);
          ctx.shadowBlur = 0;
        }

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 1:
        return <Medal className="w-4 h-4 text-slate-300" />;
      case 2:
        return <Award className="w-4 h-4 text-amber-700" />;
      default:
        return (
          <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-dark-400">
            {rank + 1}
          </span>
        );
    }
  };

  const getSlotColor = (slotId: string) => {
    const originalIndex = slotCounts.findIndex((s) => s.slotId === slotId);
    return COLORS[originalIndex % COLORS.length];
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5">
        <div className="relative" style={{ width: size, height: size }}>
          <canvas
            ref={canvasRef}
            style={{ width: size, height: size }}
            className="drop-shadow-lg"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-2xl font-bold text-dark-100">{totalVotes}</div>
            <div className="text-xs text-dark-400">总投票</div>
          </div>
        </div>

        <div className="space-y-1.5 flex-1 max-h-44 overflow-y-auto pr-1">
          {slotCounts.length === 0 ? (
            <div className="text-center py-6 text-dark-500 text-sm">暂无投票数据</div>
          ) : (
            slotCounts.map((slot, index) => {
              const timeSlot = timeSlots.find((t) => t.id === slot.slotId);
              const pct =
                totalVotes > 0 ? Math.round((slot.count / totalVotes) * 100) : 0;
              return (
                <div
                  key={slot.slotId}
                  className="flex items-center gap-2 text-xs py-1 hover:bg-dark-700/50 rounded px-1.5 transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-dark-200 truncate font-medium">
                      {timeSlot?.date || slot.slotId}
                    </div>
                    <div className="text-dark-500">
                      {timeSlot?.startTime} - {timeSlot?.endTime}
                    </div>
                  </div>
                  <div className="text-dark-300 font-semibold flex-shrink-0 text-right">
                    <div>{slot.count}人</div>
                    <div className="text-[10px] text-dark-500">{pct}%</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-dark-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-dark-200">热门时段排名</span>
        </div>

        <div className="space-y-2">
          {sortedSlots.length === 0 ? (
            <div className="text-center py-4 text-dark-500 text-xs">暂无排名数据</div>
          ) : (
            sortedSlots.slice(0, 5).map((slot, rank) => {
              const timeSlot = timeSlots.find((t) => t.id === slot.slotId);
              const pct =
                totalVotes > 0 ? Math.round((slot.count / totalVotes) * 100) : 0;
              const isTopThree = rank < 3;

              return (
                <div
                  key={slot.slotId}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                    isTopThree
                      ? rank === 0
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-dark-700/40 border border-dark-600'
                      : 'bg-dark-800/50'
                  }`}
                  style={{
                    animation: `fade-in-up 0.4s ease-out ${rank * 0.05}s both`,
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      rank === 0
                        ? 'bg-amber-500/20'
                        : rank === 1
                        ? 'bg-slate-400/20'
                        : rank === 2
                        ? 'bg-amber-700/20'
                        : 'bg-dark-700'
                    }`}
                  >
                    {getRankIcon(rank)}
                  </div>

                  <div className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getSlotColor(slot.slotId) }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-dark-100 truncate">
                      {timeSlot?.date || slot.slotId}
                    </div>
                    <div className="text-xs text-dark-400">
                      {timeSlot?.startTime} - {timeSlot?.endTime}
                    </div>
                  </div>

                  <div className="flex-1 max-w-[120px] hidden sm:block">
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: getSlotColor(slot.slotId),
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-sm font-bold ${
                        rank === 0
                          ? 'text-amber-400'
                          : rank === 1
                          ? 'text-slate-300'
                          : rank === 2
                          ? 'text-amber-700'
                          : 'text-dark-300'
                      }`}
                    >
                      {slot.count}人
                    </div>
                    <div className="text-[10px] text-dark-500">{pct}%</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default PieChart;
