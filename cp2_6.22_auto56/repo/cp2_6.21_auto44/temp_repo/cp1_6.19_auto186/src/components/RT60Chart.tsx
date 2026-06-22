import { useState, useEffect, useRef } from 'react';
import { useSceneStore } from '../store/useSceneStore';

const RT60Chart = () => {
  const rt60Data = useSceneStore((state) => state.rt60Data);
  const [animatedValues, setAnimatedValues] = useState({ low: 0, mid: 0, high: 0 });
  const animationRef = useRef<number | null>(null);
  const startValuesRef = useRef({ low: 0, mid: 0, high: 0 });
  const targetValuesRef = useRef({ low: 0, mid: 0, high: 0 });
  const startTimeRef = useRef(0);

  const springAnimation = (
    current: number,
    target: number,
    velocity: number,
    dt: number
  ): { value: number; velocity: number } => {
    const stiffness = 100;
    const damping = 15;
    const mass = 1;

    const displacement = current - target;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    const newVelocity = velocity + acceleration * dt;
    const newValue = current + newVelocity * dt;

    return { value: newValue, velocity: newVelocity };
  };

  useEffect(() => {
    startValuesRef.current = { ...animatedValues };
    targetValuesRef.current = { ...rt60Data };
    startTimeRef.current = performance.now();

    let velocity = { low: 0, mid: 0, high: 0 };
    let currentValues = { ...animatedValues };
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const lowResult = springAnimation(
        currentValues.low,
        targetValuesRef.current.low,
        velocity.low,
        dt
      );
      const midResult = springAnimation(
        currentValues.mid,
        targetValuesRef.current.mid,
        velocity.mid,
        dt
      );
      const highResult = springAnimation(
        currentValues.high,
        targetValuesRef.current.high,
        velocity.high,
        dt
      );

      currentValues = {
        low: lowResult.value,
        mid: midResult.value,
        high: highResult.value,
      };

      velocity = {
        low: lowResult.velocity,
        mid: midResult.velocity,
        high: highResult.velocity,
      };

      setAnimatedValues(currentValues);

      const diff =
        Math.abs(currentValues.low - targetValuesRef.current.low) +
        Math.abs(currentValues.mid - targetValuesRef.current.mid) +
        Math.abs(currentValues.high - targetValuesRef.current.high);

      if (diff > 0.001 || Math.abs(velocity.low) + Math.abs(velocity.mid) + Math.abs(velocity.high) > 0.001) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rt60Data]);

  const maxValue = Math.max(rt60Data.low, rt60Data.mid, rt60Data.high, 2);
  const chartHeight = 200;

  const bars = [
    { label: '125Hz', value: animatedValues.low, color: '#FF6B6B', key: 'low' },
    { label: '500Hz', value: animatedValues.mid, color: '#4ECDC4', key: 'mid' },
    { label: '2000Hz', value: animatedValues.high, color: '#45B7D1', key: 'high' },
  ];

  return (
    <div className="bg-[#2A2A2A] rounded-lg p-4 w-64">
      <h3 className="text-white text-sm font-medium mb-3">混响时间 RT60</h3>
      <div className="flex items-end justify-around h-[200px] gap-2">
        {bars.map((bar) => {
          const height = maxValue > 0 ? (bar.value / maxValue) * chartHeight : 0;
          return (
            <div key={bar.key} className="flex flex-col items-center flex-1">
              <div
                className="w-full rounded-t transition-all ease-out"
                style={{
                  height: `${Math.max(height, 2)}px`,
                  backgroundColor: bar.color,
                  opacity: 0.9,
                  boxShadow: `0 0 10px ${bar.color}40`,
                }}
              />
              <div className="text-xs text-gray-400 mt-2">{bar.label}</div>
              <div className="text-xs text-white font-mono mt-1">
                {bar.value.toFixed(2)}s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RT60Chart;
