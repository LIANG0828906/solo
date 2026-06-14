import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Star, CheckCircle, Users, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MemberTaskStats {
  id: string;
  name: string;
  avatar?: string;
  taskCount: number;
  completedTasks: number;
  points: number;
  color?: string;
}

export interface CategoryStats {
  name: string;
  count: number;
}

interface WeeklyReportProps {
  memberStats: MemberTaskStats[];
  categoryStats: CategoryStats[];
  totalTasks: number;
  totalPoints: number;
  completionRate: number;
  className?: string;
}

function useCanvasAnimation(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  draw: (ctx: CanvasRenderingContext2D, progress: number, width: number, height: number) => void,
  deps: unknown[],
  duration = 1500
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      ctx.clearRect(0, 0, width, height);
      draw(ctx, eased, width, height);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, deps);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function BarChart({ data, memberStats }: { data: number[]; memberStats: MemberTaskStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = (
    ctx: CanvasRenderingContext2D,
    progress: number,
    width: number,
    height: number
  ) => {
    const padding = { top: 40, right: 24, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data, 1);
    const barCount = data.length;
    const barWidth = (chartWidth / barCount) * 0.6;
    const barGap = (chartWidth / barCount) * 0.4;

    ctx.strokeStyle = '#F2EDE4';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const value = Math.round(maxValue - (maxValue / 4) * i);
      ctx.fillText(String(value), padding.left - 8, y);
    }

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight * progress;
      const x = padding.left + barGap / 2 + (chartWidth / barCount) * index;
      const y = padding.top + chartHeight - barHeight;

      const color = memberStats[index]?.color || '#FF8C42';
      const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '40');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = Math.min(8, barWidth / 2);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, padding.top + chartHeight);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#6B7280';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const name = memberStats[index]?.name || '';
      const maxChars = 4;
      const displayName = name.length > maxChars ? name.slice(0, maxChars) + '...' : name;
      ctx.fillText(displayName, x + barWidth / 2, height - padding.bottom + 12);

      if (progress > 0.85) {
        const alpha = Math.min(1, (progress - 0.85) / 0.15);
        ctx.fillStyle = `rgba(55, 65, 81, ${alpha})`;
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(value), x + barWidth / 2, y - 6);
      }
    });
  };

  useCanvasAnimation(canvasRef, draw, [data, memberStats]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '280px' }}
    />
  );
}

function RadarChart({ data }: { data: CategoryStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = (
    ctx: CanvasRenderingContext2D,
    progress: number,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2;

    const maxValue = Math.max(...data.map((d) => d.count), 1);

    for (let level = 4; level >= 1; level--) {
      const levelRadius = (radius / 4) * level;
      ctx.strokeStyle = level === 4 ? '#E5DDCE' : '#F2EDE4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const angle = startAngle + angleStep * i;
        const x = centerX + levelRadius * Math.cos(angle);
        const y = centerY + levelRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      if (level === 2 || level === 4) {
        ctx.fillStyle = '#D1D5DB';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const labelValue = Math.round((maxValue / 4) * level);
        ctx.fillText(String(labelValue), centerX + 4, centerY - levelRadius);
      }
    }

    ctx.strokeStyle = '#E5DDCE';
    ctx.lineWidth = 1;
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + angleStep * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    const fillProgress = Math.min(1, progress * 1.2);
    ctx.fillStyle = 'rgba(255, 140, 66, 0.25)';
    ctx.strokeStyle = '#FF8C42';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((item, index) => {
      const value = (item.count / maxValue) * radius * fillProgress;
      const angle = startAngle + angleStep * index;
      const x = centerX + value * Math.cos(angle);
      const y = centerY + value * Math.sin(angle);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (progress > 0.7) {
      const dotProgress = Math.min(1, (progress - 0.7) / 0.3);
      data.forEach((item, index) => {
        const value = (item.count / maxValue) * radius * fillProgress;
        const angle = startAngle + angleStep * index;
        const x = centerX + value * Math.cos(angle);
        const y = centerY + value * Math.sin(angle);

        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.arc(x, y, 4 * dotProgress, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, 2 * dotProgress, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    data.forEach((item, index) => {
      const angle = startAngle + angleStep * index;
      const labelRadius = radius + 28;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      ctx.fillStyle = '#4B5563';
      ctx.font = '600 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, labelX, labelY);
    });
  };

  useCanvasAnimation(canvasRef, draw, [data], 1800);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '320px' }}
    />
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  suffix = '',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;

    const duration = 1200;
    const startTime = performance.now();
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [value]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            bgColor
          )}
        >
          <Icon className={cn('h-6 w-6', color)} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={cn('text-2xl font-bold', color)}>
            {typeof value === 'number' ? displayValue : value}
            {suffix}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyReport({
  memberStats,
  categoryStats,
  totalTasks,
  totalPoints,
  completionRate,
  className,
}: WeeklyReportProps) {
  const sortedStats = [...memberStats].sort((a, b) => b.completedTasks - a.completedTasks);
  const barData = sortedStats.map((m) => m.completedTasks);

  const topPerformer = sortedStats[0];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="完成任务"
          value={totalTasks}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={Star}
          label="获得积分"
          value={totalPoints}
          color="text-primary-600"
          bgColor="bg-primary-100"
        />
        <StatCard
          icon={Target}
          label="完成率"
          value={Math.round(completionRate * 100)}
          color="text-blue-600"
          bgColor="bg-blue-100"
          suffix="%"
        />
        <StatCard
          icon={Users}
          label="参与成员"
          value={memberStats.filter(m => m.completedTasks > 0).length}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-800">成员任务对比</h3>
          </div>
          <BarChart data={barData} memberStats={sortedStats} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">任务类型偏好</h3>
          </div>
          <RadarChart data={categoryStats} />
        </div>
      </div>

      {topPerformer && topPerformer.completedTasks > 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                {topPerformer.avatar || '🏆'}
              </div>
              <div>
                <p className="text-sm text-white/80">本周之星</p>
                <p className="text-2xl font-bold">{topPerformer.name}</p>
                <p className="text-sm text-white/80">
                  完成 {topPerformer.completedTasks} 个任务 · 获得 {topPerformer.points} 积分
                </p>
              </div>
            </div>
            <div className="text-right">
              <Trophy className="h-12 w-12 text-yellow-300 fill-yellow-300" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
