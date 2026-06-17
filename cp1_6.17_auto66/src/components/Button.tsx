import React, { useState } from 'react';
import '../styles/Button.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
}) => {
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, id: Date.now() });
    
    setTimeout(() => setRipple(null), 400);
    
    onClick?.();
  };

  return (
    <button
      className={`btn btn-${variant} btn-${size} ${disabled || loading ? 'btn-disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="btn-spinner" />
      )}
      <span className={loading ? 'btn-content-loading' : ''}>{children}</span>
      {ripple && (
        <span
          key={ripple.id}
          className="btn-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}
    </button>
  );
};

export default Button;
