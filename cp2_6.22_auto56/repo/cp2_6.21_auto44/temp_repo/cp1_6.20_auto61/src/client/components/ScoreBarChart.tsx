import { useEffect, useRef, useState } from 'react';
import { Team } from '@/client/types';
import { cn } from '@/lib/utils';

// 积分柱状图组件属性
interface ScoreBarChartProps {
  // 队伍数据数组
  teams: Team[];
  // 自定义类名
  className?: string;
}

// 数字滚动动画Hook
function useCountUp(targetValue: number, duration: number = 800): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValue = useRef(targetValue);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // 如果值没有变化，不执行动画
    if (targetValue === previousValue.current) {
      return;
    }

    const startValue = previousValue.current;
    const endValue = targetValue;
    const valueChange = endValue - startValue;

    // 清除之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;

    // 弹性缓动函数
    const elasticEaseOut = (t: number): number => {
      const p = 0.3;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    };

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = elasticEaseOut(progress);

      const currentValue = Math.round(startValue + valueChange * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

// 单个积分条组件
function ScoreBar({
  team,
  maxScore,
  rank,
}: {
  team: Team;
  maxScore: number;
  rank: number;
}) {
  // 使用滚动动画显示积分
  const displayScore = useCountUp(team.score);

  // 计算条形宽度百分比（最小5%以保证可见性）
  const barWidthPercent = maxScore > 0 ? Math.max((team.score / maxScore) * 100, 5) : 5;

  // 排名奖牌图标颜色
  const getRankStyle = (): { bg: string; text: string } => {
    switch (rank) {
      case 1:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
      case 2:
        return { bg: 'bg-gray-400/20', text: 'text-gray-300' };
      case 3:
        return { bg: 'bg-orange-600/20', text: 'text-orange-400' };
      default:
        return { bg: 'bg-white/10', text: 'text-white/60' };
    }
  };

  const rankStyle = getRankStyle();

  return (
    <div className="flex items-center gap-3 mb-3 last:mb-0">
      {/* 排名序号 */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'font-orbitron text-sm font-bold shrink-0',
          rankStyle.bg,
          rankStyle.text
        )}
      >
        {rank}
      </div>

      {/* 队伍名称 */}
      <div
        className="w-24 shrink-0 font-rajdhani font-semibold text-white truncate"
        title={team.name}
      >
        {team.name}
      </div>

      {/* 积分条形 */}
      <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg relative overflow-hidden"
          style={{
            width: `${barWidthPercent}%`,
            backgroundColor: team.color,
            transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: `0 0 15px ${team.color}80, 0 0 30px ${team.color}40`,
          }}
        >
          {/* 内部光泽效果 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%)',
            }}
          />
        </div>
      </div>

      {/* 积分数字 */}
      <div
        className="w-16 text-right font-orbitron text-xl font-bold shrink-0"
        style={{ color: team.color, textShadow: `0 0 10px ${team.color}80` }}
      >
        {displayScore}
      </div>
    </div>
  );
}

/**
 * 积分柱状图组件
 * - 横向柱状图，按积分从高到低排序
 * - 每个条形使用队伍主题色
 * - 积分变化时弹性动画（使用CSS transition和cubic-bezier弹簧曲线）
 * - 条形宽度根据最大积分比例计算
 * - 左侧显示队伍名称，右侧显示积分数字
 * - 数字滚动动画效果
 */
export default function ScoreBarChart({ teams, className }: ScoreBarChartProps) {
  // 按积分从高到低排序
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  // 获取最大积分
  const maxScore = Math.max(...sortedTeams.map((t) => t.score), 100);

  return (
    <div className={cn('w-full p-5 rounded-2xl bg-space-dark/60 backdrop-blur-sm border border-white/10', className)}>
      {/* 标题 */}
      <h3 className="font-orbitron text-lg font-bold text-cyber-blue mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-cyber-blue rounded-full" />
        实时积分排行
      </h3>

      {/* 积分条列表 */}
      <div className="space-y-1">
        {sortedTeams.map((team, index) => (
          <ScoreBar
            key={team.id}
            team={team}
            maxScore={maxScore}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
