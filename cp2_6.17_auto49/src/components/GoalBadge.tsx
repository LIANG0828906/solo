import React, { useEffect, useState } from 'react';
import './GoalBadge.css';

interface GoalBadgeProps {
  show: boolean;
}

const GoalBadge: React.FC<GoalBadgeProps> = ({ show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 600);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className={`goal-badge ${isBlinking ? 'blinking' : ''}`}>
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
