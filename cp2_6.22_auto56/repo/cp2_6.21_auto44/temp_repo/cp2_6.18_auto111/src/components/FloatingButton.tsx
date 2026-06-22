import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
  const [ripple, setRipple] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 300);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-8 right-8 z-40
        w-12 h-12 rounded-full
        bg-[#6366f1] text-white
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        transform
        ${ripple ? 'scale-125' : 'scale-100'}
        ${isHovered ? 'brightness-90' : ''}
      `}
      style={{ filter: isHovered ? 'brightness(0.9)' : 'brightness(1)' }}
    >
      <Plus className={`w-6 h-6 transition-transform duration-300 ${isHovered ? 'rotate-90' : ''}`} />
    </button>
  );
};

export default FloatingButton;
