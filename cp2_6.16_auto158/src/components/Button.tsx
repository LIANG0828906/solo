import React from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-btn transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover/90',
    secondary: 'bg-accent-light text-accent hover:bg-accent-light/80',
    outline: 'border-2 border-border-color text-text-primary hover:border-accent hover:text-accent bg-transparent',
    ghost: 'text-text-secondary hover:text-accent hover:bg-accent-light/50 bg-transparent',
    danger: 'bg-error text-white hover:bg-error/90',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={twMerge(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
