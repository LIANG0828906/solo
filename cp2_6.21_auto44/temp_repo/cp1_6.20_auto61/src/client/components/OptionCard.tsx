import { cn } from '@/lib/utils';

// 选项卡片组件属性
interface OptionCardProps {
  // 选项ID
  id: number;
  // 选项文本
  text: string;
  // 是否选中
  isSelected?: boolean;
  // 是否为正确答案
  isCorrect?: boolean;
  // 是否为错误答案
  isWrong?: boolean;
  // 是否禁用
  disabled?: boolean;
  // 点击回调
  onClick: (id: number) => void;
}

// 选项序号映射
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

/**
 * 选项卡片组件
 * - 四张平行卡片布局，大字号显示选项内容
 * - 悬浮效果：提升Y轴-4px，阴影加深
 * - 点击缩放0.95效果
 * - 选中状态：边框高亮
 * - 正确/错误状态：绿色/红色背景和发光效果
 * - 显示选项序号（A/B/C/D）
 */
export default function OptionCard({
  id,
  text,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  disabled = false,
  onClick,
}: OptionCardProps) {
  // 获取选项序号标签
  const label = OPTION_LABELS[id] || String.fromCharCode(65 + id);

  // 处理点击事件
  const handleClick = () => {
    if (!disabled && !isCorrect && !isWrong) {
      onClick(id);
    }
  };

  // 计算基础样式类名
  const baseClasses = cn(
    'relative w-full p-6 rounded-2xl border-2',
    'flex items-center gap-4',
    'font-rajdhani text-xl font-semibold',
    'select-none',
    'transition-all duration-200 ease-out',
    {
      'cursor-pointer hover:-translate-y-1 hover:shadow-2xl active:scale-[0.95]':
        !disabled && !isCorrect && !isWrong,
      'cursor-not-allowed opacity-70': disabled && !isCorrect && !isWrong,
    }
  );

  // 根据状态计算样式
  const stateClasses = cn({
    // 默认状态
    'bg-space-dark/60 border-white/20 text-white hover:border-cyber-blue/50 hover:bg-space-dark/80':
      !isSelected && !isCorrect && !isWrong,
    // 选中状态
    'bg-cyber-blue/10 border-cyber-blue text-cyber-blue shadow-neon-blue':
      isSelected && !isCorrect && !isWrong,
    // 正确答案状态
    'bg-cyber-green/20 border-cyber-green text-cyber-green shadow-neon-green animate-pulse-slow':
      isCorrect,
    // 错误答案状态
    'bg-cyber-red/20 border-cyber-red text-cyber-red shadow-neon-red': isWrong,
  });

  return (
    <div
      className={cn(baseClasses, stateClasses)}
      onClick={handleClick}
    >
      {/* 选项序号标签 */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'font-orbitron text-2xl font-bold shrink-0',
          'transition-all duration-200',
          {
            'bg-white/10 text-white': !isSelected && !isCorrect && !isWrong,
            'bg-cyber-blue/30 text-cyber-blue': isSelected && !isCorrect && !isWrong,
            'bg-cyber-green/30 text-cyber-green': isCorrect,
            'bg-cyber-red/30 text-cyber-red': isWrong,
          }
        )}
      >
        {label}
      </div>

      {/* 选项文本 */}
      <span className="flex-1 break-words pr-2">{text}</span>

      {/* 选中状态装饰线 */}
      {isSelected && !isCorrect && !isWrong && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-cyber-blue rounded-l-full shadow-[0_0_10px_#00d4ff]" />
      )}
    </div>
  );
}
