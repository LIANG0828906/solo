import React, { useState, useCallback } from 'react';

interface RippleButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  color?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  variant = 'primary',
  color,
  onClick,
  disabled = false,
  className = '',
  style = {},
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, [disabled]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.(e);
  };

  const getBackgroundColor = () => {
    if (color) return color;
    switch (variant) {
      case 'primary':
        return '#4f46e5';
      case 'secondary':
        return '#6b7280';
      case 'outline':
        return 'transparent';
      default:
        return '#4f46e5';
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return color || '#4f46e5';
    }
    return '#ffffff';
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return `2px solid ${color || '#4f46e5'}`;
    }
    return 'none';
  };

  const buttonStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    border: getBorder(),
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    ...style,
  };

  const rippleStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: 'scale(0)',
    animation: 'ripple 0.6s ease-out',
    pointerEvents: 'none',
  };

  return (
    <button
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            ...rippleStyle,
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            marginLeft: '-10px',
            marginTop: '-10px',
          }}
        />
      ))}
      {children}
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(20);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

export default RippleButton;
