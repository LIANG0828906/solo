import React, { useEffect, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGameStore } from '../store/gameStore';
import { Resources } from '../engine/types';

const ResourceBar: React.FC = () => {
  const resources = useGameStore(s => s.resources);
  return (
    <div className="resource-bar">
      <ResourceItem type="iron" value={resources.iron} label="铁" />
      <ResourceItem type="crystal" value={resources.crystal} label="晶体" />
      <ResourceItem type="energy" value={resources.energy} label="能量" />
    </div>
  );
};

const ResourceItem: React.FC<{
  type: keyof Resources;
  value: number;
  label: string;
}> = ({ type, value, label }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [pulse, setPulse] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const diff = value - prevValue.current;
    if (diff === 0) return;

    const steps = Math.min(Math.abs(diff), 15);
    const stepValue = diff / steps;
    let current = prevValue.current;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += stepValue;
      setDisplayValue(Math.round(current));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
        prevValue.current = value;
      }
    }, 30);

    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [value]);

  const spring = useSpring({
    transform: pulse ? 'scale(1.2)' : 'scale(1)',
    config: { tension: 300, friction: 10 }
  });

  return (
    <div className="resource-item">
      <div className={`resource-icon ${type}`}>
        {type === 'iron' ? 'Fe' : type === 'crystal' ? '◆' : '⚡'}
      </div>
      <div>
        <div className="resource-label">{label}</div>
        <animated.span className={`resource-value ${pulse ? 'pulse' : ''}`} style={spring}>
          {displayValue}
        </animated.span>
      </div>
    </div>
  );
};

export default ResourceBar;
