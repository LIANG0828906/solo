import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const sizeStyles = {
    sm: { padding: '4px 10px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: 'var(--color-white)',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-tertiary)',
      color: 'var(--color-text)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'var(--color-white)',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-white)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text)',
    },
  };

  const hoverStyles = !disabled
    ? {
        '&:hover': {
          filter: 'brightness(1.1)',
        },
      }
    : {};

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...hoverStyles,
      }}
    >
      {children}
    </button>
  );
};
