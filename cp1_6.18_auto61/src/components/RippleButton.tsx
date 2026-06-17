import { useState, useRef, useCallback, type MouseEvent, type ReactNode } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export default function RippleButton({
  children,
  onClick,
  style,
  variant = 'primary',
  disabled = false,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 500);

      onClick?.();
    },
    [onClick, disabled]
  );

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#6C63FF',
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#2A2A44',
      color: '#FFFFFF',
    },
    danger: {
      backgroundColor: 'transparent',
      color: '#FF6B6B',
      border: '1px solid #FF6B6B',
    },
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variantStyles[variant],
        ...style,
        ...(disabled ? styles.disabled : {}),
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            ...styles.ripple,
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  ripple: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    width: 0,
    height: 0,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    animation: 'ripple-animation 0.5s ease-out forwards',
  },
};
