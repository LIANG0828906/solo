import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAQIStore } from '../store/aqiStore';

export const YearDisplay: React.FC = () => {
  const currentYear = useAQIStore((s) => s.currentYear);

  const props = useSpring({
    number: currentYear,
    from: { number: currentYear },
    config: { tension: 170, friction: 26 },
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <animated.div
        style={{
          fontFamily: 'monospace',
          fontSize: 48,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '0 0 20px rgba(0, 188, 212, 0.6), 0 2px 10px rgba(0,0,0,0.8)',
          letterSpacing: 4,
        }}
      >
        {props.number.to((n) => Math.round(n))}
      </animated.div>
    </div>
  );
};
