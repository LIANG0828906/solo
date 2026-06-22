import { cn } from '@/lib/utils';

// 环形倒计时组件属性
interface CountdownRingProps {
  // 剩余时间（秒）
  timeRemaining: number;
  // 总时间（秒）
  totalTime: number;
  // 自定义类名
  className?: string;
}

// SVG半径
const RADIUS = 60;
// 圆环周长
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * 环形倒计时组件
 * - SVG绘制环形进度条
 * - 剩余时间多时蓝色，少于50%黄色，少于20%红色
 * - 中间显示剩余秒数（大字号）
 * - 平滑动画过渡
 */
export default function CountdownRing({
  timeRemaining,
  totalTime,
  className,
}: CountdownRingProps) {
  // 确保时间不会为负数
  const safeTimeRemaining = Math.max(0, timeRemaining);
  // 计算剩余时间百分比
  const percentage = totalTime > 0 ? safeTimeRemaining / totalTime : 0;
  // 计算进度条偏移量
  const strokeDashoffset = CIRCUMFERENCE * (1 - percentage);

  // 根据剩余时间比例确定颜色
  const getColorClass = (): { stroke: string; text: string; glow: string } => {
    if (percentage <= 0.2) {
      return {
        stroke: '#ff6b6b',
        text: 'text-cyber-red',
        glow: 'drop-shadow-[0_0_15px_rgba(255,107,107,0.8)]',
      };
    }
    if (percentage <= 0.5) {
      return {
        stroke: '#ffd93d',
        text: 'text-cyber-yellow',
        glow: 'drop-shadow-[0_0_15px_rgba(255,217,61,0.8)]',
      };
    }
    return {
      stroke: '#00d4ff',
      text: 'text-cyber-blue',
      glow: 'drop-shadow-[0_0_15px_rgba(0,212,255,0.8)]',
    };
  };

  const colors = getColorClass();

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* SVG环形进度条 */}
      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        className={cn('-rotate-90', colors.glow)}
      >
        {/* 背景圆环 */}
        <circle
          cx="75"
          cy="75"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* 进度圆环 */}
        <circle
          cx="75"
          cy="75"
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>

      {/* 中间剩余时间数字 */}
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-orbitron font-bold text-5xl transition-colors duration-500',
            colors.text
          )}
        >
          {Math.ceil(safeTimeRemaining)}
        </span>
        <span className="text-white/50 text-sm font-rajdhani mt-1">秒</span>
      </div>
    </div>
  );
}
