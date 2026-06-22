import React, { useState, useCallback, useRef } from 'react';

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

const RippleButton = React.memo<RippleButtonProps>(({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'secondary':
        return {
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          color: '#fff',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: '#fff',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        };
      case 'primary':
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
        };
    }
  };

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: rippleIdRef.current++,
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    if (onClick) {
      onClick(e);
    }
  }, [disabled, onClick]);

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={createRipple}
      disabled={disabled}
      className={className}
      style={{
        ...styles.base,
        ...getVariantStyles(),
        ...(disabled ? styles.disabled : {}),
      }}
    >
      <span style={styles.content}>{children}</span>
      <span style={styles.rippleContainer}>
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            style={{
              ...styles.ripple,
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </span>
    </button>
  );
});

RippleButton.displayName = 'RippleButton';

const styles: Record<string, React.CSSProperties> = {
  base: {
    position: 'relative',
    overflow: 'hidden',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  rippleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 'inherit',
  },
  ripple: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: 'scale(0)',
    animation: 'ripple-animation 0.6s ease-out forwards',
    pointerEvents: 'none',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes ripple-animation {
    to {
      transform: scale(1);
      opacity: 0;
    }
  }
`;
document.head.appendChild(styleSheet);

export default RippleButton;
