import { useState } from 'react';
import { Radio } from 'lucide-react';

interface SonarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function SonarButton({ onClick, disabled = false, size = 'md' }: SonarButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const handleClick = () => {
    if (disabled) return;
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative rounded-full
        bg-gradient-to-br from-electric-blue to-electric-blue-dark
        flex items-center justify-center
        transition-all duration-150
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-600 bg-none' : 'cursor-pointer hover:scale-105 animate-pulse-glow'}
        ${isPressed ? 'scale-95' : ''}
      `}
    >
      <div className="absolute inset-0 rounded-full bg-electric-blue/30 animate-ring-pulse" />
      
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-electric-blue/50 to-electric-blue-dark/50" />
      
      <Radio className={`${iconSizes[size]} text-white relative z-10 drop-shadow-lg`} />
      
      <div className="absolute inset-0 rounded-full bg-white/0 hover:bg-white/10 transition-colors duration-150" />
    </button>
  );
}

export default SonarButton;
