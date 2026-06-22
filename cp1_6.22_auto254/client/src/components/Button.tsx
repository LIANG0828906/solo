import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'px-4 py-2 rounded-lg font-medium transition-all duration-150 flex items-center justify-center gap-2 min-h-[44px]';

  const variantStyles = {
    primary: 'text-white hover:opacity-90 active:scale-95',
    secondary:
      'bg-transparent border-2 font-medium hover:bg-opacity-10 active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
  };

  const getVariantStyle = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: 'var(--color-button)',
        color: 'var(--color-button-text)',
      };
    }
    if (variant === 'secondary') {
      return {
        borderColor: 'var(--color-button)',
        color: 'var(--color-button)',
      };
    }
    return {};
  };

  const getHoverStyle = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: 'var(--color-button-hover)',
      };
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: 'rgba(140, 120, 83, 0.1)',
      };
    }
    return {};
  };

  return (
    <button
      className={twMerge(
        baseStyles,
        variantStyles[variant],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      style={getVariantStyle()}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, getHoverStyle());
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, getVariantStyle());
        }
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
