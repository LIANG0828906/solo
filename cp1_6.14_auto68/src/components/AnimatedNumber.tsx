import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, decimals = 1, className = '', duration = 600 }: AnimatedNumberProps) {
  const displayValue = useAnimatedNumber(value, duration);
  return <span className={className}>{displayValue.toFixed(decimals)}</span>;
}
