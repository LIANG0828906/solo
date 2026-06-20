import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function RippleButton({ children, variant = 'primary', className = '', ...props }: RippleButtonProps) {
  const base = 'btn-ripple active:scale-95 transition-transform duration-150 font-medium rounded-xl px-5 py-2.5 text-sm';
  const variants = {
    primary: 'bg-gradient-to-r from-warm-orange to-warm-orange-deep text-white shadow-md hover:shadow-lg',
    secondary: 'bg-warm-card border border-warm-border text-warm-brown hover:bg-cream-dark',
    ghost: 'text-warm-brown-light hover:text-warm-brown hover:bg-cream-dark',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
