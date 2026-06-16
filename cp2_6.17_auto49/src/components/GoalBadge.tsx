import React, { useEffect, useState, useRef } from 'react';
import './GoalBadge.css';

interface GoalBadgeProps {
  show: boolean;
  triggerKey?: number;
}

const GoalBadge: React.FC<GoalBadgeProps> = ({ show, triggerKey = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const prevShowRef = useRef(false);
  const prevTriggerRef = useRef(0);

  useEffect(() => {
    if (show) {
      if (!prevShowRef.current) {
        setIsVisible(true);
        setAnimationKey((k) => k + 1);
      } else if (triggerKey !== prevTriggerRef.current) {
        setAnimationKey((k) => k + 1);
      }
    } else {
      setIsVisible(false);
    }
    prevShowRef.current = show;
    prevTriggerRef.current = triggerKey;
  }, [show, triggerKey]);

  if (!isVisible) return null;

  return (
    <div key={animationKey} className="goal-badge">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="check-icon"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
};

export default GoalBadge;
