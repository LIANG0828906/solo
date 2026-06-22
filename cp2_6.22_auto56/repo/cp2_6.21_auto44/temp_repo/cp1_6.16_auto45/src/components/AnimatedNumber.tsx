import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedNumber({
  target,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedNumberProps) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number>();
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = value;
    startRef.current = undefined;
    rafRef.current = requestAnimationFrame((timestamp) => {
      startRef.current = timestamp;
      const animate = (now: number) => {
        const elapsed = now - startRef.current!;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValueRef.current + (target - startValueRef.current) * eased;
        setValue(current);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      animate(timestamp);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
