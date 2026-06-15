import { CSSProperties } from 'react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  style?: CSSProperties;
  duration?: number;
}

export function AnimatedNumber({
  value,
  decimals = 1,
  className = '',
  style,
  duration = 600,
}: AnimatedNumberProps) {
  const displayValue = useAnimatedNumber(value, duration);
  return (
    <span className={className} style={style}>
      {displayValue.toFixed(decimals)}
    </span>
  );
}
