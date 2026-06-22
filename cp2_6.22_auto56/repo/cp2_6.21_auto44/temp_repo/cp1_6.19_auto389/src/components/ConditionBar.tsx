import '../index.css';

interface ConditionBarProps {
  condition: number;
  showLabel?: boolean;
  height?: string;
}

export default function ConditionBar({ condition, showLabel = false, height = '8px' }: ConditionBarProps) {
  const clampedCondition = Math.max(1, Math.min(10, condition));
  const percentage = (clampedCondition / 10) * 100;

  const getGradient = () => {
    if (clampedCondition <= 3) return 'linear-gradient(90deg, #ef4444, #f87171)';
    if (clampedCondition <= 5) return 'linear-gradient(90deg, #f97316, #fb923c)';
    if (clampedCondition <= 7) return 'linear-gradient(90deg, #eab308, #facc15)';
    return 'linear-gradient(90deg, #22c55e, #4ade80)';
  };

  const getLabel = () => {
    if (clampedCondition <= 3) return '较差';
    if (clampedCondition <= 5) return '一般';
    if (clampedCondition <= 7) return '良好';
    return '优秀';
  };

  const getLabelColor = () => {
    if (clampedCondition <= 3) return 'text-red-500';
    if (clampedCondition <= 5) return 'text-orange-500';
    if (clampedCondition <= 7) return 'text-yellow-600';
    return 'text-green-500';
  };

  return (
    <div className="w-full">
      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: getGradient(),
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs">
          <span className={`font-medium ${getLabelColor()}`}>成色 {clampedCondition}/10</span>
          <span className="text-gray-500">{getLabel()}</span>
        </div>
      )}
    </div>
  );
}
