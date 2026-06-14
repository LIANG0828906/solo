import React, { useState } from 'react';
import './FloatingButton.css';

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  const [ripples, setRipples] = useState<number[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = Date.now();
    setRipples(prev => [...prev, id]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== id));
    }, 600);
    
    onClick();
  };

  return (
    <button
      className="floating-btn"
      onClick={handleClick}
      aria-label="添加照片"
    >
      {ripples.map(id => (
        <span key={id} className="ripple" />
      ))}
      <span className="btn-icon">📷</span>
    </button>
  );
};

export default FloatingButton;
